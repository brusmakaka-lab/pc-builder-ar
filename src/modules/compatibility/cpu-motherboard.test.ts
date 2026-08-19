import { describe, expect, it } from "vitest";

import { checkCpuMotherboardCompatibility } from "./cpu-motherboard";

const cpu = {
  id: "cpu-1",
  kind: "cpu",
  brand: "AMD",
  model: "Ryzen 5",
  socket: "AM5",
  cores: 6,
  threads: 12,
  tdpWatts: 65,
} as const;

describe("checkCpuMotherboardCompatibility", () => {
  it("accepts matching sockets", () => {
    expect(
      checkCpuMotherboardCompatibility(cpu, {
        id: "motherboard-1",
        kind: "motherboard",
        brand: "MSI",
        model: "B650",
        socket: "AM5",
        chipset: "B650",
        formFactor: "ATX",
        memoryType: "DDR5",
        memorySlots: 4,
      }),
    ).toEqual({ compatible: true });
  });

  it("returns an explicit mismatch reason", () => {
    expect(
      checkCpuMotherboardCompatibility(cpu, {
        id: "motherboard-2",
        kind: "motherboard",
        brand: "ASUS",
        model: "B760",
        socket: "LGA1700",
        chipset: "B760",
        formFactor: "ATX",
        memoryType: "DDR5",
        memorySlots: 4,
      }),
    ).toEqual({
      compatible: false,
      reason: "socket_mismatch",
      cpuSocket: "AM5",
      motherboardSocket: "LGA1700",
    });
  });
});
