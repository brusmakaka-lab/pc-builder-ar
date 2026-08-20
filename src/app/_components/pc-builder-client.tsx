"use client";

import { useMemo, useState } from "react";

import {
  clearCase,
  clearCpu,
  clearCpuCooler,
  clearGpu,
  clearMemoryKit,
  clearMotherboard,
  clearPsu,
  createEmptyBuild,
  selectCase,
  selectCpu,
  selectCpuCooler,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
  selectPsu,
} from "@/modules/builds/build";
import {
  evaluateBuild,
  type BuildCompatibilityStatus,
  type BuildComponentSlot,
  type BuildCompletion,
} from "@/modules/builds/evaluate";
import type { PcBuild } from "@/modules/builds/types";
import type {
  Cpu,
  CpuCooler,
  Gpu,
  MemoryKit,
  Motherboard,
  PcCase,
  Psu,
} from "@/modules/catalog/types";

type PcBuilderClientProps = {
  cpus: readonly Cpu[];
  cpuCoolers: readonly CpuCooler[];
  motherboards: readonly Motherboard[];
  gpus: readonly Gpu[];
  memoryKits: readonly MemoryKit[];
  psus: readonly Psu[];
  cases: readonly PcCase[];
};

export function PcBuilderClient({
  cpus,
  cpuCoolers,
  motherboards,
  gpus,
  memoryKits,
  psus,
  cases,
}: PcBuilderClientProps) {
  const [build, setBuild] = useState<PcBuild>(() => createEmptyBuild());

  const selectedCpu = findById(cpus, build.cpuId);
  const selectedCpuCooler = findById(cpuCoolers, build.cpuCoolerId);
  const selectedMotherboard = findById(motherboards, build.motherboardId);
  const selectedGpu = findById(gpus, build.gpuId);
  const selectedMemoryKit = findById(memoryKits, build.memoryKitId);
  const selectedPsu = findById(psus, build.psuId);
  const selectedCase = findById(cases, build.caseId);

  const evaluation = useMemo(
    () =>
      evaluateBuild(build, {
        cpus,
        cpuCoolers,
        motherboards,
        gpus,
        memoryKits,
        psus,
        cases,
      }),
    [build, cpus, cpuCoolers, motherboards, gpus, memoryKits, psus, cases],
  );

  return (
    <div className="space-y-8">
      <section aria-labelledby="builder-title" className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Builder
          </p>
          <h2 id="builder-title" className="text-xl font-semibold text-zinc-900">
            Seleccion de componentes
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ComponentSelect
            label="CPU"
            value={build.cpuId}
            placeholder="Seleccionar CPU"
            options={cpus.map((cpu) => ({
              id: cpu.id,
              label: `${cpu.brand} ${cpu.model} - ${cpu.socket}`,
            }))}
            onSelect={(componentId) =>
              setBuild((current) => selectCpu(current, componentId))
            }
            onClear={() => setBuild((current) => clearCpu(current))}
          />

          <ComponentSelect
            label="CPU Cooler"
            value={build.cpuCoolerId}
            placeholder="Seleccionar CPU cooler"
            options={cpuCoolers.map((cpuCooler) => ({
              id: cpuCooler.id,
              label: formatCpuCooler(cpuCooler),
            }))}
            onSelect={(componentId) =>
              setBuild((current) => selectCpuCooler(current, componentId))
            }
            onClear={() => setBuild((current) => clearCpuCooler(current))}
          />

          <ComponentSelect
            label="Motherboard"
            value={build.motherboardId}
            placeholder="Seleccionar motherboard"
            options={motherboards.map((motherboard) => ({
              id: motherboard.id,
              label: `${motherboard.brand} ${motherboard.model} - ${motherboard.socket} / ${motherboard.memoryType}`,
            }))}
            onSelect={(componentId) =>
              setBuild((current) => selectMotherboard(current, componentId))
            }
            onClear={() => setBuild((current) => clearMotherboard(current))}
          />

          <ComponentSelect
            label="GPU"
            value={build.gpuId}
            placeholder="Seleccionar GPU"
            options={gpus.map((gpu) => ({
              id: gpu.id,
              label: `${gpu.boardBrand} ${gpu.boardModel} - ${gpu.vramGb} GB`,
            }))}
            onSelect={(componentId) =>
              setBuild((current) => selectGpu(current, componentId))
            }
            onClear={() => setBuild((current) => clearGpu(current))}
          />

          <ComponentSelect
            label="RAM"
            value={build.memoryKitId}
            placeholder="Seleccionar RAM"
            options={memoryKits.map((memoryKit) => ({
              id: memoryKit.id,
              label: formatMemoryKit(memoryKit),
            }))}
            onSelect={(componentId) =>
              setBuild((current) => selectMemoryKit(current, componentId))
            }
            onClear={() => setBuild((current) => clearMemoryKit(current))}
          />

          <ComponentSelect
            label="PSU"
            value={build.psuId}
            placeholder="Seleccionar PSU"
            options={psus.map((psu) => ({
              id: psu.id,
              label: formatPsu(psu),
            }))}
            onSelect={(componentId) =>
              setBuild((current) => selectPsu(current, componentId))
            }
            onClear={() => setBuild((current) => clearPsu(current))}
          />

          <ComponentSelect
            label="Gabinete"
            value={build.caseId}
            placeholder="Seleccionar gabinete"
            options={cases.map((pcCase) => ({
              id: pcCase.id,
              label: formatCase(pcCase),
            }))}
            onSelect={(componentId) =>
              setBuild((current) => selectCase(current, componentId))
            }
            onClear={() => setBuild((current) => clearCase(current))}
          />
        </div>
      </section>

      <section aria-labelledby="current-build-title" className="space-y-5">
        <h2
          id="current-build-title"
          className="text-xl font-semibold text-zinc-900"
        >
          Build actual
        </h2>

        <dl className="divide-y divide-zinc-200 border-y border-zinc-200">
          <BuildSummaryRow
            label="CPU"
            value={
              selectedCpu
                ? `${selectedCpu.brand} ${selectedCpu.model}`
                : "No seleccionado"
            }
          />
          <BuildSummaryRow
            label="CPU Cooler"
            value={
              selectedCpuCooler
                ? formatCpuCooler(selectedCpuCooler)
                : "No seleccionado"
            }
          />
          <BuildSummaryRow
            label="Motherboard"
            value={
              selectedMotherboard
                ? `${selectedMotherboard.brand} ${selectedMotherboard.model}`
                : "No seleccionado"
            }
          />
          <BuildSummaryRow
            label="GPU"
            value={
              selectedGpu
                ? `${selectedGpu.boardBrand} ${selectedGpu.boardModel}`
                : "No seleccionado"
            }
          />
          <BuildSummaryRow
            label="RAM"
            value={
              selectedMemoryKit
                ? formatMemoryKit(selectedMemoryKit)
                : "No seleccionado"
            }
          />
          <BuildSummaryRow
            label="PSU"
            value={selectedPsu ? formatPsu(selectedPsu) : "No seleccionado"}
          />
          <BuildSummaryRow
            label="Gabinete"
            value={selectedCase ? formatCase(selectedCase) : "No seleccionado"}
          />
        </dl>
      </section>

      <section aria-labelledby="evaluation-title" className="space-y-3">
        <h2
          id="evaluation-title"
          className="text-xl font-semibold text-zinc-900"
        >
          Evaluacion de build
        </h2>
        <BuildEvaluationSummary evaluation={evaluation} />
      </section>
    </div>
  );
}

