import type { Cpu, Gpu, MemoryKit, Motherboard } from "../catalog/types";
import {
  checkCpuMotherboardCompatibility,
  type CpuMotherboardCompatibility,
} from "../compatibility/cpu-motherboard";
import {
  checkMemoryMotherboardCompatibility,
  type MemoryMotherboardCompatibility,
} from "../compatibility/memory-motherboard";

import type { PcBuild } from "./types";

export type BuildComponentSlot = "cpu" | "motherboard" | "gpu" | "memoryKit";

export type BuildCompletion = "empty" | "partial" | "complete";

export type BuildCompatibilityStatus =
  | "unknown"
  | "compatible"
  | "incompatible";

export type BuildIssue = {
  code:
    | "cpu-motherboard-socket-mismatch"
    | "memory-motherboard-type-mismatch";
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

export type MemoryMotherboardCompatibilityCatalog = {
  motherboards: readonly Motherboard[];
  memoryKits: readonly MemoryKit[];
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

export function evaluateMemoryMotherboardCompatibility(
  build: PcBuild,
  catalog: MemoryMotherboardCompatibilityCatalog,
): MemoryMotherboardCompatibility | null {
  if (!build.motherboardId || !build.memoryKitId) {
    return null;
  }

  const motherboard = catalog.motherboards.find(
    (item) => item.id === build.motherboardId,
  );
  const memoryKit = catalog.memoryKits.find(
    (item) => item.id === build.memoryKitId,
  );

  if (!motherboard || !memoryKit) {
    return null;
  }

  return checkMemoryMotherboardCompatibility(memoryKit, motherboard);
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
  const memoryMotherboardCompatibility = evaluateMemoryMotherboardCompatibility(
    build,
    catalog,
  );
  const issues = getBuildIssues(
    cpuMotherboardCompatibility,
    memoryMotherboardCompatibility,
  );

  return {
    completion,
    compatibility: getBuildCompatibilityStatus([
      cpuMotherboardCompatibility,
      memoryMotherboardCompatibility,
    ]),
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
  compatibilityChecks: readonly (
    | CpuMotherboardCompatibility
    | MemoryMotherboardCompatibility
    | null
  )[],
): BuildCompatibilityStatus {
  if (
    compatibilityChecks.some(
      (compatibility) => compatibility?.compatible === false,
    )
  ) {
    return "incompatible";
  }

  if (compatibilityChecks.some((compatibility) => compatibility === null)) {
    return "unknown";
  }

  return "compatible";
}

function getBuildIssues(
  cpuMotherboardCompatibility: CpuMotherboardCompatibility | null,
  memoryMotherboardCompatibility: MemoryMotherboardCompatibility | null,
): BuildIssue[] {
  const issues: BuildIssue[] = [];

  if (cpuMotherboardCompatibility?.compatible === false) {
    issues.push({
      code: "cpu-motherboard-socket-mismatch",
      severity: "error",
      message: `La CPU utiliza ${cpuMotherboardCompatibility.reason.cpuSocket} y la motherboard utiliza ${cpuMotherboardCompatibility.reason.motherboardSocket}.`,
    });
  }

  if (memoryMotherboardCompatibility?.compatible === false) {
    issues.push({
      code: "memory-motherboard-type-mismatch",
      severity: "error",
      message: `La RAM utiliza ${memoryMotherboardCompatibility.reason.memoryType} y la motherboard utiliza ${memoryMotherboardCompatibility.reason.motherboardMemoryType}.`,
    });
  }

  return issues;
}
