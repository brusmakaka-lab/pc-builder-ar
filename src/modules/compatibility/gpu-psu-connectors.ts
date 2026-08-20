import type {
  Gpu,
  GpuPowerConnectorType,
  PowerConnectorRequirement,
  Psu,
} from "@/modules/catalog/types";
import type { CompatibilityCheckResult } from "./types";

export type GpuPsuConnectorCompatibilityReason = {
  code: "MISSING_GPU_POWER_CONNECTORS";
  missingConnectors: PowerConnectorRequirement[];
};

export type GpuPsuConnectorCompatibility = CompatibilityCheckResult<
  GpuPsuConnectorCompatibilityReason,
  {
    missingConnectors: [];
  }
>;

export function checkGpuPsuConnectorCompatibility(
  gpu: Gpu,
  psu: Psu,
): GpuPsuConnectorCompatibility {
  const missingConnectors = getMissingGpuPowerConnectors(
    gpu.powerConnectors,
    psu.gpuPowerConnectors,
  );

  if (missingConnectors.length === 0) {
    return {
      compatible: true,
      missingConnectors: [],
    };
  }

  return {
    compatible: false,
    reason: {
      code: "MISSING_GPU_POWER_CONNECTORS",
      missingConnectors,
    },
  };
}

export function getMissingGpuPowerConnectors(
  requirements: readonly PowerConnectorRequirement[],
  availableConnectors: readonly PowerConnectorRequirement[],
): PowerConnectorRequirement[] {
  const remainingAvailability = expandConnectorCounts(availableConnectors);
  const missingByType = new Map<GpuPowerConnectorType, number>();

  for (const requirement of expandConnectorRequirements(requirements)) {
    const assignedConnector = findAssignableConnectorType(
      requirement,
      remainingAvailability,
    );

    if (assignedConnector) {
      remainingAvailability.set(
        assignedConnector,
        (remainingAvailability.get(assignedConnector) ?? 0) - 1,
      );
    } else {
      missingByType.set(requirement, (missingByType.get(requirement) ?? 0) + 1);
    }
  }

  return [...missingByType.entries()].map(([type, count]) => ({ type, count }));
}

function expandConnectorCounts(
  connectors: readonly PowerConnectorRequirement[],
) {
  const counts = new Map<GpuPowerConnectorType, number>();

  for (const connector of connectors) {
    counts.set(connector.type, (counts.get(connector.type) ?? 0) + connector.count);
  }

  return counts;
}

function expandConnectorRequirements(
  requirements: readonly PowerConnectorRequirement[],
) {
  return requirements.flatMap((requirement) =>
    Array.from({ length: requirement.count }, () => requirement.type),
  );
}

function findAssignableConnectorType(
  requirement: GpuPowerConnectorType,
  remainingAvailability: ReadonlyMap<GpuPowerConnectorType, number>,
) {
  const candidates = getAssignableConnectorTypes(requirement);

  return candidates.find(
    (candidate) => (remainingAvailability.get(candidate) ?? 0) > 0,
  );
}

function getAssignableConnectorTypes(requirement: GpuPowerConnectorType) {
  if (requirement === "pcie-6" || requirement === "pcie-8") {
    return [requirement, "pcie-6-plus-2"] as const;
  }

  return [requirement] as const;
}
