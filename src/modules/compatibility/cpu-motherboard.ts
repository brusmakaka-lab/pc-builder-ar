import type { Cpu, Motherboard } from "@/modules/catalog/types";

export type CpuMotherboardCompatibility =
  | { compatible: true }
  | {
      compatible: false;
      reason: "socket_mismatch";
      cpuSocket: string;
      motherboardSocket: string;
    };

export function checkCpuMotherboardCompatibility(
  cpu: Cpu,
  motherboard: Motherboard,
): CpuMotherboardCompatibility {
  if (cpu.socket === motherboard.socket) {
    return { compatible: true };
  }

  return {
    compatible: false,
    reason: "socket_mismatch",
    cpuSocket: cpu.socket,
    motherboardSocket: motherboard.socket,
  };
}
