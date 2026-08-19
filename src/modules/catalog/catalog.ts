import { cpus, gpus, memoryKits, motherboards, psus } from "./fixtures";
import type { CatalogComponent } from "./types";

export function getAllCpus() {
  return cpus;
}

export function getAllMotherboards() {
  return motherboards;
}

export function getAllGpus() {
  return gpus;
}

export function getAllMemoryKits() {
  return memoryKits;
}

export function getAllPsus() {
  return psus;
}

export function getAllCatalogComponents(): readonly CatalogComponent[] {
  return [...cpus, ...motherboards, ...gpus, ...memoryKits, ...psus];
}
