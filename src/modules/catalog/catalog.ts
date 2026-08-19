import { cpus, gpus, memoryKits, motherboards } from "./fixtures";
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

export function getAllCatalogComponents(): readonly CatalogComponent[] {
  return [...cpus, ...motherboards, ...gpus, ...memoryKits];
}
