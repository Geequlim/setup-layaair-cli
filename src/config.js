"use strict";

const os = require("node:os");
const path = require("node:path");

const INSTALLER_URLS = {
  unix: "https://ldc-1251285021.file.myqcloud.com/layaair3/install.sh",
  win32: "https://ldc-1251285021.file.myqcloud.com/layaair3/install.ps1"
};

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}

function normalizeVersion(value) {
  const normalized = String(value || "").trim();
  return normalized === "" ? "latest" : normalized;
}

function isLatestVersion(version) {
  return version.toLowerCase() === "latest";
}

function defaultInstallDir(version, env = process.env, platform = process.platform) {
  const cacheRoot = env.RUNNER_TOOL_CACHE || path.join(os.homedir(), ".cache", "setup-layaair-cli");
  const versionPart = isLatestVersion(version) ? "latest" : version;
  return path.join(cacheRoot, "layaair-cli", versionPart, platform, process.arch);
}

function getExecutableName(platform = process.platform) {
  return platform === "win32" ? "layaair.cmd" : "layaair";
}

function getInstallerUrl(platform = process.platform) {
  return platform === "win32" ? INSTALLER_URLS.win32 : INSTALLER_URLS.unix;
}

function getCacheKey({ version, platform = process.platform, arch = process.arch }) {
  const versionPart = isLatestVersion(version) ? "latest" : version;
  return `setup-layaair-cli-${platform}-${arch}-${versionPart}`;
}

function shouldRestoreCache({ cacheEnabled, checkLatest, version }) {
  return cacheEnabled && !(checkLatest && isLatestVersion(version));
}

function validateNodeVersion(nodeVersion = process.versions.node) {
  const major = Number.parseInt(String(nodeVersion).split(".")[0], 10);
  if (!Number.isFinite(major) || major < 20) {
    throw new Error(`LayaAir CLI requires Node.js 20 or later. Current Node.js version is ${nodeVersion}.`);
  }
}

module.exports = {
  defaultInstallDir,
  getCacheKey,
  getExecutableName,
  getInstallerUrl,
  isLatestVersion,
  normalizeVersion,
  parseBoolean,
  shouldRestoreCache,
  validateNodeVersion
};
