import type { Cpu, Gpu, MemoryKit, Motherboard, Psu } from "../catalog/types";
import {
  checkCpuMotherboardCompatibility,
  type CpuMotherboardCompatibility,
} from "../compatibility/cpu-motherboard";
import {
  checkMemoryMotherboardCompatibility,
  type MemoryMotherboardCompatibility,
} from "../compatibility/memory-motherboard";
import {
  checkGpuPsuConnectorCompatibility,
  type GpuPsuConnectorCompatibility,
} from "../compatibility/gpu-psu-connectors";
import {
  checkPsuPowerCompatibility,
  type PsuPowerCompatibility,
} from "../compatibility/psu-power";

import type { PcBuild } from "./types";

export type BuildComponentSlot =
  | "cpu"
  | "motherboard"
  | "gpu"
  | "memoryKit"
  | "psu";

export type BuildCompletion = "empty" | "partial" | "complete";

export type BuildCompatibilityStatus =
  | "unknown"
  | "compatible"
  | "incompatible";

export type BuildIssue = {
  code:
    | "cpu-motherboard-socket-mismatch"
    | "memory-motherboard-type-mismatch"
    | "psu-insufficient-wattage"
    | "psu-missing-gpu-power-connectors";
  severity: "error";
  message: string;
};

export type BuildPowerEvaluation = {
  estimatedLoadWatts: number | null;
  requiredPsuWatts: number | null;
};

export type BuildEvaluation = {
  completion: BuildCompletion;
  compatibility: BuildCompatibilityStatus;
  missingComponents: BuildComponentSlot[];
  issues: BuildIssue[];
  power: BuildPowerEvaluation;
};

export type CpuMotherboardCompatibilityCatalog = {
  cpus: readonly Cpu[];
  motherboards: readonly Motherboard[];
};

export type MemoryMotherboardCompatibilityCatalog = {
  motherboards: readonly Motherboard[];
  memoryKits: readonly MemoryKit[];
};

export type PsuPowerCompatibilityCatalog = {
  cpus: readonly Cpu[];
  gpus: readonly Gpu[];
  psus: readonly Psu[];
};

export type GpuPsuConnectorCompatibilityCatalog = {
  gpus: readonly Gpu[];
  psus: readonly Psu[];
};

export type BuildEvaluationCatalog = CpuMotherboardCompatibilityCatalog & {
  gpus: readonly Gpu[];
  memoryKits: readonly MemoryKit[];
  psus: readonly Psu[];
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

export function evaluatePsuPowerCompatibility(
  build: PcBuild,
  catalog: PsuPowerCompatibilityCatalog,
): PsuPowerCompatibility | null {
  if (!build.cpuId || !build.gpuId || !build.psuId) {
    return null;
  }

  const cpu = catalog.cpus.find((item) => item.id === build.cpuId);
  const gpu = catalog.gpus.find((item) => item.id === build.gpuId);
  const psu = catalog.psus.find((item) => item.id === build.psuId);

  if (!cpu || !gpu || !psu) {
    return null;
  }

  return checkPsuPowerCompatibility(cpu, gpu, psu);
}

export function evaluateGpuPsuConnectorCompatibility(
  build: PcBuild,
  catalog: GpuPsuConnectorCompatibilityCatalog,
): GpuPsuConnectorCompatibility | null {
  if (!build.gpuId || !build.psuId) {
    return null;
  }

  const gpu = catalog.gpus.find((item) => item.id === build.gpuId);
  const psu = catalog.psus.find((item) => item.id === build.psuId);

  if (!gpu || !psu) {
    return null;
  }

  return checkGpuPsuConnectorCompatibility(gpu, psu);
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
  const psuPowerCompatibility = evaluatePsuPowerCompatibility(build, catalog);
  const gpuPsuConnectorCompatibility = evaluateGpuPsuConnectorCompatibility(
    build,
    catalog,
  );
  const issues = getBuildIssues(
    cpuMotherboardCompatibility,
    memoryMotherboardCompatibility,
    psuPowerCompatibility,
    gpuPsuConnectorCompatibility,
  );

  return {
    completion,
    compatibility: getBuildCompatibilityStatus([
      cpuMotherboardCompatibility,
      memoryMotherboardCompatibility,
      psuPowerCompatibility,
      gpuPsuConnectorCompatibility,
    ]),
    missingComponents,
    issues,
    power: getBuildPowerEvaluation(psuPowerCompatibility),
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

  if (!build.psuId) {
    missingComponents.push("psu");
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
    !build.memoryKitId &&
    !build.psuId
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
    | PsuPowerCompatibility
    | GpuPsuConnectorCompatibility
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
  psuPowerCompatibility: PsuPowerCompatibility | null,
  gpuPsuConnectorCompatibility: GpuPsuConnectorCompatibility | null,
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

  if (psuPowerCompatibility?.compatible === false) {
    issues.push({
      code: "psu-insufficient-wattage",
      severity: "error",
      message: `La PSU entrega ${psuPowerCompatibility.reason.psuWattage} W y la build requiere al menos ${psuPowerCompatibility.reason.requiredPsuWatts} W estimados.`,
    });
  }

  if (gpuPsuConnectorCompatibility?.compatible === false) {
    issues.push({
      code: "psu-missing-gpu-power-connectors",
      severity: "error",
      message: `La PSU no cubre los conectores dedicados requeridos por la GPU: ${formatMissingConnectors(gpuPsuConnectorCompatibility.reason.missingConnectors)}.`,
    });
  }

  return issues;
}

function formatMissingConnectors(
  missingConnectors: readonly { type: string; count: number }[],
) {
  return missingConnectors
    .map((connector) => `${connector.count}x ${connector.type}`)
    .join(", ");
}

function getBuildPowerEvaluation(
  psuPowerCompatibility: PsuPowerCompatibility | null,
): BuildPowerEvaluation {
  if (!psuPowerCompatibility) {
    return {
      estimatedLoadWatts: null,
      requiredPsuWatts: null,
    };
  }

  if (psuPowerCompatibility.compatible) {
    return {
      estimatedLoadWatts: psuPowerCompatibility.estimatedLoadWatts,
      requiredPsuWatts: psuPowerCompatibility.requiredPsuWatts,
    };
  }

  return {
    estimatedLoadWatts: psuPowerCompatibility.reason.estimatedLoadWatts,
    requiredPsuWatts: psuPowerCompatibility.reason.requiredPsuWatts,
  };
}
