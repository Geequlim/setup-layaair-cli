"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

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
} = require("../src/config");

test("normalizes empty versions to latest", () => {
  assert.equal(normalizeVersion(""), "latest");
  assert.equal(normalizeVersion("  "), "latest");
  assert.equal(normalizeVersion("3.4.0"), "3.4.0");
});

test("detects latest version input case-insensitively", () => {
  assert.equal(isLatestVersion("latest"), true);
  assert.equal(isLatestVersion("LATEST"), true);
  assert.equal(isLatestVersion("3.4.0"), false);
});

test("parses boolean action inputs", () => {
  assert.equal(parseBoolean("", true), true);
  assert.equal(parseBoolean("false", true), false);
  assert.equal(parseBoolean("yes", false), true);
  assert.throws(() => parseBoolean("maybe", false), /Invalid boolean/);
});

test("builds cache keys from platform, architecture, and version", () => {
  assert.equal(
    getCacheKey({ version: "3.4.0", platform: "linux", arch: "x64" }),
    "setup-layaair-cli-linux-x64-3.4.0"
  );
});

test("skips cache restore when checking latest", () => {
  assert.equal(
    shouldRestoreCache({ cacheEnabled: true, checkLatest: true, version: "latest" }),
    false
  );
  assert.equal(
    shouldRestoreCache({ cacheEnabled: true, checkLatest: true, version: "3.4.0" }),
    true
  );
});

test("selects installer and executable names per platform", () => {
  assert.equal(getExecutableName("win32"), "layaair.cmd");
  assert.equal(getExecutableName("linux"), "layaair");
  assert.match(getInstallerUrl("win32"), /install\.ps1$/);
  assert.match(getInstallerUrl("darwin"), /install\.sh$/);
});

test("uses tool cache for default install directory", () => {
  const dir = defaultInstallDir("3.4.0", { RUNNER_TOOL_CACHE: "/tmp/tools" }, "linux");
  assert.match(dir, /^\/tmp\/tools\/layaair-cli\/3\.4\.0\/linux\//);
});

test("requires Node.js 20 or later", () => {
  assert.doesNotThrow(() => validateNodeVersion("20.0.0"));
  assert.doesNotThrow(() => validateNodeVersion("22.1.0"));
  assert.throws(() => validateNodeVersion("18.20.0"), /Node\.js 20 or later/);
});
