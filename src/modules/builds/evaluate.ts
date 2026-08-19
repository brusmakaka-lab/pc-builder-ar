import type { Cpu, Gpu, MemoryKit, Motherboard } from "../catalog/types";
import {
  checkCpuMotherboardCompatibility,
  type CpuMotherboardCompatibility,
} from "../compatibility/cpu-motherboard";

import type { PcBuild } from "./types";

export type BuildComponentSlot = "cpu" | "motherboard" | "gpu" | "memoryKit";

export type BuildCompletion = "empty" | "partial" | "complete";

export type BuildCompatibilityStatus =
  | "unknown"
  | "compatible"
  | "incompatible";

export type BuildIssue = {
  code: "cpu-motherboard-socket-mismatch";
  severity: "error";
  message: string;
};

export type BuildEvaluation = {
  completion: BuildCompletion;
  compatibility: BuildCompatibilityStatus;
  missingComponents: BuildComponentSlot[];
  issues: BuildIssue[];
};

export type CpuMotherboardCompatibilityCatalog = {
  cpus: readonly Cpu[];
  motherboards: readonly Motherboard[];
};

export type BuildEvaluationCatalog = CpuMotherboardCompatibilityCatalog & {
  gpus: readonly Gpu[];
  memoryKits: readonly MemoryKit[];
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

export function evaluateBuild(
  build: PcBuild,
  catalog: BuildEvaluationCatalog,
): BuildEvaluation {
  const missingComponents = getMissingComponents(build);
  const completion = getBuildCompletion(build, missingComponents);
  const cpuMotherboardCompatibility = evaluateCpuMotherboardCompatibility(
    build,
    catalog,
  );
  const issues = getBuildIssues(cpuMotherboardCompatibility);

  return {
    completion,
    compatibility: getBuildCompatibilityStatus(cpuMotherboardCompatibility),
    missingComponents,
    issues,
  };
}

function getMissingComponents(build: PcBuild): BuildComponentSlot[] {
  const missingComponents: BuildComponentSlot[] = [];

  if (!build.cpuId) {
    missingComponents.push("cpu");
  }

  if (!build.motherboardId) {
    missingComponents.push("motherboard");
  }

  if (!build.gpuId) {
    missingComponents.push("gpu");
  }

  if (!build.memoryKitId) {
    missingComponents.push("memoryKit");
  }

  return missingComponents;
}

function getBuildCompletion(
  build: PcBuild,
  missingComponents: readonly BuildComponentSlot[],
): BuildCompletion {
  if (
    !build.cpuId &&
    !build.motherboardId &&
    !build.gpuId &&
    !build.memoryKitId
  ) {
    return "empty";
  }

  if (missingComponents.length === 0) {
    return "complete";
  }

  return "partial";
}

function getBuildCompatibilityStatus(
  cpuMotherboardCompatibility: CpuMotherboardCompatibility | null,
): BuildCompatibilityStatus {
  if (!cpuMotherboardCompatibility) {
    return "unknown";
  }

  return cpuMotherboardCompatibility.compatible ? "compatible" : "incompatible";
}

function getBuildIssues(
  cpuMotherboardCompatibility: CpuMotherboardCompatibility | null,
): BuildIssue[] {
  if (!cpuMotherboardCompatibility || cpuMotherboardCompatibility.compatible) {
    return [];
  }

  return [
    {
      code: "cpu-motherboard-socket-mismatch",
      severity: "error",
      message: `La CPU utiliza ${cpuMotherboardCompatibility.reason.cpuSocket} y la motherboard utiliza ${cpuMotherboardCompatibility.reason.motherboardSocket}.`,
    },
  ];
}
