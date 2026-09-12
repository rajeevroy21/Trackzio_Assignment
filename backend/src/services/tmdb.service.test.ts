import assert from "node:assert";
import { describe, it } from "node:test";
import { img, num, str } from "./tmdb.service.js";

describe("TMDB Service Helpers", () => {
  it("str() cleans and normalizes strings", () => {
    assert.strictEqual(str("  Inception  "), "Inception");
    assert.strictEqual(str(""), null);
    assert.strictEqual(str("   "), null);
    assert.strictEqual(str(123), null);
    assert.strictEqual(str(null), null);
  });

  it("num() returns valid numbers or null", () => {
    assert.strictEqual(num(8.8), 8.8);
    assert.strictEqual(num(0), 0);
    assert.strictEqual(num(NaN), null);
    assert.strictEqual(num(Infinity), null);
    assert.strictEqual(num("8.8"), null);
  });

  it("img() formats image URLs correctly", () => {
    assert.strictEqual(
      img("/poster.jpg", "w500"),
      "https://image.tmdb.org/t/p/w500/poster.jpg",
    );
    assert.strictEqual(img(null, "w500"), null);
    assert.strictEqual(img("", "w500"), null);
  });
});
