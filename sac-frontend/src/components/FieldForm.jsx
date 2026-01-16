import { useEffect, useMemo, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SacPdf from "../SacPdf";
import "../assets/stylesheet/formfields.css";

export default function FieldForm({ values, setValues }) {
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [fieldsError, setFieldsError] = useState("");

  /* ===============================
     LOAD FIELDS FROM BACKEND
     =============================== */
  useEffect(() => {
    let alive = true;

    async function loadFields() {
      try {
        setLoadingFields(true);
        setFieldsError("");

        const res = await fetch("http://localhost:5050/api/fields");
        const json = await res.json();

        if (!json.ok) throw new Error(json.error || "Failed to load fields");
        if (!alive) return;

        setFields(json.fields || []);
      } catch (e) {
        if (!alive) return;
        setFieldsError(e.message || "Failed to load fields");
      } finally {
        if (!alive) return;
        setLoadingFields(false);
      }
    }

    loadFields();
    return () => {
      alive = false;
    };
  }, []);

  /* ===============================
     APPLY DEFAULT VALUES (SAFE)
     =============================== */
  useEffect(() => {
    if (!fields.length) return;

    setValues((prev) => {
      const base = prev && typeof prev === "object" ? { ...prev } : {};
      let changed = false;

      for (const f of fields) {
        const key = f.key;
        const opts = f.options || [];

        // If no value provided, set to first option (or empty)
        if (
          !(key in base) ||
          base[key] === undefined ||
          base[key] === null ||
          base[key] === ""
        ) {
          base[key] = opts.length ? opts[0] : "";
          changed = true;
        }

        // Enforce that the value must be one of the provided options for selects.
        // If the detected/server value isn't in opts, choose "Not Applicable" when available.
        if (opts.length && base[key] !== undefined && base[key] !== null && base[key] !== "") {
          const has = opts.includes(base[key]);
          if (!has) {
            const na = opts.find((o) => o === "Not Applicable");
            base[key] = na || opts[0];
            changed = true;
          }
        }
      }

      return changed ? base : prev;
    });
  }, [fields, setValues]);

  /* ===============================
     UPDATE SINGLE FIELD
     =============================== */
  const setField = (key, value) => {
    setValues((prev) => ({ ...(prev || {}), [key]: value }));
  };

  /* ===============================
     PDF MEMO
     =============================== */
  const pdfDoc = useMemo(() => <SacPdf values={values || {}} />, [values]);

  /* ===============================
     STATES
     =============================== */
  if (loadingFields) {
    return <div className="formMsg">Loading fields...</div>;
  }

  if (fieldsError) {``
    return <div className="formError">Fields error: {fieldsError}</div>;
  }

  /* ===============================
     RENDER
     =============================== */
  return (
    <div className="fieldForm">
      {/* ===== FIELDS ===== */}
      {fields.map((f) => {
        return (
          <div key={f.key} className="fieldRow">
            <div className="label">
              {f.label || f.key}
            </div>

            {f.options && f.options.length ? (
              (() => {
                const currentValue = (values && values[f.key]) || "";
                const opts = f.options || [];
                const hasCurrent = opts.includes(currentValue);

                return (
                  <select
                    className="select"
                    value={currentValue}
                    onChange={(e) => setField(f.key, e.target.value)}
                  >
                    {/* If the current detected value isn't in the options, inject it so it's visible and selected */}
                    {!hasCurrent && currentValue ? (
                      <option key="__detected" value={currentValue}>
                        {currentValue}
                      </option>
                    ) : null}

                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                );
              })()
            ) : (
              <input
                className="input"
                value={(values && values[f.key]) || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                placeholder="Type here..."
              />
            )}
          </div>
        );
      })}

      {/* ===== GENERATE PDF ===== */}
      <div className="pdfButtonWrap">
        <PDFDownloadLink document={pdfDoc} fileName="sac-instruction.pdf">
          {({ loading }) => (
            <button className="primaryBtn" type="button" disabled={loading}>
              {loading ? "Preparing PDF..." : "Generate PDF"}
            </button>
          )}
        </PDFDownloadLink>
      </div>
    </div>
  );
}
