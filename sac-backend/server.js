// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const OpenAI = require("openai");

const detectAspectRatioAny = require("./utils/detectAspectRatioAny");
const { cityToNationality } = require("./utils/cityNationality");

const app = express();
app.use(cors());

/* ---------------- Upload ---------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

/* ---------------- OpenAI ---------------- */
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ---------------- Shared Fields ---------------- */
const FIELDS = require(path.join(__dirname, "../shared/filefield.json"));

/* ---------------- Constants ---------------- */
const NA = "Not Applicable"; // must match EXACTLY your dropdown option text

/* ---------------- Helpers ---------------- */
function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

// server “truth” for output_format from mimetype + filename
function detectOutputFormat(mime, filename = "") {
  const m = normalize(mime);

  if (m === "image/jpeg" || m === "image/jpg") return "JPG";
  if (m === "image/png") return "PNG";

  const ext = String(filename || "").toLowerCase().split(".").pop();
  if (ext === "jpg" || ext === "jpeg") return "JPG";
  if (ext === "png") return "PNG";

  return NA;
}

// pick ONE valid option (or free text)
function pickValidOption(aiValue, options) {
  if (!options || options.length === 0) {
    return typeof aiValue === "string" ? aiValue : "";
  }
  const v = Array.isArray(aiValue) ? String(aiValue[0] ?? "") : String(aiValue ?? "");
  const raw = v.trim();
  if (!raw) return "";

  // 1) exact match
  if (options.includes(raw)) return raw;

  const nv = normalize(raw);

  // 2) case-insensitive exact
  const ciExact = options.find((opt) => normalize(opt) === nv);
  if (ciExact) return ciExact;

  // 3) substring matches
  const contains = options.find((opt) => nv.includes(normalize(opt)) || normalize(opt).includes(nv));
  if (contains) return contains;

  // 4) fuzzy match using normalized Levenshtein similarity
  function levenshtein(a, b) {
    const la = a.length;
    const lb = b.length;
    if (la === 0) return lb;
    if (lb === 0) return la;
    const matrix = Array.from({ length: la + 1 }, () => new Array(lb + 1));
    for (let i = 0; i <= la; i++) matrix[i][0] = i;
    for (let j = 0; j <= lb; j++) matrix[0][j] = j;
    for (let i = 1; i <= la; i++) {
      for (let j = 1; j <= lb; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[la][lb];
  }

  let bestOpt = "";
  let bestSim = -1;
  for (const opt of options) {
    const a = normalize(opt);
    const maxLen = Math.max(a.length, nv.length) || 1;
    const dist = levenshtein(a, nv);
    const sim = 1 - dist / maxLen; // 1.0 = exact, 0.0 = totally different
    if (sim > bestSim) {
      bestSim = sim;
      bestOpt = opt;
    }
  }

  // similarity threshold — only accept a fuzzy match when reasonably close
  const SIM_THRESHOLD = 0.72;

  if (process.env.DEBUG_MAPPING === "1") {
    console.log("[MAPPING] raw=", raw, "best=", bestOpt, "sim=", bestSim.toFixed(3));
  }

  return bestSim >= SIM_THRESHOLD ? bestOpt : "";
}

function fallbackValue(options) {
  if (!options || options.length === 0) return "";
  const naOpt = options.find((o) => normalize(o) === normalize(NA));
  return naOpt || options[0];
}

function extractJson(raw) {
  const s = String(raw || "").trim();
  const noFences = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(noFences);
  } catch {}

  const start = noFences.indexOf("{");
  const end = noFences.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return JSON.parse(noFences.slice(start, end + 1));
  }

  throw new Error("No valid JSON found");
}

function buildJsonSchema(fields) {
  const properties = {};
  const required = [];

  for (const f of fields) {
    required.push(f.key);
    if (f.options && f.options.length) {
      properties[f.key] = { type: "string", enum: f.options };
    } else {
      properties[f.key] = { type: "string" };
    }
  }

  return {
    type: "json_schema",
    name: "image_analysis_result",
    strict: true,
    schema: {
      type: "object",
      properties,
      required,
      additionalProperties: false,
    },
  };
}

/* ---------------- Routes ---------------- */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.OPENAI_API_KEY) });
});

app.get("/api/fields", (req, res) => {
  res.json({ ok: true, fields: Array.isArray(FIELDS) ? FIELDS : [] });
});

