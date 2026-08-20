import type { Cpu, CpuCooler, CpuSocket } from "@/modules/catalog/types";
import type { CompatibilityCheckResult } from "./types";

export type CpuCoolerSocketCompatibilityReason = {
  code: "CPU_SOCKET_NOT_SUPPORTED";
  cpuSocket: CpuSocket;
  supportedSockets: readonly CpuSocket[];
};

export type CpuCoolerSocketCompatibility =
  CompatibilityCheckResult<CpuCoolerSocketCompatibilityReason>;

export function checkCpuCoolerSocketCompatibility(
  cpu: Cpu,
  cpuCooler: CpuCooler,
): CpuCoolerSocketCompatibility {
  if (cpuCooler.supportedSockets.includes(cpu.socket)) {
    return { compatible: true };
  }

  return {
    compatible: false,
    reason: {
      code: "CPU_SOCKET_NOT_SUPPORTED",
      cpuSocket: cpu.socket,
      supportedSockets: cpuCooler.supportedSockets,
    },
  };
}
