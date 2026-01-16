/**
 * Detect output image format from MIME type and filename
 * This is SERVER-TRUTH (not AI)
 */

function detectOutputFormat(mime, filename = "") {
  const m = String(mime || "").toLowerCase().trim();

  // 1) MIME-based detection (most reliable)
  if (m === "image/jpeg" || m === "image/jpg") return "JPG";
  if (m === "image/png") return "PNG";

  // 2) Extension fallback (Windows / browser edge cases)
  const ext = String(filename).toLowerCase().split(".").pop();
  if (ext === "jpg" || ext === "jpeg") return "JPG";
  if (ext === "png") return "PNG";

  // 3) Any other image type
  return "Not applicable";
}

module.exports = { detectOutputFormat };
