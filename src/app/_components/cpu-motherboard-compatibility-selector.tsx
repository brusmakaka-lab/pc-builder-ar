"use client";

import { useMemo, useState } from "react";

import type { Cpu, Motherboard } from "@/modules/catalog/types";
import { checkCpuMotherboardCompatibility } from "@/modules/compatibility/cpu-motherboard";

import { getCpuMotherboardCompatibilityView } from "./cpu-motherboard-compatibility-message";

type CpuMotherboardCompatibilitySelectorProps = {
  cpus: readonly Cpu[];
  motherboards: readonly Motherboard[];
};

export function CpuMotherboardCompatibilitySelector({
  cpus,
  motherboards,
}: CpuMotherboardCompatibilitySelectorProps) {
  const [cpuId, setCpuId] = useState("");
  const [motherboardId, setMotherboardId] = useState("");

  const selectedCpu = cpus.find((cpu) => cpu.id === cpuId) ?? null;
  const selectedMotherboard =
    motherboards.find((motherboard) => motherboard.id === motherboardId) ??
    null;

  const compatibility = useMemo(() => {
    if (!selectedCpu || !selectedMotherboard) {
      return null;
    }

    return checkCpuMotherboardCompatibility(selectedCpu, selectedMotherboard);
  }, [selectedCpu, selectedMotherboard]);

  return (
    <section aria-labelledby="compatibility-title" className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Compatibilidad
        </p>
        <h2
          id="compatibility-title"
          className="text-xl font-semibold text-zinc-900"
        >
          CPU y motherboard
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-sm font-medium text-zinc-900">CPU</span>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950"
            value={cpuId}
            onChange={(event) => setCpuId(event.target.value)}
          >
            <option value="">Seleccionar CPU</option>
            {cpus.map((cpu) => (
              <option key={cpu.id} value={cpu.id}>
                {cpu.brand} {cpu.model} ({cpu.socket})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-zinc-900">
            Motherboard
          </span>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-950"
            value={motherboardId}
            onChange={(event) => setMotherboardId(event.target.value)}
          >
            <option value="">Seleccionar motherboard</option>
            {motherboards.map((motherboard) => (
              <option key={motherboard.id} value={motherboard.id}>
                {motherboard.brand} {motherboard.model} ({motherboard.socket})
              </option>
            ))}
          </select>
        </label>
      </div>

      <CompatibilityStatus
        compatibility={compatibility}
        selectedCpu={selectedCpu}
        selectedMotherboard={selectedMotherboard}
      />
    </section>
  );
}

function CompatibilityStatus({
  compatibility,
  selectedCpu,
  selectedMotherboard,
}: {
  compatibility: ReturnType<typeof checkCpuMotherboardCompatibility> | null;
  selectedCpu: Cpu | null;
  selectedMotherboard: Motherboard | null;
}) {
  const view = getCpuMotherboardCompatibilityView(
    compatibility,
    selectedCpu,
    selectedMotherboard,
  );

  if (view.status === "neutral") {
    return (
      <div className="border-y border-zinc-200 py-4 text-zinc-700">
        {view.message}
      </div>
    );
  }

  if (view.status === "compatible") {
    return (
      <div className="border-y border-emerald-300 bg-emerald-50 px-4 py-4 text-emerald-950">
        <p className="font-semibold">{view.title}</p>
        <p>{view.message}</p>
      </div>
    );
  }

  return (
    <div className="border-y border-red-300 bg-red-50 px-4 py-4 text-red-950">
      <p className="font-semibold">{view.title}</p>
      <p>{view.message}</p>
    </div>
  );
}
