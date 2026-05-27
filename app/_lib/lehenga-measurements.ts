"use client";

import type { LehengaMeasurements } from "./store-types";

const SAVED_LEHENGA_MEASUREMENTS_KEY = "lehenga-saved-measurements";

export const EMPTY_LEHENGA_MEASUREMENTS: LehengaMeasurements = {
  upper: "",
  chest: "",
  waist: "",
  armHole: "",
  mori: "",
  notes: "",
};

function normalizeMeasurements(value?: LehengaMeasurements | null): LehengaMeasurements {
  return {
    upper: value?.upper ?? "",
    chest: value?.chest ?? "",
    waist: value?.waist ?? "",
    armHole: value?.armHole ?? "",
    mori: value?.mori ?? "",
    notes: value?.notes ?? "",
  };
}

export function readSavedLehengaMeasurements() {
  if (typeof window === "undefined") {
    return { measurements: normalizeMeasurements(), hasSavedMeasurements: false };
  }

  const raw = window.localStorage.getItem(SAVED_LEHENGA_MEASUREMENTS_KEY);

  if (!raw) {
    return { measurements: normalizeMeasurements(), hasSavedMeasurements: false };
  }

  try {
    return {
      measurements: normalizeMeasurements(JSON.parse(raw) as LehengaMeasurements),
      hasSavedMeasurements: true,
    };
  } catch {
    window.localStorage.removeItem(SAVED_LEHENGA_MEASUREMENTS_KEY);
    return { measurements: normalizeMeasurements(), hasSavedMeasurements: false };
  }
}

export function saveLehengaMeasurements(measurements: LehengaMeasurements) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SAVED_LEHENGA_MEASUREMENTS_KEY,
    JSON.stringify(normalizeMeasurements(measurements)),
  );
}

export function createMeasurementDraft(initialMeasurements?: LehengaMeasurements | null) {
  const normalizedInitialMeasurements = normalizeMeasurements(initialMeasurements);
  const hasInitialMeasurements = Object.values(normalizedInitialMeasurements).some((value) => value.trim().length > 0);

  if (hasInitialMeasurements) {
    return {
      measurements: normalizedInitialMeasurements,
      hasSavedMeasurements: false,
    };
  }

  return readSavedLehengaMeasurements();
}
