import {
  getAllCpus,
  getAllCases,
  getAllCpuCoolers,
  getAllGpus,
  getAllMemoryKits,
  getAllMotherboards,
  getAllPsus,
} from "@/modules/catalog/catalog";
import {
  getAllComponentOffers,
  getAllSellerShippingQuotes,
  getAllSellers,
} from "@/modules/pricing/offers";

import { PcBuilderClient } from "./_components/pc-builder-client";

export default function Home() {
  const cpus = getAllCpus();
  const cpuCoolers = getAllCpuCoolers();
  const motherboards = getAllMotherboards();
  const gpus = getAllGpus();
  const memoryKits = getAllMemoryKits();
  const psus = getAllPsus();
  const cases = getAllCases();
  const offers = getAllComponentOffers();
  const sellers = getAllSellers();
  const shippingQuotes = getAllSellerShippingQuotes();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Build en memoria
        </p>
        <h1 className="text-4xl font-semibold text-zinc-950">
          PC Builder AR
        </h1>
      </header>

      <PcBuilderClient
        cpus={cpus}
        cpuCoolers={cpuCoolers}
        motherboards={motherboards}
        gpus={gpus}
        memoryKits={memoryKits}
        psus={psus}
        cases={cases}
        offers={offers}
        sellers={sellers}
        shippingQuotes={shippingQuotes}
      />
    </main>
  );
}
