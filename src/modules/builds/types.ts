import type { ComponentId } from "@/modules/catalog/types";

export type PcBuild = {
  cpuId: ComponentId | null;
  cpuCoolerId: ComponentId | null;
  motherboardId: ComponentId | null;
  gpuId: ComponentId | null;
  memoryKitId: ComponentId | null;
  psuId: ComponentId | null;
  caseId: ComponentId | null;
};

export const emptyBuild: PcBuild = {
  cpuId: null,
  cpuCoolerId: null,
  motherboardId: null,
  gpuId: null,
  memoryKitId: null,
  psuId: null,
  caseId: null,
};
