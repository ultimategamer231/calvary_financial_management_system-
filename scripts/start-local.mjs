import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const project = "calvary-finance";
const network = "supabase_network_" + project;
const binding = "com.docker.network.bridge.host_binding_ipv4";
const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve("supabase/package.json")), "dist", "supabase.js");
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8" }).trim();

// Some Docker Desktop versions report an IPv6 wildcard alongside a loopback
// mapping even when only the Windows loopback proxy is listening.
function verifiedDesktopLoopback(port, mappings) {
  if (process.platform !== "win32" || port.HostIp !== "::" || !/^\d{1,5}$/.test(port.HostPort)) return false;
  if (!mappings.some((other) => other.HostIp === "127.0.0.1" && other.HostPort === port.HostPort)) return false;
  const endpoint = process.env.DOCKER_HOST || docker("context", "inspect", "--format", '{{(index .Endpoints "docker").Host}}');
  if (!/^npipe:\/\/\/\/\.\/pipe\/(dockerDesktopLinuxEngine|docker_engine)$/i.test(endpoint)) return false;
  const command = [
    "$ErrorActionPreference = 'Stop'",
    "$sockets = Get-NetTCPConnection -State Listen -LocalPort " + port.HostPort,
    "foreach ($socket in $sockets) {",
    "  if ($socket.LocalAddress -notin @('127.0.0.1', '::1')) { exit 1 }",
    "  if ((Get-Process -Id $socket.OwningProcess).ProcessName -ne 'com.docker.backend') { exit 1 }",
    "}",
    "if (-not $sockets) { exit 1 }",
  ].join("\n");
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command]);
  return true;
}

function checkPorts(id) {
  const ports = JSON.parse(docker("inspect", "--format", "{{json .NetworkSettings.Ports}}", id));
  for (const [containerPort, mappings] of Object.entries(ports ?? {})) {
    for (const port of mappings ?? []) {
      if (["127.0.0.1", "::1"].includes(port.HostIp)) continue;
      if (containerPort.endsWith("/tcp") && verifiedDesktopLoopback(port, mappings)) continue;
      throw new Error("Docker published a non-loopback port. See the local networking instructions in README.md.");
    }
  }
  return Object.values(ports ?? {}).flat().filter(Boolean).length;
}

function running() {
  return docker("ps", "-q", "--filter", "label=com.supabase.cli.project=" + project).split(/\s+/).filter(Boolean);
}

for (const id of running()) checkPorts(id);
const found = docker("network", "ls", "--filter", "name=^" + network + "$", "--format", "{{.Name}}");
if (!found) {
  docker("network", "create", "--driver", "bridge", "--label", "com.supabase.cli.project=" + project,
    "--label", "com.docker.compose.project=" + project, "--opt", binding + "=127.0.0.1", network);
}
const options = JSON.parse(docker("network", "inspect", network, "--format", "{{json .Options}}"));
if (options?.[binding] !== "127.0.0.1") throw new Error("Calvary requires a loopback-only bridge.");

// Docker Desktop versions differ in how they handle bridge binding defaults.
// Test a disposable container with no service or data before starting the database.
const probe = docker("run", "-d", "--rm", "--read-only", "--cap-drop", "ALL",
  "--network", network, "-p", "8080/tcp", "public.ecr.aws/docker/library/busybox:1.37.0", "sleep", "60");
try {
  if (!checkPorts(probe)) throw new Error("Could not verify the probe port.");
} finally {
  docker("stop", "-t", "0", probe);
}

try {
  execFileSync(process.execPath, [cli, "start", "-x",
    "realtime,imgproxy,mailpit,studio,edge-runtime,logflare,vector,supavisor"],
    { stdio: ["ignore", "ignore", "inherit"] });
  for (const id of running()) checkPorts(id);
  for (const service of ["db", "kong"]) {
    if (!checkPorts("supabase_" + service + "_" + project)) throw new Error("Missing local port for " + service);
  }
} catch (error) {
  execFileSync(process.execPath, [cli, "stop", "--project-id", project], { stdio: "inherit" });
  throw error;
}
console.log("Calvary local services are running with loopback-only published ports.");
