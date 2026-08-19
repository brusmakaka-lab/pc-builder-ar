import {
  getAllCpus,
  getAllGpus,
  getAllMemoryKits,
  getAllMotherboards,
} from "@/modules/catalog/catalog";

import { CpuMotherboardCompatibilitySelector } from "./_components/cpu-motherboard-compatibility-selector";

export default function Home() {
  const cpus = getAllCpus();
  const motherboards = getAllMotherboards();
  const catalogSections = [
    {
      title: "CPU",
      items: cpus.map((cpu) => ({
        id: cpu.id,
        name: `${cpu.brand} ${cpu.model}`,
        details: `${cpu.socket} · ${cpu.cores}C/${cpu.threads}T · ${cpu.tdpWatts} W`,
      })),
    },
    {
      title: "Motherboards",
      items: motherboards.map((motherboard) => ({
        id: motherboard.id,
        name: `${motherboard.brand} ${motherboard.model}`,
        details: `${motherboard.socket} · ${motherboard.chipset} · ${motherboard.memoryType} · ${motherboard.formFactor}`,
      })),
    },
    {
      title: "GPU",
      items: getAllGpus().map((gpu) => ({
        id: gpu.id,
        name: `${gpu.boardBrand} ${gpu.boardModel}`,
        details: `${gpu.gpuModel} · ${gpu.vramGb} GB · ${gpu.boardPowerWatts} W`,
      })),
    },
    {
      title: "RAM",
      items: getAllMemoryKits().map((memoryKit) => ({
        id: memoryKit.id,
        name: `${memoryKit.brand} ${memoryKit.model}`,
        details: `${memoryKit.capacityGb} GB · ${memoryKit.moduleCount} modulos · ${memoryKit.memoryType} ${memoryKit.speedMtS} MT/s`,
      })),
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Catalogo controlado
        </p>
        <h1 className="text-4xl font-semibold text-zinc-950">
          PC Builder AR
        </h1>
      </header>

      <CpuMotherboardCompatibilitySelector
        cpus={cpus}
        motherboards={motherboards}
      />

      <section aria-labelledby="catalog-title" className="space-y-5">
        <h2
          id="catalog-title"
          className="text-xl font-semibold text-zinc-900"
        >
          Componentes disponibles
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {catalogSections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h3 className="text-base font-semibold text-zinc-900">
                {section.title}
              </h3>
              <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
                {section.items.map((item) => (
                  <li key={item.id} className="py-3">
                    <p className="font-medium text-zinc-900">{item.name}</p>
                    <p className="text-sm text-zinc-600">{item.details}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
