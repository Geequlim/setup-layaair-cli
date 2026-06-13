"use strict";

const fs = require("node:fs");
const path = require("node:path");

const cache = require("@actions/cache");
const core = require("@actions/core");
const exec = require("@actions/exec");
const io = require("@actions/io");
const tc = require("@actions/tool-cache");

const {
  defaultInstallDir,
  getCacheKey,
  getExecutableName,
  getInstallerUrl,
  isLatestVersion,
  normalizeVersion,
  parseBoolean,
  shouldRestoreCache,
  validateNodeVersion
} = require("./config");

async function run() {
  try {
    validateNodeVersion();

    const version = normalizeVersion(core.getInput("version"));
    const cacheEnabled = parseBoolean(core.getInput("cache"), true);
    const checkLatest = parseBoolean(core.getInput("check-latest"), false);
    const installDir = path.resolve(
      core.getInput("install-dir") || defaultInstallDir(version)
    );
    const cacheKey = getCacheKey({ version });
    const cacheAvailable = cacheEnabled && cache.isFeatureAvailable();

    core.info(`Setting up LayaAir CLI ${isLatestVersion(version) ? "latest" : version}`);
    core.info(`Install directory: ${installDir}`);

    await io.mkdirP(installDir);

    let cacheHit = false;
    if (shouldRestoreCache({ cacheEnabled: cacheAvailable, checkLatest, version })) {
      const restoredKey = await cache.restoreCache([installDir], cacheKey);
      cacheHit = restoredKey === cacheKey;
      core.info(cacheHit ? `Restored LayaAir CLI from cache: ${restoredKey}` : "No LayaAir CLI cache hit");
    } else if (cacheEnabled && !cacheAvailable) {
      core.info("Actions cache service is unavailable; continuing without cache");
    } else if (cacheEnabled) {
      core.info("Skipping cache restore so latest can be checked upstream");
    }

    const layaairPath = path.join(installDir, getExecutableName());
    if (!cacheHit || !(await exists(layaairPath))) {
      await installCommandEntry(installDir);
      await installRuntime(layaairPath, version);
    }

    core.addPath(installDir);

    const actualVersion = await readLayaAirVersion(layaairPath);
    core.setOutput("version", actualVersion);
    core.setOutput("install-dir", installDir);
    core.setOutput("cache-hit", cacheHit ? "true" : "false");

    if (cacheAvailable && !cacheHit) {
      await saveCache(installDir, cacheKey);
    }

    core.info(`LayaAir CLI ${actualVersion} is ready`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

async function installCommandEntry(installDir) {
  const installerUrl = getInstallerUrl();
  core.info(`Downloading LayaAir CLI installer from ${installerUrl}`);
  const installerPath = await tc.downloadTool(installerUrl);

  if (process.platform === "win32") {
    const scriptPath = `${installerPath}.ps1`;
    await fs.promises.copyFile(installerPath, scriptPath);

    await exec.exec("powershell", [
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath
    ], {
      env: {
        ...process.env,
        LAYAAIR_INSTALL_DIR: installDir
      }
    });
    return;
  }

  await exec.exec("bash", [installerPath], {
    env: {
      ...process.env,
      LAYAAIR_INSTALL_DIR: installDir
    }
  });
}

async function installRuntime(layaairPath, version) {
  const args = ["install"];
  if (!isLatestVersion(version)) {
    args.push(version);
  }

  core.info(`Installing LayaAir CLI runtime ${isLatestVersion(version) ? "latest" : version}`);
  await exec.exec(layaairPath, args);
}

async function readLayaAirVersion(layaairPath) {
  const result = await exec.getExecOutput(layaairPath, ["--version"], {
    ignoreReturnCode: true,
    silent: true
  });

  if (result.exitCode !== 0) {
    throw new Error(`LayaAir CLI verification failed: ${result.stderr || result.stdout}`.trim());
  }

  const version = result.stdout.trim().split(/\r?\n/).find(Boolean);
  if (!version) {
    throw new Error("LayaAir CLI verification did not return a version.");
  }

  return version;
}

async function saveCache(installDir, cacheKey) {
  try {
    await cache.saveCache([installDir], cacheKey);
    core.info(`Saved LayaAir CLI cache: ${cacheKey}`);
  } catch (error) {
    if (error instanceof cache.ReserveCacheError) {
      core.info(`Cache already exists for key: ${cacheKey}`);
      return;
    }
    throw error;
  }
}

async function exists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

if (require.main === module) {
  run();
}

module.exports = {
  exists,
  installCommandEntry,
  installRuntime,
  readLayaAirVersion,
  run,
  saveCache
};
