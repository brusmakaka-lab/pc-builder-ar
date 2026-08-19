import { describe, expect, it } from "vitest";

import { getCpuMotherboardCompatibilityView } from "./cpu-motherboard-compatibility-message";

describe("getCpuMotherboardCompatibilityView", () => {
  it("returns a neutral message until both components are selected", () => {
    expect(getCpuMotherboardCompatibilityView(null, null, null)).toEqual({
      status: "neutral",
      title: "Pendiente",
      message:
        "Selecciona una CPU y una motherboard para comprobar compatibilidad.",
    });
  });

  it("formats compatible results without recalculating compatibility", () => {
    expect(
      getCpuMotherboardCompatibilityView(
        { compatible: true },
        {
          id: "cpu",
          kind: "cpu",
          brand: "AMD",
          model: "Example CPU",
          socket: "AM5",
          cores: 6,
          threads: 12,
          tdpWatts: 65,
        },
        {
          id: "motherboard",
          kind: "motherboard",
          brand: "MSI",
          model: "Example Motherboard",
          socket: "AM5",
          chipset: "B650",
          formFactor: "ATX",
          memoryType: "DDR5",
          memorySlots: 4,
        },
      ),
    ).toEqual({
      status: "compatible",
      title: "✓ Compatible",
      message: "CPU y motherboard utilizan AM5.",
    });
  });

  it("formats incompatible socket details from the domain result", () => {
    expect(
      getCpuMotherboardCompatibilityView(
        {
          compatible: false,
          reason: {
            code: "SOCKET_MISMATCH",
            cpuSocket: "AM4",
            motherboardSocket: "AM5",
          },
        },
        {
          id: "cpu",
          kind: "cpu",
          brand: "AMD",
          model: "Example CPU",
          socket: "AM4",
          cores: 6,
          threads: 12,
          tdpWatts: 65,
        },
        {
          id: "motherboard",
          kind: "motherboard",
          brand: "MSI",
          model: "Example Motherboard",
          socket: "AM5",
          chipset: "B650",
          formFactor: "ATX",
          memoryType: "DDR5",
          memorySlots: 4,
        },
      ),
    ).toEqual({
      status: "incompatible",
      title: "✕ Incompatible",
      message: "La CPU utiliza AM4 y la motherboard utiliza AM5.",
    });
  });
});
