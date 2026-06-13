# setup-layaair-cli

Install and enable the LayaAir CLI in GitHub Actions or compatible runners.

This action is intentionally close to `actions/setup-node`: callers select a LayaAir CLI version, the action installs the command entry, installs the requested CLI runtime, adds the executable directory to `PATH`, verifies the command, and exposes the resolved version.

## Usage

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v6
    with:
      node-version: 20

  - uses: Geequlim/setup-layaair-cli@v1
    with:
      version: 3.4.0

  - run: layaair --version
```

## Fixed Version

Pinning `version` is recommended for CI because it keeps workflow results reproducible and enables stable cache keys.

```yaml
- uses: Geequlim/setup-layaair-cli@v1
  with:
    version: 3.4.0
    cache: true
```

## Latest Version

If `version` is omitted or set to `latest`, the action installs the latest LayaAir CLI runtime reported by the official installer flow.

```yaml
- uses: Geequlim/setup-layaair-cli@v1
  with:
    cache: true
```

For `latest`, cached installs can become stale as upstream releases change. Set `check-latest: true` to skip the old cache and force a fresh install check.

```yaml
- uses: Geequlim/setup-layaair-cli@v1
  with:
    check-latest: true
```

## Custom Install Directory

```yaml
- uses: Geequlim/setup-layaair-cli@v1
  with:
    version: 3.4.0
    install-dir: ${{ runner.temp }}/layaair
```

When `install-dir` is omitted, the action installs under the runner tool cache when available, and falls back to a directory under the user's home directory.

## Inputs

| Name | Default | Description |
| --- | --- | --- |
| `version` | `latest` | LayaAir CLI runtime version to install. Empty or `latest` installs the latest runtime. |
| `install-dir` | Auto | Directory for the LayaAir command entry and installed runtimes. |
| `cache` | `true` | Restore and save the install directory with the Actions cache service. |
| `check-latest` | `false` | For latest installs, skip stale cache entries and run the official install flow again. |

## Outputs

| Name | Description |
| --- | --- |
| `version` | Version reported by `layaair --version` after installation. |
| `install-dir` | Directory added to `PATH`. |
| `cache-hit` | `true` when the install directory was restored from cache. |

## Cache Behavior

For fixed versions, the cache key includes the operating system, CPU architecture, and requested LayaAir CLI version.

For latest installs, the cache key uses `latest`. This is convenient for repeated CI runs, but fixed versions are still recommended for reliable builds. `check-latest: true` disables cache restore for latest installs so the action can re-check upstream.

## Requirements

- Node.js 20 or later in the runner environment.
- macOS, Linux, or Windows on `x64` or `arm64`.
- Network access to download the official LayaAir CLI installer and runtime.
- `unzip` on macOS and Linux, as required by the LayaAir CLI installer.

## Release

This repository must commit the generated `dist/index.js` file because JavaScript Actions run from the checked-in distribution bundle.

Recommended release flow:

1. Run `npm ci`.
2. Run `npm test`.
3. Run `npm run build`.
4. Commit source changes and the updated `dist/index.js`.
5. Create or move a major tag such as `v1` for workflow users.

## Development

```bash
npm ci
npm test
npm run build
```
