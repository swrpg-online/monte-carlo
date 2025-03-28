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
