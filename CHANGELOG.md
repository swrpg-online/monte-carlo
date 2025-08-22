# [2.1.0](https://github.com/swrpg-online/monte-carlo/compare/v2.0.4...v2.1.0) (2025-08-22)

### Features

- **build:** add esbuild bundling and self-contained dist output ([cb951fb](https://github.com/swrpg-online/monte-carlo/commit/cb951fb03b0a5232654864dcf2f1ba7c600738e1))

## [2.0.4](https://github.com/swrpg-online/monte-carlo/compare/v2.0.3...v2.0.4) (2025-08-22)

### Bug Fixes

- update version of dice library ([6fd40eb](https://github.com/swrpg-online/monte-carlo/commit/6fd40eb4dfb7987707157d0ec0fa3a0cb9c496dd))

## [2.0.3](https://github.com/swrpg-online/monte-carlo/compare/v2.0.2...v2.0.3) (2025-04-22)

### Bug Fixes

- correct build and release process to include histogram/analysis properties ([0bc3df1](https://github.com/swrpg-online/monte-carlo/commit/0bc3df178e92464fd3b660be4474c7d193f7d9f8))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Features

- Support for Force dice light/dark side results in Monte Carlo simulations
- Added light/dark side properties to simulation results

### Breaking Changes

- Updated `DiceResult` interface to match `@swrpg-online/dice` package
  - Changed property names from singular to plural (e.g., `success` → `successes`)
  - Added `lightSide` and `darkSide` properties
  - This change requires updating code using the old property names

### Documentation

- Updated README.md to reflect new property names and Force dice support
- Added examples for Force dice usage in documentation

## [1.0.0] - 2024-03-28

### Features

- Initial release of Monte Carlo simulation library
- Monte Carlo simulation for Star Wars RPG dice pools
- Statistical analysis including:
  - Averages for all dice symbols
  - Medians for all dice symbols
  - Standard deviations for all dice symbols
- Probability calculations for:
  - Success probability (net successes > 0)
  - Critical success probability (at least one triumph)
  - Critical failure probability (at least one despair)
  - Net positive probability (both net successes and net advantages > 0)
