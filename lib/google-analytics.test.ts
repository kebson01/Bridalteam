import { describe, it, expect } from "vitest";
import { parseMeasurementId } from "./google-analytics";

describe("parseMeasurementId", () => {
  it("accepts a GA4 measurement id", () => {
    expect(parseMeasurementId("G-ABC123XYZ9")).toBe("G-ABC123XYZ9");
    expect(parseMeasurementId("  G-ABC123XYZ9 \n")).toBe("G-ABC123XYZ9");
  });

  it("treats unset or malformed values as off", () => {
    expect(parseMeasurementId(undefined)).toBeUndefined();
    expect(parseMeasurementId("")).toBeUndefined();
    expect(parseMeasurementId("UA-12345-1")).toBeUndefined();
    expect(parseMeasurementId("G-ABC');alert(1)//")).toBeUndefined();
  });
});
