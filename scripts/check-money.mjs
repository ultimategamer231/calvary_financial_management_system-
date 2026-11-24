import assert from "node:assert/strict";
import { minor, decimal, money } from "../lib/money.ts";
for (const bad of [
  "",
  "0",
  "0.00",
  "-1",
  "1.001",
  "1e3",
  "1,000",
  "1000000000000.00",
])
  assert.equal(minor(bad), null);
for (const [value, expected] of [
  ["0.01", 1n],
  ["1.1", 110n],
  ["999999999999.99", 99999999999999n],
])
  assert.equal(minor(value), expected);
assert.equal(decimal(-15n), "-0.15");
assert.equal(money("LRD", "12345678900"), "LRD 123,456,789.00");
console.log("PASS: minor-unit decimal boundaries and display");
