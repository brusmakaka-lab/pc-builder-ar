export type ComponentId = string;

export type CpuBrand = "AMD" | "Intel";
export type CpuSocket = "AM4" | "AM5" | "LGA1700";
export type MemoryType = "DDR4" | "DDR5";
export type MotherboardFormFactor = "ATX" | "MicroATX";
export type GpuChipBrand = "AMD" | "NVIDIA";
export type GpuPowerConnectorType =
  | "pcie-6"
  | "pcie-8"
  | "pcie-6-plus-2"
  | "12vhpwr"
  | "12v-2x6";

export type PowerConnectorRequirement = {
  type: GpuPowerConnectorType;
  count: number;
};

export type CatalogComponentKind =
  | "cpu"
  | "cpuCooler"
  | "motherboard"
  | "gpu"
  | "memoryKit"
  | "psu"
  | "case";

type BaseComponent = {
  id: ComponentId;
  kind: CatalogComponentKind;
  brand: string;
  model: string;
};

export type Cpu = BaseComponent & {
  kind: "cpu";
  brand: CpuBrand;
  socket: CpuSocket;
  cores: number;
  threads: number;
  tdpWatts: number;
};

export type CpuCooler = BaseComponent & {
  kind: "cpuCooler";
  supportedSockets: readonly CpuSocket[];
  heightMm: number;
};

export type Motherboard = BaseComponent & {
  kind: "motherboard";
  socket: CpuSocket;
  chipset: string;
  formFactor: MotherboardFormFactor;
  memoryType: MemoryType;
  memorySlots: number;
};

export type Gpu = BaseComponent & {
  kind: "gpu";
  chipBrand: GpuChipBrand;
  gpuModel: string;
  boardBrand: string;
  boardModel: string;
  vramGb: number;
  boardPowerWatts: number;
  lengthMm: number;
  powerConnectors: readonly PowerConnectorRequirement[];
};

export type MemoryKit = BaseComponent & {
  kind: "memoryKit";
  memoryType: MemoryType;
  capacityGb: number;
  moduleCount: number;
  speedMtS: number;
};

export type Psu = BaseComponent & {
  kind: "psu";
  wattage: number;
  gpuPowerConnectors: readonly PowerConnectorRequirement[];
};

export type PcCase = BaseComponent & {
  kind: "case";
  supportedMotherboardFormFactors: readonly MotherboardFormFactor[];
  maxGpuLengthMm: number;
  maxCpuCoolerHeightMm: number;
};

export type CatalogComponent =
  | Cpu
  | CpuCooler
  | Motherboard
  | Gpu
  | MemoryKit
  | Psu
  | PcCase;
