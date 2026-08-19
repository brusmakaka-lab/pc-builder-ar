import type { Cpu, Motherboard } from "@/modules/catalog/types";
import type { CpuMotherboardCompatibility } from "@/modules/compatibility/cpu-motherboard";

export type CpuMotherboardCompatibilityView =
  | {
      status: "neutral";
      title: "Pendiente";
      message: string;
    }
  | {
      status: "compatible";
      title: "✓ Compatible";
      message: string;
    }
  | {
      status: "incompatible";
      title: "✕ Incompatible";
      message: string;
    };

export function getCpuMotherboardCompatibilityView(
  compatibility: CpuMotherboardCompatibility | null,
  selectedCpu: Cpu | null,
  selectedMotherboard: Motherboard | null,
): CpuMotherboardCompatibilityView {
  if (!selectedCpu || !selectedMotherboard || !compatibility) {
    return {
      status: "neutral",
      title: "Pendiente",
      message:
        "Selecciona una CPU y una motherboard para comprobar compatibilidad.",
    };
  }

  if (compatibility.compatible) {
    return {
      status: "compatible",
      title: "✓ Compatible",
      message: `CPU y motherboard utilizan ${selectedCpu.socket}.`,
    };
  }

  return {
    status: "incompatible",
    title: "✕ Incompatible",
    message: `La CPU utiliza ${compatibility.reason.cpuSocket} y la motherboard utiliza ${compatibility.reason.motherboardSocket}.`,
  };
}
