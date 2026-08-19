import type { MemoryKit, MemoryType, Motherboard } from "@/modules/catalog/types";

export type MemoryMotherboardCompatibilityReason = {
  code: "MEMORY_TYPE_MISMATCH";
  memoryType: MemoryType;
  motherboardMemoryType: MemoryType;
};

export type MemoryMotherboardCompatibility =
  | { compatible: true }
  | {
      compatible: false;
      reason: MemoryMotherboardCompatibilityReason;
    };

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
