import type { Cpu, Gpu, Psu } from "@/modules/catalog/types";

export const SYSTEM_BASE_POWER_WATTS = 100;
export const PSU_HEADROOM_RATIO = 1.25;

export type PsuPowerEstimate = {
  cpuWatts: number;
  gpuWatts: number;
  systemBaseWatts: number;
  estimatedComponentWatts: number;
  estimatedLoadWatts: number;
  headroomRatio: number;
  requiredPsuWatts: number;
};

export type PsuPowerCompatibilityReason = {
  code: "INSUFFICIENT_WATTAGE";
  psuWattage: number;
  estimate: PsuPowerEstimate;
};

export type PsuPowerCompatibility =
  | {
      compatible: true;
      psuWattage: number;
      estimate: PsuPowerEstimate;
    }
  | {
      compatible: false;
      reason: PsuPowerCompatibilityReason;
    };

export function estimateComponentLoadWatts(cpu: Cpu, gpu: Gpu) {
  return cpu.tdpWatts + gpu.boardPowerWatts;
}

export function getEstimatedLoadWatts(estimatedComponentWatts: number) {
  return estimatedComponentWatts + SYSTEM_BASE_POWER_WATTS;
}

export function getRequiredPsuWatts(estimatedLoadWatts: number) {
  return Math.ceil(estimatedLoadWatts * PSU_HEADROOM_RATIO);
}

export function estimatePsuPower(cpu: Cpu, gpu: Gpu): PsuPowerEstimate {
  const estimatedComponentWatts = estimateComponentLoadWatts(cpu, gpu);
  const estimatedLoadWatts = getEstimatedLoadWatts(estimatedComponentWatts);

  return {
    cpuWatts: cpu.tdpWatts,
    gpuWatts: gpu.boardPowerWatts,
    systemBaseWatts: SYSTEM_BASE_POWER_WATTS,
    estimatedComponentWatts,
    estimatedLoadWatts,
    headroomRatio: PSU_HEADROOM_RATIO,
    requiredPsuWatts: getRequiredPsuWatts(estimatedLoadWatts),
  };
}

export function checkPsuPowerCompatibility(
  cpu: Cpu,
  gpu: Gpu,
  psu: Psu,
): PsuPowerCompatibility {
  const estimate = estimatePsuPower(cpu, gpu);

  if (psu.wattage >= estimate.requiredPsuWatts) {
    return {
      compatible: true,
      psuWattage: psu.wattage,
      estimate,
    };
  }

  return {
    compatible: false,
    reason: {
      code: "INSUFFICIENT_WATTAGE",
      psuWattage: psu.wattage,
      estimate,
    },
  };
}
