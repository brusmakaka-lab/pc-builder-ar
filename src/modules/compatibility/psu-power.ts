import type { Cpu, Gpu, Psu } from "@/modules/catalog/types";

export const PSU_POWER_HEADROOM_RATIO = 1.25;

export type PsuPowerCompatibilityReason = {
  code: "INSUFFICIENT_WATTAGE";
  psuWattage: number;
  estimatedLoadWatts: number;
  requiredPsuWatts: number;
};

export type PsuPowerCompatibility =
  | {
      compatible: true;
      psuWattage: number;
      estimatedLoadWatts: number;
      requiredPsuWatts: number;
    }
  | {
      compatible: false;
      reason: PsuPowerCompatibilityReason;
    };

export function estimateCpuGpuLoadWatts(cpu: Cpu, gpu: Gpu) {
  return cpu.tdpWatts + gpu.boardPowerWatts;
}

export function getRequiredPsuWatts(estimatedLoadWatts: number) {
  return Math.ceil(estimatedLoadWatts * PSU_POWER_HEADROOM_RATIO);
}

export function checkPsuPowerCompatibility(
  cpu: Cpu,
  gpu: Gpu,
  psu: Psu,
): PsuPowerCompatibility {
  const estimatedLoadWatts = estimateCpuGpuLoadWatts(cpu, gpu);
  const requiredPsuWatts = getRequiredPsuWatts(estimatedLoadWatts);

  if (psu.wattage >= requiredPsuWatts) {
    return {
      compatible: true,
      psuWattage: psu.wattage,
      estimatedLoadWatts,
      requiredPsuWatts,
    };
  }

  return {
    compatible: false,
    reason: {
      code: "INSUFFICIENT_WATTAGE",
      psuWattage: psu.wattage,
      estimatedLoadWatts,
      requiredPsuWatts,
    },
  };
}
