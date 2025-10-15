## [2.3.4](https://github.com/swrpg-online/monte-carlo/compare/v2.3.3...v2.3.4) (2025-10-15)

### Bug Fixes

- **deps:** upgrade @swrpg-online/dice to 3.0.0 and semantic-release to 24.2.9 ([4e5b993](https://github.com/swrpg-online/monte-carlo/commit/4e5b99330e35c2cb34ccc4b19ebb07843b21fbff))

## [2.3.3](https://github.com/swrpg-online/monte-carlo/compare/v2.3.2...v2.3.3) (2025-09-20)

### Bug Fixes

- **deps:** update @swrpg-online/dice to 2.1.1 ([f7e7bd0](https://github.com/swrpg-online/monte-carlo/commit/f7e7bd0b7be76557e89999a4aa4cde3bbb5d680c))
- **dice:** correctly count triumphs and despairs in roll summary ([333bca1](https://github.com/swrpg-online/monte-carlo/commit/333bca13f13133e5c1b52d277212fb9117593aad))

## [2.3.2](https://github.com/swrpg-online/monte-carlo/compare/v2.3.1...v2.3.2) (2025-09-19)

### Bug Fixes

- **dice:** correct summation of successes and failures in roll results ([620caee](https://github.com/swrpg-online/monte-carlo/commit/620caee97d385981bc602bed93ca1942fc63b61b))

## [2.3.1](https://github.com/swrpg-online/monte-carlo/compare/v2.3.0...v2.3.1) (2025-09-19)

### Bug Fixes

- **diceFaces:** add success to proficiency die's triumph face ([08c10b0](https://github.com/swrpg-online/monte-carlo/commit/08c10b0d633b95b9155a1921d629fe5aea7d4813))

# [2.3.0](https://github.com/swrpg-online/monte-carlo/compare/v2.2.0...v2.3.0) (2025-09-19)

### Features

- **montecarlo:** add lightSide and darkSide symbols to MonteCarlo simulation ([db32f2e](https://github.com/swrpg-online/monte-carlo/commit/db32f2e82e011ff9542c3b852ffcbea1019181ea))

# [2.2.0](https://github.com/swrpg-online/monte-carlo/compare/v2.1.0...v2.2.0) (2025-09-13)

### Features

- **monte-carlo:** add support for dice pool modifiers and modifier analysis ([6eae536](https://github.com/swrpg-online/monte-carlo/commit/6eae536d662edfca870dcb83ff3c140602124fbc))
- **montecarlo:** add support for modifiers and enhanced simulation scenarios ([9ca8b3b](https://github.com/swrpg-online/monte-carlo/commit/9ca8b3bebeafdf6ab4f02647f061ca6ede3147d4))

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
