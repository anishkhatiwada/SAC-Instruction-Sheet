const sharp = require("sharp");
const NA = "Not Applicable";

function classify(w, h) {
  if (!w || !h) return NA;

  const r = w / h;

  // Square
  if (r >= 0.9 && r <= 1.1) return "1:1";

  // Portrait
  if (r < 0.9) {
    if (r < 0.72) return "9:16";   // very tall
    return "3:4";                 // normal tall
  }

  // Landscape
  if (r > 1.1) {
    if (r > 2.0) return "21:9";    // ultra wide
    if (r > 1.45) return "16:9";   // video wide
    return "4:3";                 // normal wide
  }

  return NA;
}

async function detectAspectRatioAny(buffer) {
  try {
    const meta = await sharp(buffer, { failOnError: false }).metadata();
    const w = meta.width;
    const h = meta.height;

    return {
      label: classify(w, h),
      width: w,
      height: h,
    };
  } catch (e) {
    return {
      label: NA,
      width: null,
      height: null,
      error: e.message,
    };
  }
}

module.exports = detectAspectRatioAny;
