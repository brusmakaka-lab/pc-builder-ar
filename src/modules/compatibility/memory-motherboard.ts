import type { MemoryKit, MemoryType, Motherboard } from "@/modules/catalog/types";
import type { CompatibilityCheckResult } from "./types";

export type MemoryMotherboardCompatibilityReason = {
  code: "MEMORY_TYPE_MISMATCH";
  memoryType: MemoryType;
  motherboardMemoryType: MemoryType;
};

export type MemoryMotherboardCompatibility =
  CompatibilityCheckResult<MemoryMotherboardCompatibilityReason>;

export function checkMemoryMotherboardCompatibility(
  memoryKit: MemoryKit,
  motherboard: Motherboard,
): MemoryMotherboardCompatibility {
  if (memoryKit.memoryType === motherboard.memoryType) {
    return { compatible: true };
  }

  return {
    compatible: false,
    reason: {
      code: "MEMORY_TYPE_MISMATCH",
      memoryType: memoryKit.memoryType,
      motherboardMemoryType: motherboard.memoryType,
    },
  };
}
