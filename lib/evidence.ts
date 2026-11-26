// The bucket accepts these three formats. Determine the download extension from the bytes.
export function evidenceFormat(bytes: Uint8Array) {
  const header = Buffer.from(bytes.subarray(0, 8));
  if (header.subarray(0, 5).toString("latin1") === "%PDF-")
    return { mime: "application/pdf", suffix: "pdf" };
  if (header.toString("hex") === "89504e470d0a1a0a")
    return { mime: "image/png", suffix: "png" };
  if (header.subarray(0, 3).toString("hex") === "ffd8ff")
    return { mime: "image/jpeg", suffix: "jpg" };
  return null;
}

export function evidenceName(original: string, suffix: string) {
  const name = original.replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 84);
  const stem = !name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name) ? "evidence" : name;
  return stem + "." + suffix;
}
