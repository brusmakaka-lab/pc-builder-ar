import type { ComponentId } from "@/modules/catalog/types";

import type { PcBuild } from "./types";

export function createEmptyBuild(): PcBuild {
  return {
    cpuId: null,
    motherboardId: null,
    gpuId: null,
    memoryKitId: null,
    psuId: null,
  };
}

export function selectCpu(build: PcBuild, cpuId: ComponentId): PcBuild {
  return { ...build, cpuId };
}

export function selectMotherboard(
  build: PcBuild,
  motherboardId: ComponentId,
): PcBuild {
  return { ...build, motherboardId };
}

export function selectGpu(build: PcBuild, gpuId: ComponentId): PcBuild {
  return { ...build, gpuId };
}

export function selectMemoryKit(
  build: PcBuild,
  memoryKitId: ComponentId,
): PcBuild {
  return { ...build, memoryKitId };
}

export function selectPsu(build: PcBuild, psuId: ComponentId): PcBuild {
  return { ...build, psuId };
}

export function clearCpu(build: PcBuild): PcBuild {
  return { ...build, cpuId: null };
}

export function clearMotherboard(build: PcBuild): PcBuild {
  return { ...build, motherboardId: null };
}

export function clearGpu(build: PcBuild): PcBuild {
  return { ...build, gpuId: null };
}

export function clearMemoryKit(build: PcBuild): PcBuild {
  return { ...build, memoryKitId: null };
}

export function clearPsu(build: PcBuild): PcBuild {
  return { ...build, psuId: null };
}
