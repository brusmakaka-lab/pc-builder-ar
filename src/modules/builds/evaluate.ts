import type { Cpu, Gpu, MemoryKit, Motherboard, PcCase, Psu } from "../catalog/types";
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
  checkGpuCaseCompatibility,
  type GpuCaseCompatibility,
} from "../compatibility/gpu-case";
import {
  checkMotherboardCaseCompatibility,
  type MotherboardCaseCompatibility,
} from "../compatibility/motherboard-case";
import {
  checkPsuPowerCompatibility,
  type PsuPowerCompatibility,
} from "../compatibility/psu-power";
import {
  getCompatibilityStatus,
  type CompatibilityStatus,
} from "../compatibility/types";

import type { PcBuild } from "./types";

export type BuildComponentSlot =
  | "cpu"
  | "motherboard"
  | "gpu"
  | "memoryKit"
  | "psu"
  | "case";

export type BuildCompletion = "empty" | "partial" | "complete";

export type BuildCompatibilityStatus = CompatibilityStatus;

export type BuildIssue = {
  code:
    | "cpu-motherboard-socket-mismatch"
    | "memory-motherboard-type-mismatch"
    | "psu-insufficient-wattage"
    | "psu-missing-gpu-power-connectors"
    | "motherboard-case-form-factor-mismatch"
    | "gpu-case-length-exceeded";
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

export type MotherboardCaseCompatibilityCatalog = {
  motherboards: readonly Motherboard[];
  cases: readonly PcCase[];
};

export type GpuCaseCompatibilityCatalog = {
  gpus: readonly Gpu[];
  cases: readonly PcCase[];
};

export type BuildEvaluationCatalog = CpuMotherboardCompatibilityCatalog & {
  gpus: readonly Gpu[];
  memoryKits: readonly MemoryKit[];
  psus: readonly Psu[];
  cases: readonly PcCase[];
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

export function evaluateMotherboardCaseCompatibility(
  build: PcBuild,
  catalog: MotherboardCaseCompatibilityCatalog,
): MotherboardCaseCompatibility | null {
  if (!build.motherboardId || !build.caseId) {
    return null;
  }

  const motherboard = catalog.motherboards.find(
    (item) => item.id === build.motherboardId,
  );
  const pcCase = catalog.cases.find((item) => item.id === build.caseId);

  if (!motherboard || !pcCase) {
    return null;
  }

  return checkMotherboardCaseCompatibility(motherboard, pcCase);
}

export function evaluateGpuCaseCompatibility(
  build: PcBuild,
  catalog: GpuCaseCompatibilityCatalog,
): GpuCaseCompatibility | null {
  if (!build.gpuId || !build.caseId) {
    return null;
  }

  const gpu = catalog.gpus.find((item) => item.id === build.gpuId);
  const pcCase = catalog.cases.find((item) => item.id === build.caseId);

  if (!gpu || !pcCase) {
    return null;
  }

  return checkGpuCaseCompatibility(gpu, pcCase);
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
  const motherboardCaseCompatibility = evaluateMotherboardCaseCompatibility(
    build,
    catalog,
  );
  const gpuCaseCompatibility = evaluateGpuCaseCompatibility(build, catalog);
  const issues = getBuildIssues(
    cpuMotherboardCompatibility,
    memoryMotherboardCompatibility,
    psuPowerCompatibility,
    gpuPsuConnectorCompatibility,
    motherboardCaseCompatibility,
    gpuCaseCompatibility,
  );

  return {
    completion,
    compatibility: getCompatibilityStatus([
      cpuMotherboardCompatibility,
      memoryMotherboardCompatibility,
      psuPowerCompatibility,
      gpuPsuConnectorCompatibility,
      motherboardCaseCompatibility,
      gpuCaseCompatibility,
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

  if (!build.caseId) {
    missingComponents.push("case");
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
    !build.psuId &&
    !build.caseId
  ) {
    return "empty";
  }

  if (missingComponents.length === 0) {
    return "complete";
  }

  return "partial";
}

function getBuildIssues(
  cpuMotherboardCompatibility: CpuMotherboardCompatibility | null,
  memoryMotherboardCompatibility: MemoryMotherboardCompatibility | null,
  psuPowerCompatibility: PsuPowerCompatibility | null,
  gpuPsuConnectorCompatibility: GpuPsuConnectorCompatibility | null,
  motherboardCaseCompatibility: MotherboardCaseCompatibility | null,
  gpuCaseCompatibility: GpuCaseCompatibility | null,
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
      message: `La PSU entrega ${psuPowerCompatibility.reason.psuWattage} W y la build requiere al menos ${psuPowerCompatibility.reason.estimate.requiredPsuWatts} W estimados.`,
    });
  }

  if (gpuPsuConnectorCompatibility?.compatible === false) {
    issues.push({
      code: "psu-missing-gpu-power-connectors",
      severity: "error",
      message: `La PSU no cubre los conectores dedicados requeridos por la GPU: ${formatMissingConnectors(gpuPsuConnectorCompatibility.reason.missingConnectors)}.`,
    });
  }

  if (motherboardCaseCompatibility?.compatible === false) {
    issues.push({
      code: "motherboard-case-form-factor-mismatch",
      severity: "error",
      message: `El gabinete soporta ${motherboardCaseCompatibility.reason.supportedMotherboardFormFactors.join(", ")} y la motherboard utiliza ${motherboardCaseCompatibility.reason.motherboardFormFactor}.`,
    });
  }

  if (gpuCaseCompatibility?.compatible === false) {
    issues.push({
      code: "gpu-case-length-exceeded",
      severity: "error",
      message: `La GPU mide ${gpuCaseCompatibility.reason.gpuLengthMm} mm y el gabinete soporta hasta ${gpuCaseCompatibility.reason.maxGpuLengthMm} mm.`,
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
      estimatedLoadWatts: psuPowerCompatibility.estimate.estimatedLoadWatts,
      requiredPsuWatts: psuPowerCompatibility.estimate.requiredPsuWatts,
    };
  }

  return {
    estimatedLoadWatts: psuPowerCompatibility.reason.estimate.estimatedLoadWatts,
    requiredPsuWatts: psuPowerCompatibility.reason.estimate.requiredPsuWatts,
  };
}
