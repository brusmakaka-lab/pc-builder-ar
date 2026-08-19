export type ComponentId = string;

export type CpuBrand = "AMD" | "Intel";
export type CpuSocket = "AM4" | "AM5" | "LGA1700";
export type MemoryType = "DDR4" | "DDR5";
export type MotherboardFormFactor = "ATX" | "MicroATX";
export type GpuChipBrand = "AMD" | "NVIDIA";

export type CatalogComponentKind =
  | "cpu"
  | "motherboard"
  | "gpu"
  | "memoryKit"
  | "psu";

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
};

export type CatalogComponent = Cpu | Motherboard | Gpu | MemoryKit | Psu;
