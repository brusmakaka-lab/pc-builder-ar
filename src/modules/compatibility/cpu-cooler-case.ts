import type { CpuCooler, PcCase } from "@/modules/catalog/types";
import type { CompatibilityCheckResult } from "./types";

export type CpuCoolerCaseCompatibilityReason = {
  code: "CPU_COOLER_HEIGHT_EXCEEDED";
  cpuCoolerHeightMm: number;
  maxCpuCoolerHeightMm: number;
};

export type CpuCoolerCaseCompatibility =
  CompatibilityCheckResult<CpuCoolerCaseCompatibilityReason>;

export function checkCpuCoolerCaseCompatibility(
  cpuCooler: CpuCooler,
  pcCase: PcCase,
): CpuCoolerCaseCompatibility {
  if (cpuCooler.heightMm <= pcCase.maxCpuCoolerHeightMm) {
    return { compatible: true };
  }

  return {
    compatible: false,
    reason: {
      code: "CPU_COOLER_HEIGHT_EXCEEDED",
      cpuCoolerHeightMm: cpuCooler.heightMm,
      maxCpuCoolerHeightMm: pcCase.maxCpuCoolerHeightMm,
    },
  };
}
