import type { Cpu, CpuSocket, Motherboard } from "@/modules/catalog/types";

export type CpuMotherboardCompatibilityReason = {
  code: "SOCKET_MISMATCH";
  cpuSocket: CpuSocket;
  motherboardSocket: CpuSocket;
};

export type CpuMotherboardCompatibility =
  | { compatible: true }
  | {
      compatible: false;
      reason: CpuMotherboardCompatibilityReason;
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
    reason: {
      code: "SOCKET_MISMATCH",
      cpuSocket: cpu.socket,
      motherboardSocket: motherboard.socket,
    },
  };
}
