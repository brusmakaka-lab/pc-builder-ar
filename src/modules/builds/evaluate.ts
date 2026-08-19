import type { Cpu, Motherboard } from "../catalog/types";
import {
  checkCpuMotherboardCompatibility,
  type CpuMotherboardCompatibility,
} from "../compatibility/cpu-motherboard";

import type { PcBuild } from "./types";

export type CpuMotherboardCompatibilityCatalog = {
  cpus: readonly Cpu[];
  motherboards: readonly Motherboard[];
};

export function evaluateCpuMotherboardCompatibility(
  build: PcBuild,
  catalog: CpuMotherboardCompatibilityCatalog,
): CpuMotherboardCompatibility | null {
  if (!build.cpuId || !build.motherboardId) {
    return null;
  }

  const cpu = catalog.cpus.find((item) => item.id === build.cpuId);
  const motherboard = catalog.motherboards.find(
    (item) => item.id === build.motherboardId,
  );

  if (!cpu || !motherboard) {
    return null;
  }

  return checkCpuMotherboardCompatibility(cpu, motherboard);
}
