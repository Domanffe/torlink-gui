import { afterEach, describe, expect, it, vi } from "vitest";

const { checkMock, downloadAndInstallMock, relaunchMock } = vi.hoisted(() => ({
  checkMock: vi.fn(),
  downloadAndInstallMock: vi.fn(),
  relaunchMock: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: checkMock,
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: relaunchMock,
}));

import { runUpdateCheck } from "./updateCheck";

describe("runUpdateCheck", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports when no update is available", async () => {
    checkMock.mockResolvedValue(null);

    await expect(runUpdateCheck(false)).resolves.toEqual({ status: "current" });
  });

  it("reports an available update without installing", async () => {
    checkMock.mockResolvedValue({ version: "1.4.6", downloadAndInstall: downloadAndInstallMock });

    await expect(runUpdateCheck(false)).resolves.toEqual({
      status: "available",
      version: "1.4.6",
    });
    expect(downloadAndInstallMock).not.toHaveBeenCalled();
  });

  it("installs and relaunches when requested", async () => {
    checkMock.mockResolvedValue({ version: "1.4.6", downloadAndInstall: downloadAndInstallMock });
    downloadAndInstallMock.mockResolvedValue(undefined);
    relaunchMock.mockResolvedValue(undefined);

    await expect(runUpdateCheck(true)).resolves.toEqual({
      status: "available",
      version: "1.4.6",
    });
    expect(downloadAndInstallMock).toHaveBeenCalledOnce();
    expect(relaunchMock).toHaveBeenCalledOnce();
  });

  it("returns an error instead of pretending the app is up to date", async () => {
    checkMock.mockRejectedValue(new Error("Targets not found for windows-x86_64-msi"));

    await expect(runUpdateCheck(false)).resolves.toEqual({
      status: "error",
      message: "Targets not found for windows-x86_64-msi",
    });
  });
});
