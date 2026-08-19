import type { Cpu, Gpu, MemoryKit, Motherboard } from "@/modules/catalog/types";

export type PcBuildSelection = {
  cpu: Cpu | null;
  motherboard: Motherboard | null;
  gpu: Gpu | null;
  ram: MemoryKit | null;
};

export const emptyBuildSelection: PcBuildSelection = {
  cpu: null,
  motherboard: null,
  gpu: null,
  ram: null,
};