function ComponentSelect({
  label,
  value,
  placeholder,
  options,
  onSelect,
  onClear,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  options: readonly { id: string; label: string }[];
  onSelect: (componentId: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-900">
        {label}
        <select
          className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950"
          value={value ?? ""}
          onChange={(event) => {
            if (event.target.value) {
              onSelect(event.target.value);
            } else {
              onClear();
            }
          }}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {value ? (
        <button
          className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
          type="button"
          onClick={onClear}
        >
          Quitar {label}
        </button>
      ) : null}
    </div>
  );
}

function BuildSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
      <dt className="font-medium text-zinc-900">{label}</dt>
      <dd className="text-zinc-600">{value}</dd>
    </div>
  );
}

function formatMemoryKit(memoryKit: MemoryKit) {
  const moduleCapacityGb = memoryKit.capacityGb / memoryKit.moduleCount;

  return `${memoryKit.brand} ${memoryKit.capacityGb} GB (${memoryKit.moduleCount}x${moduleCapacityGb}) ${memoryKit.memoryType} ${memoryKit.speedMtS} MT/s`;
}

function formatPsu(psu: Psu) {
  return `${psu.brand} ${psu.model} - ${psu.wattage} W`;
}

function formatCpuCooler(cpuCooler: CpuCooler) {
  return `${cpuCooler.brand} ${cpuCooler.model} - ${cpuCooler.supportedSockets.join("/")} / ${cpuCooler.heightMm} mm`;
}

