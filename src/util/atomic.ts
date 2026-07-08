import { promises as fs, renameSync, rmSync } from "node:fs";
import path from "node:path";

export function serializeWrites(): (task: () => Promise<void>) => Promise<void> {
  let chain: Promise<void> = Promise.resolve();
  return (task) => {
    chain = chain.then(task).catch(() => {});
    return chain;
  };
}

export async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await replaceFile(tmp, file);
}

export async function replaceFile(tmp: string, file: string): Promise<void> {
  try {
    await fs.rename(tmp, file);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST" && err.code !== "EPERM") {
      throw error;
    }
    await fs.rm(file, { force: true });
    await fs.rename(tmp, file);
  }
}

export function replaceFileSync(tmp: string, file: string): void {
  try {
    renameSync(tmp, file);
  } catch {
    rmSync(file, { force: true });
    renameSync(tmp, file);
  }
}
