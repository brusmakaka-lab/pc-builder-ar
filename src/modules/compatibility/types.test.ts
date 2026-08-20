import { describe, expect, it } from "vitest";

import { getCompatibilityStatus } from "./types";

describe("getCompatibilityStatus", () => {
  it("returns compatible when all checks are compatible", () => {
    expect(
      getCompatibilityStatus([{ compatible: true }, { compatible: true }]),
    ).toBe("compatible");
  });

  it("returns unknown when compatible checks include unknown", () => {
    expect(getCompatibilityStatus([{ compatible: true }, null])).toBe("unknown");
  });

  it("returns incompatible when unknown checks include incompatible", () => {
    expect(getCompatibilityStatus([null, { compatible: false }])).toBe(
      "incompatible",
    );
  });

  it("returns incompatible when compatible checks include incompatible", () => {
    expect(
      getCompatibilityStatus([{ compatible: true }, { compatible: false }]),
    ).toBe("incompatible");
  });

  it("returns incompatible for multiple incompatible checks", () => {
    expect(
      getCompatibilityStatus([{ compatible: false }, { compatible: false }]),
    ).toBe("incompatible");
  });

  it("does not depend on input order for global precedence", () => {
    expect(
      getCompatibilityStatus([
        { compatible: true },
        null,
        { compatible: false },
      ]),
    ).toBe(
      getCompatibilityStatus([
        { compatible: false },
        { compatible: true },
        null,
      ]),
    );
  });
});
