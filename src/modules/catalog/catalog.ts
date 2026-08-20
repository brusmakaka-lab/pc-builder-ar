import {
  cases,
  cpuCoolers,
  cpus,
  gpus,
  memoryKits,
  motherboards,
  psus,
} from "./fixtures";
import type { CatalogComponent } from "./types";

export function getAllCpus() {
  return cpus;
}

export function getAllCpuCoolers() {
  return cpuCoolers;
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

export function getAllCases() {
  return cases;
}

export function getAllCatalogComponents(): readonly CatalogComponent[] {
  return [
    ...cpus,
    ...cpuCoolers,
    ...motherboards,
    ...gpus,
    ...memoryKits,
    ...psus,
    ...cases,
  ];
}
