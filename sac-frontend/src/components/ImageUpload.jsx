import { useRef, useState } from "react";

export default function ImageUpload({
  onPickFile,
  onAnalyze,
  canAnalyze,
  loading,
  fileName
}) {
  const ref = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const handlePickFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL and get dimensions
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = evt.target?.result;
        setImagePreview(evt.target?.result);
      };
      reader.readAsDataURL(file);
    }
    onPickFile(e);
  };

  // Calculate box height based on image aspect ratio (max width 100%, scale height accordingly)
  const maxWidth = 500; // max width in pixels
  let boxHeight = 300; // default fallback height
  // let boxWidth = maxWidth;
  
  if (imageDimensions.width && imageDimensions.height) {
    const aspectRatio = imageDimensions.height / imageDimensions.width;
    boxHeight = Math.min(maxWidth * aspectRatio, 600); // cap at 600px height
  }

  return (
    <>
      <input
        ref={ref}
        className="fileHidden"
        type="file"
        accept="image/*,.webp,image/webp,.tif,.tiff,image/tiff,.bmp,image/bmp,.ico,image/x-icon"
        onChange={handlePickFile}
      />

      <button
        type="button"
        className="uploadBox"
        onClick={() => ref.current?.click()}
        style={{
          height: imagePreview ? `${boxHeight}px` : "54px",
          transition: "height 0.3s ease",
        }}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="uploadPreview" />
        ) : (
          <span className="uploadText">{fileName || "Choose Image"}</span>
        )}
      </button>

      <button
        className="primaryBtn"
        type="button"
        onClick={onAnalyze}
        disabled={!canAnalyze}
      >
        {loading ? "Analyzing..." : "Analyze Image"}
      </button>
    </>
  );
}