app.post("/api/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ ok: false, error: "Missing OPENAI_API_KEY in .env" });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No image uploaded" });
    }

    // ---- SERVER DETECTIONS ----
    const ar = await detectAspectRatioAny(req.file.buffer); // { label, width, height, error? }
    const serverOutputFormat = detectOutputFormat(req.file.mimetype, req.file.originalname);

    console.log("ASPECT DEBUG:", {
      file: req.file.originalname,
      mime: req.file.mimetype,
      width: ar.width,
      height: ar.height,
      label: ar.label,
      error: ar.error || null,
    });

    // ---- Build data URL for vision ----
    const mime = req.file.mimetype || "application/octet-stream";
    const base64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${mime};base64,${base64}`;

    // ✅ KEEP PROMPT SHORT (schema enforces enums)
    // Note: if you want nationality from ANY city, do it server-side using cityToNationality().
    const prompt = `
You are an image classification assistant.

Rules:
- Output must follow the JSON schema exactly.
- For enum fields: choose one valid option.
- If unsure, choose "${NA}" if that option exists for that field.
- additional_words: max 10 words.

-----------------------
PURPOSE DETECTION RULES:
Analyze the image to determine its intended use based on:
- Aspect ratio (square=icon/profile, wide=banner/SNS, tall=TikTok/YT, etc.)
- Composition and framing (full product shot=e-commerce, decorative=illustration, etc.)
- Visual style (professional=ad/presentation, casual=SNS post, minimalist=icon, etc.)
- Content type (person=profile/SNS, food=e-commerce, illustration=blog/presentation, etc.)

Purpose category rules:
- Square 1:1 ratio with centered subject → Profile Icon
- Tall 9:16 ratio with character/scene → TikTok Thumbnail / Short Video Use
- Wide 16:9 ratio with polished design → YouTube Thumbnail or Ad Banner
- Professional product photo on neutral background → E-commerce Product Image
- Wide banner-style composition with text/graphics → Ad Banner
- Illustrative/artistic content → Blog / Media Illustration Image
- Stylized illustration (anime/manga/digital art) → Presentation Illustration or LINE-style Stamp Image
- Vibrant, eye-catching design with promotional text → App Promotional Visual or Event Announcement Visual
- If none clearly match → Not Applicable

-----------------------
GENDER IDENTIFICATION RULES (VERY IMPORTANT):
Analyze facial structure and body proportions, such as:
jawline shape
forehead and brow ridge
cheekbone structure
chin shape
shoulder-to-hip ratio (only if visible)
Gender category rules:
If the person’s features clearly present feminine traits → Female
If the person’s features clearly present masculine traits → Male
If the person appears androgynous or shows a blend of masculine & feminine traits → Non-binary
If  low resolution, stylized, obstructed, or not enough information is available → Unknown
When in doubt:
Always choose Unknown rather than guessing.
CHARACTER GENDER RULES (ANIME, MANGA, CARTOON):
For stylized/illustrated characters, analyze design cues:
- Hair length & style (long = female, short/spiked = male, layered = often female)
- Hair color (bright pink/purple/light = often female in anime/manga)
- Eye size (exaggerated large eyes = often female)
- Facial shape (round/soft = feminine, angular = masculine)
- Body shape (curves/hourglass = feminine, rectangular/broad = masculine)
- Breasts/chest (visible curves = female, flat/broad = often male)
- Clothing (dress/skirt/bow = feminine, shirt/pants = masculine)
- Accessories (ribbons, bows = often feminine, minimal = often masculine)
- Overall silhouette (slim/curved = feminine, tall/broad = masculine)

Character gender assessment:
- Clear feminine design cues → Female
- Clear masculine design cues → Male
- Mix of masculine and feminine → Non-binary
- Too stylized or ambiguous → Unknown
Always choose Unknown rather than guessing on characters.Back-View Gender Inference Rule (EXPLICIT PERMISSION):
 
If the face is not visible, the model MAY infer gender from:
- body silhouette
- leg shape
- posture
- clothing style
- footwear
- overall presentation
 
If these cues strongly align with common feminine presentation → Female  
If they strongly align with masculine presentation → Male  
Only return Unknown if cues are extremely ambiguous.
-----------------------
HUMAN VS CHARACTER RULES:
- If the image shows drawn, illustrated, animated, or stylized features typical of anime, manga, comics, 2D art, 3D characters, or cartoons → classify the subject as "Character".
- Indicators of "Character":
  • Exaggerated large eyes  
  • Unnatural hair colors (pink, blue, green, etc.)  
  • Visible line art or cel-shading  
  • Flat or simplified shading  
  • Smooth, textureless skin  
