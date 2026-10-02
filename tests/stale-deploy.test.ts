import { describe, expect, it } from "vitest";
import { isStaleDeploymentError } from "@/lib/stale-deploy";

const named = (name: string, message = "boom") => Object.assign(new Error(message), { name });

describe("stale deployment detection", () => {
  it("recognises a Server Action the new build doesn't have", () => {
    expect(isStaleDeploymentError(named("UnrecognizedActionError"))).toBe(true);
    expect(
      isStaleDeploymentError(
        new Error(
          'Server Action "7f3a" was not found on the server. \nRead more: https://nextjs.org/docs/messages/failed-to-find-server-action',
        ),
      ),
    ).toBe(true);
  });

  it("recognises script files that went away with the old build", () => {
    expect(isStaleDeploymentError(named("ChunkLoadError", "Loading chunk 42 failed."))).toBe(true);
    expect(
      isStaleDeploymentError(new TypeError("Failed to fetch dynamically imported module: /x.js")),
    ).toBe(true);
    expect(isStaleDeploymentError(new TypeError("Importing a module script failed."))).toBe(true);
  });

  it("leaves real failures to the error screen", () => {
    expect(isStaleDeploymentError(new Error("Paystack could not start this transaction."))).toBe(false);
    expect(isStaleDeploymentError(named("TypeError", "Cannot read properties of undefined"))).toBe(false);
    expect(isStaleDeploymentError("not an error")).toBe(false);
    expect(isStaleDeploymentError(undefined)).toBe(false);
  });
});
