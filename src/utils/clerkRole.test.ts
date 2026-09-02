import { describe, expect, it } from "vitest";
import { hasAdminRole } from "../utils/clerkRole";

describe("clerkRole", () => {
  it("detects ADMIN from Clerk public metadata", () => {
    expect(hasAdminRole({ role: "ADMIN" })).toBe(true);
  });

  it("does not treat USER as admin", () => {
    expect(hasAdminRole({ role: "USER" })).toBe(false);
  });

  it("does not hardcode admin by email", () => {
    expect(hasAdminRole({ email: "admin@cinex.com" })).toBe(false);
  });
});
