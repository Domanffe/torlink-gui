import { spawn } from "node:child_process";

function runDev(script) {
  const child = spawn("npm", ["run", script], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else if (code && code !== 0) process.exit(code);
  });
  return child;
}

const search = runDev("dev:search");
const gui = runDev("dev:gui");

function shutdown() {
  search.kill();
  gui.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
