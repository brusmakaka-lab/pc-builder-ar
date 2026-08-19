"use client";

import { useMemo, useState } from "react";

import {
  clearCpu,
  clearGpu,
  clearMemoryKit,
  clearMotherboard,
  createEmptyBuild,
  selectCpu,
  selectGpu,
  selectMemoryKit,
  selectMotherboard,
} from "@/modules/builds/build";
import {
  evaluateBuild,
  type BuildCompatibilityStatus,
  type BuildComponentSlot,
  type BuildCompletion,
} from "@/modules/builds/evaluate";
import type { PcBuild } from "@/modules/builds/types";
import type { Cpu, Gpu, MemoryKit, Motherboard } from "@/modules/catalog/types";

type PcBuilderClientProps = {
  cpus: readonly Cpu[];
  motherboards: readonly Motherboard[];
  gpus: readonly Gpu[];
  memoryKits: readonly MemoryKit[];
};

export function PcBuilderClient({
  cpus,
  motherboards,
  gpus,
  memoryKits,
}: PcBuilderClientProps) {
  const [build, setBuild] = useState<PcBuild>(() => createEmptyBuild());

  const selectedCpu = findById(cpus, build.cpuId);
  const selectedMotherboard = findById(motherboards, build.motherboardId);
  const selectedGpu = findById(gpus, build.gpuId);
  const selectedMemoryKit = findById(memoryKits, build.memoryKitId);

  const evaluation = useMemo(
    () =>
      evaluateBuild(build, {
        cpus,
        motherboards,
        gpus,
        memoryKits,
      }),
    [build, cpus, motherboards, gpus, memoryKits],
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
    motherboard: "Motherboard",
    gpu: "GPU",
    memoryKit: "RAM",
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
      "Selecciona CPU y motherboard para evaluar la compatibilidad conocida.",
  };
}
