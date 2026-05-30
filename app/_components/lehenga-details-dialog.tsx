"use client";

import { useState } from "react";

import {
  createMeasurementDraft,
  EMPTY_LEHENGA_MEASUREMENTS,
  saveLehengaMeasurements,
} from "../_lib/lehenga-measurements";
import type { LehengaMeasurements } from "../_lib/store-types";

const MEASUREMENT_FIELDS: Array<{
  key: keyof LehengaMeasurements;
  label: string;
  placeholder: string;
}> = [
  { key: "upper", label: "Upper", placeholder: "in inches" },
  { key: "chest", label: "Chest", placeholder: "in inches" },
  { key: "waist", label: "Waist", placeholder: "in inches" },
  { key: "armHole", label: "Arm hole", placeholder: "in inches" },
  { key: "mori", label: "Mori", placeholder: "in inches" },
];

export function LehengaDetailsDialog({
  initialMeasurements,
  onClose,
  onSubmit,
}: {
  productName: string;
  initialMeasurements?: LehengaMeasurements;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (measurements: LehengaMeasurements) => void;
}) {
  const draft = createMeasurementDraft(initialMeasurements);
  const [measurements, setMeasurements] = useState<LehengaMeasurements>(draft.measurements ?? EMPTY_LEHENGA_MEASUREMENTS);
  const [saveForNextTime, setSaveForNextTime] = useState(draft.hasSavedMeasurements);

  return (
    <div className="measurements-overlay" role="dialog" aria-modal="true" aria-labelledby="measurements-title">
      <div className="measurements-modal">
        <div className="measurements-modal-header">
          <h2 id="measurements-title">Measurements</h2>
          <button type="button" className="measurements-close" onClick={onClose} aria-label="Close details form">
            ×
          </button>
        </div>

        <div className="measurements-form">
          {MEASUREMENT_FIELDS.map((field) => (
            <label key={field.key} className="product-detail-field">
              <span>{field.label}</span>
              <input
                value={measurements[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setMeasurements((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}

          <label className="product-detail-field">
            <span>Others</span>
            <textarea
              rows={3}
              value={measurements.notes ?? ""}
              placeholder="Write additional stitching or fit notes"
              onChange={(event) =>
                setMeasurements((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
            />
          </label>

          <label className="measurements-save-toggle">
            <input
              type="checkbox"
              checked={saveForNextTime}
              onChange={(event) => setSaveForNextTime(event.target.checked)}
            />
            <span>Save these details for next time</span>
          </label>

          <button
            type="button"
            className="measurements-submit"
            onClick={() => {
              if (saveForNextTime) {
                saveLehengaMeasurements(measurements);
              }

              onSubmit(measurements);
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
