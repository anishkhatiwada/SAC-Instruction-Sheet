import { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import FieldForm from "./components/FieldForm";
import "./App.css";

export default function App() {
  const [step, setStep] = useState("upload");
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/avif"];


  const canAnalyze = Boolean(image) && !loading;

const detectTypeClient = (file) => {
  const t = (file?.type || "").toLowerCase();
  const name = (file?.name || "").toLowerCase();

  if (t === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "JPG";
  if (t === "image/png" || name.endsWith(".png")) return "PNG";
  if (t === "image/webp" || name.endsWith(".webp")) return "WebP";
  if (t === "image/gif" || name.endsWith(".gif")) return "GIF";
  if (t === "image/bmp" || t === "image/x-bmp" || name.endsWith(".bmp")) return "BMP";
  if (t === "image/tiff" || name.endsWith(".tif") || name.endsWith(".tiff")) return "TIFF";
  if (t === "image/x-icon" || t === "image/vnd.microsoft.icon" || name.endsWith(".ico")) return "ICO";
  return "Not applicable";
};

const onPickFile = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;

  setImage(f);
  setFileName(f.name);

  // ✅ instant detection
  const detected = detectTypeClient(f);
  setValues((prev) => ({
    ...(prev || {}),
    output_format: detected,
  }));

  setError("");
  setStep("upload");
  e.target.value = "";
};

  const onAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("image", image);

      const res = await fetch("http://localhost:5050/api/analyze", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Analyze failed");

      setValues(json.data);
      setStep("form");
    } catch (e) {
      setError(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">SAC Instruction Sheet</h1>
        <p className="subtitle">Image Analysis</p>

        {step === "upload" && (
          <ImageUpload
            onPickFile={onPickFile}
            onAnalyze={onAnalyze}
            canAnalyze={canAnalyze}
            loading={loading}
            fileName={fileName}
          />
        )}

        {error && <div className="error">{error}</div>}

        {step === "form" && values && (
          <FieldForm values={values} setValues={setValues} />
        )}
      </div>
    </div>
  );
}
