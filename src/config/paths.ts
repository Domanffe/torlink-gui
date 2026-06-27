import os from "node:os";
import path from "node:path";
import envPaths from "env-paths";

export const APP_NAME = "torlink";

export const paths = envPaths(APP_NAME, { suffix: "" });

export const defaultDownloadDir = path.join(os.homedir(), "Downloads", APP_NAME);

export const configFile = path.join(paths.config, "config.json");

export const queueFile = path.join(paths.data, "queue.json");

export const historyFile = path.join(paths.data, "history.json");
