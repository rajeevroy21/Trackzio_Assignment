import assert from "node:assert";
import { describe, it } from "node:test";
import { getHealth } from "./health.controller.js";

describe("Health Controller", () => {
  it("returns 200 OK with success flag and timestamp", () => {
    let responseData: any = null;
    const mockRes: any = {
      json: (data: any) => {
        responseData = data;
      },
    };

    getHealth({} as any, mockRes);

    assert.strictEqual(responseData.success, true);
    assert.strictEqual(responseData.message, "API is running");
    assert.ok(typeof responseData.timestamp === "string");
  });
});
