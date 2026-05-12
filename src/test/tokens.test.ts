import { describe, expect, it } from "vitest";

import { extractTargetCredential } from "@/lib/tokens";

describe("extractTargetCredential", () => {
  it("extracts target tokens from absolute and relative target URLs", () => {
    expect(
      extractTargetCredential("https://networking.example.com/target/target_123"),
    ).toBe("target_123");
    expect(extractTargetCredential("/target/target_456?x=1")).toBe("target_456");
  });

  it("accepts fallback target codes", () => {
    expect(extractTargetCredential(" ABC123 ")).toBe("ABC123");
    expect(extractTargetCredential("target:ABC123")).toBe("ABC123");
  });
});
