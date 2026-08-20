import type { Gpu, PcCase } from "../catalog/types";

export type GpuCaseCompatibility =
  | {
      compatible: true;
    }
  | {
      compatible: false;
      reason: {
        code: "GPU_LENGTH_EXCEEDED";
        gpuLengthMm: number;
        maxGpuLengthMm: number;
      };
    };

export function checkGpuCaseCompatibility(
  gpu: Gpu,
  pcCase: PcCase,
): GpuCaseCompatibility {
  if (gpu.lengthMm <= pcCase.maxGpuLengthMm) {
    return { compatible: true };
  }

  return {
    compatible: false,
    reason: {
      code: "GPU_LENGTH_EXCEEDED",
      gpuLengthMm: gpu.lengthMm,
      maxGpuLengthMm: pcCase.maxGpuLengthMm,
    },
  };
}
