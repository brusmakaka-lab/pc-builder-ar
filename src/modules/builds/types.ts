import type { ComponentId } from "@/modules/catalog/types";

export type PcBuild = {
  cpuId: ComponentId | null;
  motherboardId: ComponentId | null;
  gpuId: ComponentId | null;
  memoryKitId: ComponentId | null;
  psuId: ComponentId | null;
};

export const emptyBuild: PcBuild = {
  cpuId: null,
  motherboardId: null,
  gpuId: null,
  memoryKitId: null,
  psuId: null,
};
