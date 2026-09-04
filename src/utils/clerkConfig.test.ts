import { describe, expect, it } from "vitest";
import { isClerkPublishableKeyValid } from "../utils/clerkConfig";

describe("isClerkPublishableKeyValid", () => {
  it("rejects placeholder keys", () => {
    expect(isClerkPublishableKeyValid("your_clerk_publishable_key")).toBe(false);
    expect(isClerkPublishableKeyValid("")).toBe(false);
    expect(isClerkPublishableKeyValid(undefined)).toBe(false);
  });

  it("accepts real Clerk publishable keys", () => {
    expect(isClerkPublishableKeyValid("pk_test_abc123")).toBe(true);
    expect(isClerkPublishableKeyValid("pk_live_xyz")).toBe(true);
  });
});