function formatCase(pcCase: PcCase) {
  return `${pcCase.brand} ${pcCase.model} - ${pcCase.supportedMotherboardFormFactors.join("/")} / GPU ${pcCase.maxGpuLengthMm} mm / Cooler ${pcCase.maxCpuCoolerHeightMm} mm`;
}

function findById<TItem extends { id: string }>(
  items: readonly TItem[],
  id: string | null,
) {
  if (!id) {
    return null;
  }

  return items.find((item) => item.id === id) ?? null;
}

function BuildEvaluationSummary({
  evaluation,
}: {
  evaluation: ReturnType<typeof evaluateBuild>;
}) {
  const compatibilityTone = getCompatibilityTone(evaluation.compatibility);

  return (
    <div className="space-y-4 border-y border-zinc-200 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <EvaluationFact
          label="Completitud"
          value={formatCompletion(evaluation.completion)}
        />
        <EvaluationFact
          label="Compatibilidad"
          value={formatCompatibility(evaluation.compatibility)}
        />
      </div>

      <div>
        <p className="font-medium text-zinc-900">Componentes faltantes</p>
        {evaluation.missingComponents.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-zinc-600">
            {evaluation.missingComponents.map((slot) => (
              <li key={slot}>{formatSlot(slot)}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-zinc-600">No faltan componentes.</p>
        )}
      </div>

      <div>
        <p className="font-medium text-zinc-900">Potencia estimada</p>
        <p className="mt-2 text-zinc-600">
          {evaluation.power.requiredPsuWatts
            ? `${evaluation.power.estimatedLoadWatts} W estimados, ${evaluation.power.requiredPsuWatts} W requeridos con margen.`
            : "Selecciona CPU, GPU y PSU para estimar la potencia requerida."}
        </p>
      </div>

      <div className={compatibilityTone.className}>
        <p className="font-semibold">{compatibilityTone.title}</p>
        {evaluation.issues.length > 0 ? (
          <ul className="mt-1 list-inside list-disc">
            {evaluation.issues.map((issue) => (
              <li key={issue.code}>{issue.message}</li>
            ))}
          </ul>
        ) : (
          <p>{compatibilityTone.message}</p>
        )}
      </div>
    </div>
  );
}

function EvaluationFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="text-zinc-900">{value}</p>
    </div>
  );
}

function formatCompletion(completion: BuildCompletion) {
  const labels: Record<BuildCompletion, string> = {
    empty: "Vacia",
    partial: "Parcial",
    complete: "Completa",
  };

  return labels[completion];
}

function formatCompatibility(compatibility: BuildCompatibilityStatus) {
  const labels: Record<BuildCompatibilityStatus, string> = {
    unknown: "Desconocida",
    compatible: "Compatible",
    incompatible: "Incompatible",
  };

  return labels[compatibility];
}

function formatSlot(slot: BuildComponentSlot) {
  const labels: Record<BuildComponentSlot, string> = {
    cpu: "CPU",
    cpuCooler: "CPU Cooler",
    motherboard: "Motherboard",
    gpu: "GPU",
    memoryKit: "RAM",
    psu: "PSU",
    case: "Gabinete",
  };

  return labels[slot];
}

function getCompatibilityTone(compatibility: BuildCompatibilityStatus) {
  if (compatibility === "compatible") {
    return {
      className:
        "border-y border-emerald-300 bg-emerald-50 px-4 py-4 text-emerald-950",
      title: "✓ Compatible",
      message: "Los chequeos disponibles no detectan incompatibilidades.",
    };
  }

  if (compatibility === "incompatible") {
    return {
      className: "border-y border-red-300 bg-red-50 px-4 py-4 text-red-950",
      title: "✕ Incompatible",
      message: "Se detectaron incompatibilidades.",
    };
  }

  return {
    className: "border-y border-zinc-200 px-4 py-4 text-zinc-700",
    title: "Compatibilidad desconocida",
    message:
      "Selecciona los componentes necesarios para evaluar las compatibilidades conocidas.",
  };
}
