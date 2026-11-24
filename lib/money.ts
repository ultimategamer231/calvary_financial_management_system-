export function minor(text: string) {
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, part = ""] = text.split(".");
  const value = BigInt(whole) * 100n + BigInt(part.padEnd(2, "0"));
  return value > 0n ? value : null;
}
export function decimal(value: bigint | number | string) {
  const n = BigInt(value),
    abs = n < 0n ? -n : n;
  return (
    (n < 0n ? "-" : "") +
    abs / 100n +
    "." +
    (abs % 100n).toString().padStart(2, "0")
  );
}
export function money(currency: string, value: bigint | number | string) {
  return currency + " " + decimal(value).replace(/\B(?=(\d{3})+\.)/g, ",");
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Monrovia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
