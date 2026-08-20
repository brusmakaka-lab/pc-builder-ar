import type { Motherboard, PcCase } from "../catalog/types";
import type { CompatibilityCheckResult } from "./types";

export type MotherboardCaseCompatibilityReason = {
  code: "FORM_FACTOR_NOT_SUPPORTED";
  motherboardFormFactor: Motherboard["formFactor"];
  supportedMotherboardFormFactors: PcCase["supportedMotherboardFormFactors"];
};

export type MotherboardCaseCompatibility =
  CompatibilityCheckResult<MotherboardCaseCompatibilityReason>;

export function checkMotherboardCaseCompatibility(
  motherboard: Motherboard,
  pcCase: PcCase,
): MotherboardCaseCompatibility {
  if (
    pcCase.supportedMotherboardFormFactors.includes(motherboard.formFactor)
  ) {
    return { compatible: true };
  }

  return {
    compatible: false,
    reason: {
      code: "FORM_FACTOR_NOT_SUPPORTED",
      motherboardFormFactor: motherboard.formFactor,
      supportedMotherboardFormFactors:
        pcCase.supportedMotherboardFormFactors,
    },
  };
}
