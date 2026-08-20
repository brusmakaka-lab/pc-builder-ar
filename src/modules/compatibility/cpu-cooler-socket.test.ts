import { describe, expect, it } from "vitest";

import { checkCpuCoolerSocketCompatibility } from "./cpu-cooler-socket";

const cpu = {
  id: "cpu-test",
  kind: "cpu",
  brand: "AMD",
  model: "Ryzen",
  socket: "AM5",
  cores: 6,
  threads: 12,
  tdpWatts: 65,
} as const;

const cpuCooler = {
  id: "cpu-cooler-test",
  kind: "cpuCooler",
  brand: "Test",
  model: "Tower",
  heightMm: 150,
} as const;

describe("checkCpuCoolerSocketCompatibility", () => {
  it("accepts a supported CPU socket", () => {
    expect(
      checkCpuCoolerSocketCompatibility(cpu, {
        ...cpuCooler,
        supportedSockets: ["AM5"],
      }),
    ).toEqual({ compatible: true });
  });

  it("rejects an unsupported CPU socket", () => {
    expect(
      checkCpuCoolerSocketCompatibility(cpu, {
        ...cpuCooler,
        supportedSockets: ["AM4"],
      }),
    ).toEqual({
      compatible: false,
      reason: {
        code: "CPU_SOCKET_NOT_SUPPORTED",
        cpuSocket: "AM5",
        supportedSockets: ["AM4"],
      },
    });
  });

  it("accepts any explicitly supported socket from a multi-socket cooler", () => {
    expect(
      checkCpuCoolerSocketCompatibility(cpu, {
        ...cpuCooler,
        supportedSockets: ["AM4", "AM5", "LGA1700"],
      }),
    ).toEqual({ compatible: true });
  });
});