- Real photographs with realistic skin texture, lighting, depth of field, fabric texture → classify as "Human".

-----------------------
NATIONALITY RECOGNITION RULE (SAFE):
Identify nationality ONLY when it is clearly indicated by explicit visual cues such as:
 
- Flags
- Written language on signs, clothing, or documents
- National uniforms (sports team, military, police, airline, etc.)
- Recognizable landmarks or architecture
- Cultural symbols that are unambiguous (e.g., Statue of Liberty, Eiffel Tower)
 
CULTURE RECOGNITION RULE:
You MAY identify cultural styles (e.g., Indian traditional clothing, Indian wedding attire,
Indian festival decorations), but you MUST NOT label a person's nationality from facial
features or skin tone.
 
 
If nationality cannot be determined from explicit visual evidence,
return EXACTLY: "Not applicable".
ADDITIONAL_WORDS RULE:
- Select EXACTLY ONE value from the "additional_words" options list.
- Choose the word that best describes the MOST PROMINENT visual feature of the image.
- Base your decision ONLY on what is clearly visible in the image.

You MAY consider:
- Scene type (portrait, landscape, indoor, outdoor)
- Main subject (person, object, place, document)
- Activity (walking, sitting, posing, working)
- Mood or style if clearly visible (formal, casual, festive, minimal)

STRICT CONSTRAINTS:
- Do NOT invent new words.
- Do NOT combine words.
- Do NOT explain your choice.
- If NONE of the options clearly match the image, return EXACTLY: "Not Applicable".
- If multiple options could apply, choose the SINGLE most dominant one.

`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
      text: { format: buildJsonSchema(FIELDS) },
      temperature: 0,
      max_output_tokens: 2000,
    });

    const raw = (response.output_text || "").trim();

    let data;
    try {
      data = extractJson(raw);
    } catch {
      return res.status(500).json({
        ok: false,
        error: "Model did not return valid JSON",
        raw,
      });
    }

    // ---- Validate + fix all fields ----
    const fixed = {};
    for (const f of FIELDS) {
      const key = f.key;
      const opts = f.options || [];
      const chosen = pickValidOption(data?.[key], opts);
      fixed[key] = chosen || fallbackValue(opts);
    }

    // ---- FORCE server-controlled fields ----

    // 1) output_format forced by server truth
    if (Object.prototype.hasOwnProperty.call(fixed, "output_format")) {
      const outField = FIELDS.find((x) => x.key === "output_format");
      const outOpts = outField?.options || [];
      const match = outOpts.find((o) => normalize(o) === normalize(serverOutputFormat));
      fixed.output_format = match || fallbackValue(outOpts);
    }

    // 2) aspect_ratio forced by server detection
    if (Object.prototype.hasOwnProperty.call(fixed, "aspect_ratio")) {
      const arField = FIELDS.find((x) => x.key === "aspect_ratio");
      const arOpts = arField?.options || [];
      const match = arOpts.find((o) => normalize(o) === normalize(ar.label));
      // If the detected label matches one of the dropdown options, use it.
      // Otherwise, allow the server-detected label (e.g., "5:7") to be returned
      // so the system can represent arbitrary aspect ratios.
      fixed.aspect_ratio = match || ar.label || fallbackValue(arOpts);
    }

    // 3) nationality from ANY city (server-side mapping)
    // IMPORTANT: change CITY_KEY if your JSON uses a different key name
    const CITY_KEY = "city";
    const NAT_KEY = "nationality";

    if (
      Object.prototype.hasOwnProperty.call(fixed, CITY_KEY) &&
      Object.prototype.hasOwnProperty.call(fixed, NAT_KEY)
    ) {
      const mappedNationality = cityToNationality(fixed[CITY_KEY]);
      if (mappedNationality && fixed[NAT_KEY] === NA) {
        // Only override when AI returned Not Applicable
        // Ensure mappedNationality matches one of your dropdown options:
        const natField = FIELDS.find((x) => x.key === NAT_KEY);
        const natOpts = natField?.options || [];
        const match = natOpts.find((o) => normalize(o) === normalize(mappedNationality));
        fixed[NAT_KEY] = match || fixed[NAT_KEY];
      }
    }

    return res.json({
      ok: true,
      data: fixed,
      detected: {
        output_format: serverOutputFormat,
        aspect_ratio: ar.label,
      },
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      ok: false,
      error: err.message || "OpenAI request failed",
      status: err.status,
      code: err.code,
      type: err.type,
    });
    
  }
});

app.listen(5050, () => console.log("✅ Backend running http://localhost:5050"));
