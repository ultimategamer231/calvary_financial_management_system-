import assert from "node:assert/strict";
import { evidenceFormat, evidenceName } from "../lib/evidence.ts";

for (const [header, suffix] of [["255044462d", "pdf"], ["ffd8ff", "jpg"], ["89504e470d0a1a0a", "png"]]) {
  const format = evidenceFormat(Buffer.from(header, "hex"));
  assert.equal(format?.suffix, suffix);
  assert.equal(evidenceName("March receipt.old", suffix), "March_receipt." + suffix);
}
assert.equal(evidenceFormat(Buffer.alloc(0)), null);
assert.equal(evidenceName("CON.pdf", "pdf"), "evidence.pdf");
assert.equal(evidenceName("demo.pdf", "pdf"), "demo.pdf");
console.log("PASS: allowed evidence signatures and safe download extensions.");
