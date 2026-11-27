import type { choices } from "./collections";
export type Options = Awaited<ReturnType<typeof choices>>;
export type Fields = Record<string, string>;
export type Draft = {
  kind: string;
  member: string;
  currency: string;
  fields: Fields;
  lines: { category: string; amount: string; obligation: string }[];
};
export type Posting = {
  kind: string;
  currency: string;
  total: string;
  date?: string;
  lines: { category: string; obligation: string; amount: string }[];
  replaces: string;
};
export type Item = {
  state: "draft" | "pending" | "review";
  draft: Draft;
  entry?: Posting;
};
const base = "cbc-offline-v1:";
function cookie(name: string) {
  return document.cookie
    .split("; ")
    .find((s) => s.startsWith(name + "="))
    ?.slice(name.length + 1);
}
export function lease() {
  const [marker, owner, expiry, hex] = (cookie("calvary-offline") ?? "").split(
    ".",
  );
  if (
    !marker ||
    marker !== cookie("calvary-device") ||
    !Number.isFinite(Number(expiry)) || Date.now() >= Number(expiry) ||
    !/^[0-9a-f]{64}$/.test(hex ?? "")
  )
    return null;
  return { owner, hex, marker };
}
function access(owner: string) {
  const active = lease();
  if (!active || active.owner !== owner)
    throw Error("Sign in again to open your saved work.");
  return active;
}
function storageKey(owner: string, id: string) {
  return base + owner + ":" + id;
}
function encode(bytes: Uint8Array) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function decode(hex: string) {
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));
}
async function cipherKey(owner: string) {
  return crypto.subtle.importKey(
    "raw",
    decode(access(owner).hex),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}
export async function save(owner: string, id: string, data: Item | Options) {
  const name = storageKey(owner, id);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(name) },
    await cipherKey(owner),
    new TextEncoder().encode(JSON.stringify(data)),
  );
  access(owner);
  localStorage.setItem(name, encode(iv) + encode(new Uint8Array(encrypted)));
  window.dispatchEvent(new Event("calvary-storage"));
}
export async function read<T>(owner: string, id: string): Promise<T | null> {
  const name = storageKey(owner, id);
  const raw = localStorage.getItem(name);
  if (!raw) return null;
  const data = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: decode(raw.slice(0, 24)),
      additionalData: new TextEncoder().encode(name),
    },
    await cipherKey(owner),
    decode(raw.slice(24)),
  );
  access(owner);
  return JSON.parse(new TextDecoder().decode(data));
}
export async function items(owner: string) {
  const prefix = storageKey(owner, "");
  const ids = Object.keys(localStorage)
    .filter((k) => k.startsWith(prefix) && !k.endsWith(":options"))
    .map((k) => k.slice(prefix.length));
  const result = await Promise.all(
    ids.map(async (id) => ({ id, item: await read<Item>(owner, id) })),
  );
  return result.filter((r): r is { id: string; item: Item } => !!r.item);
}
export function request(op: string, body?: object) {
  return fetch("/api/offline?op=" + op, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: { "x-calvary-offline": "1", "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });
}
export function lockLease(owner: string) {
  if (lease()?.owner === owner)
    document.cookie = "calvary-offline=; Path=/; Max-Age=0; SameSite=Lax";
  window.dispatchEvent(new Event("calvary-status"));
}
export async function deliver(owner: string, id: string) {
  return navigator.locks.request(storageKey(owner, id), async () => {
    const item = await read<Item>(owner, id);
    if (!item || item.state !== "pending") return;
    const response = await request("post", {
      owner,
      key: id,
      entry: item.entry,
    });
    if (response.status === 401 || response.status === 403) {
      lockLease(owner);
      return;
    }
    access(owner);
    if ([400, 413, 422].includes(response.status)) {
      await save(owner, id, { ...item, state: "review" });
    } else if (response.ok) {
      const { receipt } = await response.json();
      if (typeof receipt !== "string" || !/^[a-f0-9-]{36}$/.test(receipt))
        return;
      localStorage.removeItem(storageKey(owner, id));
      window.dispatchEvent(new Event("calvary-storage"));
      return receipt as string;
    }
  });
}
