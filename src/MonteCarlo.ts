import { DicePool, roll } from "@swrpg-online/dice";
import { DiceResult } from "@swrpg-online/dice/dist/types";

export { DicePool };

export interface ModifierConfig {
  automaticSuccesses?: number;
  automaticFailures?: number;
  automaticAdvantages?: number;
  automaticThreats?: number;
  automaticTriumphs?: number;
  automaticDespairs?: number;
  automaticLightSide?: number;
  automaticDarkSide?: number;
  upgradeAbility?: number;
  upgradeDifficulty?: number;
  downgradeProficiency?: number;
  downgradeChallenge?: number;
}

export interface SimulationConfig {
  dicePool: DicePool;
  iterations?: number;
  modifiers?: ModifierConfig;
  playerModifiers?: ModifierConfig;
  oppositionModifiers?: ModifierConfig;
}

export interface ModifierAnalysis {
  automaticSymbolContribution: {
    successes: number;
    failures: number;
    advantages: number;
    threats: number;
    triumphs: number;
    despairs: number;
    lightSide: number;
    darkSide: number;
  };
  rolledSymbolContribution: {
    successes: number;
    failures: number;
    advantages: number;
    threats: number;
    triumphs: number;
    despairs: number;
    lightSide: number;
    darkSide: number;
  };
  upgradeImpact: {
    abilityUpgrades: number;
    difficultyUpgrades: number;
    proficiencyDowngrades: number;
    challengeDowngrades: number;
  };
}

export class MonteCarloError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonteCarloError";
  }
}

export interface HistogramData {
  netSuccesses: { [key: number]: number };
  netAdvantages: { [key: number]: number };
  triumphs: { [key: number]: number };
  despairs: { [key: number]: number };
  lightSide: { [key: number]: number };
  darkSide: { [key: number]: number };
}

export interface DistributionAnalysis {
  skewness: number;
  kurtosis: number;
  outliers: number[];
  modes: number[];
  percentiles: {
    [key: number]: number; // key: percentile (0-100), value: threshold
  };
}

export interface MonteCarloResult {
  averages: DiceResult;
  medians: DiceResult;
  standardDeviations: DiceResult;
  successProbability: number;
  criticalSuccessProbability: number;
  criticalFailureProbability: number;
  netPositiveProbability: number;
  histogram: HistogramData;
  analysis: {
    netSuccesses: DistributionAnalysis;
    netAdvantages: DistributionAnalysis;
    triumphs: DistributionAnalysis;
    despairs: DistributionAnalysis;
    lightSide: DistributionAnalysis;
    darkSide: DistributionAnalysis;
  };
  modifierAnalysis?: ModifierAnalysis;
}

export class MonteCarlo {
  private readonly dicePool: DicePool;
  private readonly iterations: number;
  private readonly modifiers?: ModifierConfig;
  private readonly config?: SimulationConfig;
  private histogram: HistogramData = {
    netSuccesses: {},
    netAdvantages: {},
    triumphs: {},
    despairs: {},
    lightSide: {},
    darkSide: {},
  };
  private static readonly MIN_ITERATIONS = 100;
  private static readonly MAX_ITERATIONS = 1000000;
  private statsCache: Map<string, number> = new Map();
  private modifierStats: ModifierAnalysis = {
    automaticSymbolContribution: {
      successes: 0,
      failures: 0,
      advantages: 0,
      threats: 0,
      triumphs: 0,
      despairs: 0,
      lightSide: 0,
      darkSide: 0,
    },
    rolledSymbolContribution: {
      successes: 0,
      failures: 0,
      advantages: 0,
      threats: 0,
      triumphs: 0,
      despairs: 0,
      lightSide: 0,
      darkSide: 0,
    },
    upgradeImpact: {
      abilityUpgrades: 0,
      difficultyUpgrades: 0,
      proficiencyDowngrades: 0,
      challengeDowngrades: 0,
    },
  };
  private runningStats: {
    successCount: number;
    criticalSuccessCount: number;
    criticalFailureCount: number;
    netPositiveCount: number;
    sumSuccesses: number;
    sumAdvantages: number;
    sumTriumphs: number;
    sumFailures: number;
    sumThreats: number;
    sumDespair: number;
    sumLightSide: number;
    sumDarkSide: number;
    sumSquaredSuccesses: number;
    sumSquaredAdvantages: number;
    sumSquaredThreats: number;
    sumSquaredFailures: number;
    sumSquaredDespair: number;
    sumSquaredLightSide: number;
    sumSquaredDarkSide: number;
    sumSquaredTriumphs: number;
  } = {
    successCount: 0,
    criticalSuccessCount: 0,
    criticalFailureCount: 0,
    netPositiveCount: 0,
    sumSuccesses: 0,
    sumAdvantages: 0,
    sumTriumphs: 0,
    sumFailures: 0,
    sumThreats: 0,
    sumDespair: 0,
    sumLightSide: 0,
    sumDarkSide: 0,
    sumSquaredSuccesses: 0,
    sumSquaredAdvantages: 0,
    sumSquaredThreats: 0,
    sumSquaredFailures: 0,
    sumSquaredDespair: 0,
    sumSquaredLightSide: 0,
    sumSquaredDarkSide: 0,
    sumSquaredTriumphs: 0,
  };
  private results: DiceResult[] = [];

  constructor(
    dicePoolOrConfig: DicePool | SimulationConfig,
    iterations: number = 10000,
    runSimulate: boolean = true,
  ) {
    if (this.isSimulationConfig(dicePoolOrConfig)) {
      this.config = dicePoolOrConfig;
      this.dicePool = dicePoolOrConfig.dicePool;
      this.iterations = dicePoolOrConfig.iterations || iterations;
      this.modifiers =
        dicePoolOrConfig.modifiers ||
        this.mergeModifiers(
          dicePoolOrConfig.playerModifiers,
          dicePoolOrConfig.oppositionModifiers,
        );
    } else {
      this.dicePool = dicePoolOrConfig;
      this.iterations = iterations;
    }

    this.validateDicePool(this.dicePool);
    this.validateIterations(this.iterations);
    this.resetRunningStats();
    if (runSimulate) {
      this.simulate();
    }
  }

  private isSimulationConfig(obj: any): obj is SimulationConfig {
    return obj && typeof obj === "object" && "dicePool" in obj;
  }

  private mergeModifiers(
    player?: ModifierConfig,
    opposition?: ModifierConfig,
  ): ModifierConfig | undefined {
    if (!player && !opposition) return undefined;

    const merged: ModifierConfig = {};

    if (player) {
      merged.automaticSuccesses = player.automaticSuccesses;
      merged.automaticAdvantages = player.automaticAdvantages;
      merged.automaticTriumphs = player.automaticTriumphs;
      // Triumph includes an implicit success in SWRPG, so add it to successes
      if (player.automaticTriumphs) {
        merged.automaticSuccesses =
          (merged.automaticSuccesses || 0) + player.automaticTriumphs;
      }
      merged.automaticLightSide = player.automaticLightSide;
      merged.upgradeAbility = player.upgradeAbility;
      merged.downgradeProficiency = player.downgradeProficiency;
    }

    if (opposition) {
      merged.automaticFailures = opposition.automaticFailures;
      merged.automaticThreats = opposition.automaticThreats;
      merged.automaticDespairs = opposition.automaticDespairs;
      // Despair includes an implicit failure in SWRPG, so add it to failures
      if (opposition.automaticDespairs) {
        merged.automaticFailures =
          (merged.automaticFailures || 0) + opposition.automaticDespairs;
      }
      merged.automaticDarkSide = opposition.automaticDarkSide;
      merged.upgradeDifficulty = opposition.upgradeDifficulty;
      merged.downgradeChallenge = opposition.downgradeChallenge;
    }

    return merged;
  }

  private applyModifiers(pool: DicePool): DicePool {
    if (!this.modifiers) return pool;

    const modifiedPool: DicePool = { ...pool };

    // Apply automatic symbols
    if (this.modifiers.automaticSuccesses)
      modifiedPool.automaticSuccesses =
        (modifiedPool.automaticSuccesses || 0) +
        this.modifiers.automaticSuccesses;
    if (this.modifiers.automaticFailures)
      modifiedPool.automaticFailures =
        (modifiedPool.automaticFailures || 0) +
        this.modifiers.automaticFailures;
    if (this.modifiers.automaticAdvantages)
      modifiedPool.automaticAdvantages =
        (modifiedPool.automaticAdvantages || 0) +
        this.modifiers.automaticAdvantages;
    if (this.modifiers.automaticThreats)
      modifiedPool.automaticThreats =
        (modifiedPool.automaticThreats || 0) + this.modifiers.automaticThreats;
    if (this.modifiers.automaticTriumphs) {
      modifiedPool.automaticTriumphs =
        (modifiedPool.automaticTriumphs || 0) +
        this.modifiers.automaticTriumphs;
      // Triumph includes an implicit success in SWRPG
      modifiedPool.automaticSuccesses =
        (modifiedPool.automaticSuccesses || 0) +
        this.modifiers.automaticTriumphs;
    }
    if (this.modifiers.automaticDespairs) {
      modifiedPool.automaticDespairs =
        (modifiedPool.automaticDespairs || 0) +
        this.modifiers.automaticDespairs;
      // Despair includes an implicit failure in SWRPG
      modifiedPool.automaticFailures =
        (modifiedPool.automaticFailures || 0) +
        this.modifiers.automaticDespairs;
    }
    if (this.modifiers.automaticLightSide)
      modifiedPool.automaticLightSide =
        (modifiedPool.automaticLightSide || 0) +
        this.modifiers.automaticLightSide;
    if (this.modifiers.automaticDarkSide)
      modifiedPool.automaticDarkSide =
        (modifiedPool.automaticDarkSide || 0) +
        this.modifiers.automaticDarkSide;

    // Apply upgrades/downgrades
    if (this.modifiers.upgradeAbility)
      modifiedPool.upgradeAbility =
        (modifiedPool.upgradeAbility || 0) + this.modifiers.upgradeAbility;
    if (this.modifiers.upgradeDifficulty)
      modifiedPool.upgradeDifficulty =
        (modifiedPool.upgradeDifficulty || 0) +
        this.modifiers.upgradeDifficulty;
    if (this.modifiers.downgradeProficiency)
      modifiedPool.downgradeProficiency =
        (modifiedPool.downgradeProficiency || 0) +
        this.modifiers.downgradeProficiency;
    if (this.modifiers.downgradeChallenge)
      modifiedPool.downgradeChallenge =
        (modifiedPool.downgradeChallenge || 0) +
        this.modifiers.downgradeChallenge;

    // Track upgrades for analysis
    this.modifierStats.upgradeImpact.abilityUpgrades =
      this.modifiers.upgradeAbility || 0;
    this.modifierStats.upgradeImpact.difficultyUpgrades =
      this.modifiers.upgradeDifficulty || 0;
    this.modifierStats.upgradeImpact.proficiencyDowngrades =
      this.modifiers.downgradeProficiency || 0;
    this.modifierStats.upgradeImpact.challengeDowngrades =
      this.modifiers.downgradeChallenge || 0;

    return modifiedPool;
  }

  private validateDicePool(dicePool: DicePool): void {
    if (!dicePool || typeof dicePool !== "object") {
      throw new MonteCarloError(
        "Invalid dice pool: must be a valid DicePool object",
      );
    }

    const diceTypes = [
      "abilityDice",
      "proficiencyDice",
      "boostDice",
      "setBackDice",
      "difficultyDice",
      "challengeDice",
      "forceDice",
    ];

    // Check if at least one die type is present
    const hasAnyDice = diceTypes.some(
      (type) =>
        dicePool[type as keyof DicePool] &&
        dicePool[type as keyof DicePool]! > 0,
    );

    if (!hasAnyDice) {
      throw new MonteCarloError(
        "Invalid dice pool: must contain at least one die",
      );
    }

    // Validate each die count is non-negative
    diceTypes.forEach((type) => {
      const count = dicePool[type as keyof DicePool];
      if (count !== undefined && (count < 0 || !Number.isInteger(count))) {
        throw new MonteCarloError(
          `Invalid ${type}: must be a non-negative integer`,
        );
      }
    });
  }

  private validateIterations(iterations: number): void {
    if (!Number.isInteger(iterations)) {
      throw new MonteCarloError("Iterations must be an integer");
    }
    if (iterations < MonteCarlo.MIN_ITERATIONS) {
      throw new MonteCarloError(
        `Iterations must be at least ${MonteCarlo.MIN_ITERATIONS}`,
      );
    }
    if (iterations > MonteCarlo.MAX_ITERATIONS) {
      throw new MonteCarloError(
        `Iterations must not exceed ${MonteCarlo.MAX_ITERATIONS}`,
      );
    }
  }

  private calculateHistogramStats(
    histogram: { [key: number]: number },
    totalCount: number,
  ): {
    mean: number;
    stdDev: number;
    sum: number;
    sumSquares: number;
  } {
    let sum = 0;
    let sumSquares = 0;
    let count = 0;

    // Single pass to calculate sum and sum of squares
    for (const [value, freq] of Object.entries(histogram)) {
      const val = parseInt(value);
      sum += val * freq;
      sumSquares += val * val * freq;
      count += freq;
    }

    const mean = sum / count;
    const variance = sumSquares / count - mean * mean;
    const stdDev = Math.sqrt(Math.max(0, variance)); // Avoid negative values due to floating point errors

    return { mean, stdDev, sum, sumSquares };
  }

  private calculateSkewness(
    histogram: { [key: number]: number },
    stats: { mean: number; stdDev: number },
  ): number {
    if (stats.stdDev === 0) return 0;

    let sumCubedDeviations = 0;
    let totalCount = 0;

    for (const [value, freq] of Object.entries(histogram)) {
      const deviation = (parseInt(value) - stats.mean) / stats.stdDev;
      sumCubedDeviations += Math.pow(deviation, 3) * freq;
      totalCount += freq;
    }

    return sumCubedDeviations / totalCount;
  }

  private calculateKurtosis(
    histogram: { [key: number]: number },
    stats: { mean: number; stdDev: number },
  ): number {
    if (stats.stdDev === 0) return 0;

    let sumFourthPowerDeviations = 0;
    let totalCount = 0;

    for (const [value, freq] of Object.entries(histogram)) {
      const deviation = (parseInt(value) - stats.mean) / stats.stdDev;
      sumFourthPowerDeviations += Math.pow(deviation, 4) * freq;
      totalCount += freq;
    }

    return sumFourthPowerDeviations / totalCount - 3;
  }

  private findOutliers(
    histogram: { [key: number]: number },
    stats: { mean: number; stdDev: number },
  ): number[] {
    if (stats.stdDev === 0) return [];
    const threshold = 2;
    return Object.entries(histogram)
      .filter(
        ([value]) =>
          Math.abs(parseInt(value) - stats.mean) > threshold * stats.stdDev,
      )
      .map(([value]) => parseInt(value));
  }

  private analyzeDistribution(
    histogram: { [key: number]: number },
    totalCount: number,
  ): DistributionAnalysis {
    // Calculate basic statistics in a single pass
    const stats = this.calculateHistogramStats(histogram, totalCount);

    return {
      skewness: this.calculateSkewness(histogram, stats),
      kurtosis: this.calculateKurtosis(histogram, stats),
      outliers: this.findOutliers(histogram, stats),
      modes: this.findModes(histogram),
      percentiles: this.calculatePercentiles(histogram, totalCount),
    };
  }

  private average(
    selector: ((roll: DiceResult) => number) | { name: string },
  ): number {
    const selectorName =
      typeof selector === "function"
        ? selector.name || "custom"
        : selector.name;
    const cacheKey = `avg_${selectorName}`;
    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey)!;
    }

    let sum = 0;
    if (typeof selector === "function") {
      // For function selectors, calculate sum directly
      sum = this.results.reduce((acc: number, roll: DiceResult) => {
        const value = selector(roll);
        if (typeof value !== "number" || isNaN(value)) {
          throw new MonteCarloError(`Invalid selector result: ${value}`);
        }
        return acc + value;
      }, 0);
    } else {
      // For named selectors, use running stats
      switch (selector.name) {
        case "successes":
          sum = this.runningStats.sumSuccesses;
          break;
        case "advantages":
          sum = this.runningStats.sumAdvantages;
          break;
        case "triumphs":
          sum = this.runningStats.sumTriumphs;
          break;
        case "failures":
          sum = this.runningStats.sumFailures;
          break;
        case "threats":
          sum = this.runningStats.sumThreats;
          break;
        case "despair":
          sum = this.runningStats.sumDespair;
          break;
        case "lightSide":
          sum = this.runningStats.sumLightSide;
          break;
        case "darkSide":
          sum = this.runningStats.sumDarkSide;
          break;
        default:
          throw new MonteCarloError(`Unknown selector: ${selector.name}`);
      }
    }

    const avg = sum / this.iterations;
    this.statsCache.set(cacheKey, avg);
    return avg;
  }

  private standardDeviation(
    selector: ((roll: DiceResult) => number) | { name: string },
  ): number {
    const selectorName =
      typeof selector === "function"
        ? selector.name || "custom"
        : selector.name;
    const cacheKey = `std_${selectorName}`;
    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey)!;
    }

    const avg = this.average(selector);
    let squareSum = 0;

    if (typeof selector === "function") {
      // For function selectors, calculate square sum directly
      squareSum = this.results.reduce((acc: number, roll: DiceResult) => {
        const value = selector(roll);
        if (typeof value !== "number" || isNaN(value)) {
          throw new MonteCarloError(`Invalid selector result: ${value}`);
        }
        return acc + value * value;
      }, 0);
    } else {
      // For named selectors, use running stats
      switch (selector.name) {
        case "successes":
          squareSum = this.runningStats.sumSquaredSuccesses;
          break;
        case "advantages":
          squareSum = this.runningStats.sumSquaredAdvantages;
          break;
        case "threats":
          squareSum = this.runningStats.sumSquaredThreats;
          break;
        case "triumphs":
          squareSum = this.runningStats.sumSquaredTriumphs;
          break;
        case "failures":
          squareSum = this.runningStats.sumSquaredFailures;
          break;
        case "despair":
          squareSum = this.runningStats.sumSquaredDespair;
          break;
        case "lightSide":
          squareSum = this.runningStats.sumSquaredLightSide;
          break;
        case "darkSide":
          squareSum = this.runningStats.sumSquaredDarkSide;
          break;
        default:
          throw new MonteCarloError(`Unknown selector: ${selector.name}`);
      }
    }

    const stdDev = Math.sqrt(Math.abs(squareSum / this.iterations - avg * avg));
    this.statsCache.set(cacheKey, stdDev);
    return stdDev;
  }

  private resetRunningStats(): void {
    this.runningStats = {
      successCount: 0,
      criticalSuccessCount: 0,
      criticalFailureCount: 0,
      netPositiveCount: 0,
      sumSuccesses: 0,
      sumAdvantages: 0,
      sumTriumphs: 0,
      sumFailures: 0,
      sumThreats: 0,
      sumDespair: 0,
      sumLightSide: 0,
      sumDarkSide: 0,
      sumSquaredSuccesses: 0,
      sumSquaredAdvantages: 0,
      sumSquaredThreats: 0,
      sumSquaredFailures: 0,
      sumSquaredDespair: 0,
      sumSquaredLightSide: 0,
      sumSquaredDarkSide: 0,
      sumSquaredTriumphs: 0,
    };
  }

  private resetModifierStats(): void {
    this.modifierStats = {
      automaticSymbolContribution: {
        successes: 0,
        failures: 0,
        advantages: 0,
        threats: 0,
        triumphs: 0,
        despairs: 0,
        lightSide: 0,
        darkSide: 0,
      },
      rolledSymbolContribution: {
        successes: 0,
        failures: 0,
        advantages: 0,
        threats: 0,
        triumphs: 0,
        despairs: 0,
        lightSide: 0,
        darkSide: 0,
      },
      upgradeImpact: {
        abilityUpgrades: 0,
        difficultyUpgrades: 0,
        proficiencyDowngrades: 0,
        challengeDowngrades: 0,
      },
    };
  }

  private trackModifierContribution(result: DiceResult): void {
    if (!this.modifiers) return;

    // Get the automatic symbols from the dice pool (these are already included in the result)
    // The DicePool modifiers are applied by the dice library, so the result already includes them
    const poolModifiers = this.applyModifiers(this.dicePool);
    const autoSuccesses = poolModifiers.automaticSuccesses || 0;
    const autoFailures = poolModifiers.automaticFailures || 0;
    const autoAdvantages = poolModifiers.automaticAdvantages || 0;
    const autoThreats = poolModifiers.automaticThreats || 0;
    const autoTriumphs = poolModifiers.automaticTriumphs || 0;
    const autoDespairs = poolModifiers.automaticDespairs || 0;
    const autoLightSide = poolModifiers.automaticLightSide || 0;
    const autoDarkSide = poolModifiers.automaticDarkSide || 0;

    // Track automatic symbol contributions
    this.modifierStats.automaticSymbolContribution.successes += autoSuccesses;
    this.modifierStats.automaticSymbolContribution.failures += autoFailures;
    this.modifierStats.automaticSymbolContribution.advantages += autoAdvantages;
    this.modifierStats.automaticSymbolContribution.threats += autoThreats;
    this.modifierStats.automaticSymbolContribution.triumphs += autoTriumphs;
    this.modifierStats.automaticSymbolContribution.despairs += autoDespairs;
    this.modifierStats.automaticSymbolContribution.lightSide += autoLightSide;
    this.modifierStats.automaticSymbolContribution.darkSide += autoDarkSide;

    // Track rolled symbol contributions (total result minus automatic symbols)
    // The result from roll() already includes automatic symbols, so we subtract them
    this.modifierStats.rolledSymbolContribution.successes += Math.max(
      0,
      result.successes - autoSuccesses,
    );
    this.modifierStats.rolledSymbolContribution.failures += Math.max(
      0,
      result.failures - autoFailures,
    );
    this.modifierStats.rolledSymbolContribution.advantages += Math.max(
      0,
      result.advantages - autoAdvantages,
    );
    this.modifierStats.rolledSymbolContribution.threats += Math.max(
      0,
      result.threats - autoThreats,
    );
    this.modifierStats.rolledSymbolContribution.triumphs += Math.max(
      0,
      result.triumphs - autoTriumphs,
    );
    this.modifierStats.rolledSymbolContribution.despairs += Math.max(
      0,
      result.despair - autoDespairs,
    );
    this.modifierStats.rolledSymbolContribution.lightSide += Math.max(
      0,
      result.lightSide - autoLightSide,
    );
    this.modifierStats.rolledSymbolContribution.darkSide += Math.max(
      0,
      result.darkSide - autoDarkSide,
    );
  }

  private updateHistogram(result: DiceResult): void {
    // Update net successes with direct array access
    const netSuccesses = result.successes - result.failures;
    this.histogram.netSuccesses[netSuccesses] =
      (this.histogram.netSuccesses[netSuccesses] || 0) + 1;

    // Update net advantages with direct array access
    const netAdvantages = result.advantages - result.threats;
    this.histogram.netAdvantages[netAdvantages] =
      (this.histogram.netAdvantages[netAdvantages] || 0) + 1;

    // Update other histograms with direct array access
    this.histogram.triumphs[result.triumphs] =
      (this.histogram.triumphs[result.triumphs] || 0) + 1;
    this.histogram.despairs[result.despair] =
      (this.histogram.despairs[result.despair] || 0) + 1;
    this.histogram.lightSide[result.lightSide] =
      (this.histogram.lightSide[result.lightSide] || 0) + 1;
    this.histogram.darkSide[result.darkSide] =
      (this.histogram.darkSide[result.darkSide] || 0) + 1;

    // Update running statistics
    this.runningStats.sumSuccesses += result.successes;
    this.runningStats.sumAdvantages += result.advantages;
    this.runningStats.sumTriumphs += result.triumphs;
    this.runningStats.sumFailures += result.failures;
    this.runningStats.sumThreats += result.threats;
    this.runningStats.sumDespair += result.despair;
    this.runningStats.sumLightSide += result.lightSide;
    this.runningStats.sumDarkSide += result.darkSide;
    this.runningStats.sumSquaredSuccesses +=
      result.successes * result.successes;
    this.runningStats.sumSquaredAdvantages +=
      result.advantages * result.advantages;
    this.runningStats.sumSquaredThreats += result.threats * result.threats;
    this.runningStats.sumSquaredFailures += result.failures * result.failures;
    this.runningStats.sumSquaredDespair += result.despair * result.despair;
    this.runningStats.sumSquaredLightSide +=
      result.lightSide * result.lightSide;
    this.runningStats.sumSquaredDarkSide += result.darkSide * result.darkSide;
    this.runningStats.sumSquaredTriumphs += result.triumphs * result.triumphs;

    if (netSuccesses > 0) {
      this.runningStats.successCount++;
      if (netAdvantages > 0) {
        this.runningStats.netPositiveCount++;
      }
    }
    if (result.triumphs > 0) this.runningStats.criticalSuccessCount++;
    if (result.despair > 0) this.runningStats.criticalFailureCount++;
  }

  public simulate(): MonteCarloResult {
    try {
      this.resetHistogram();
      this.resetRunningStats();
      this.resetModifierStats();
      this.statsCache.clear();
      this.results = [];

      // Apply modifiers to create the modified pool
      const modifiedPool = this.applyModifiers(this.dicePool);

      // Run simulations and update histograms in a single pass
      for (let i = 0; i < this.iterations; i++) {
        const rollResult = roll(modifiedPool);
        this.results.push(rollResult.summary);
        this.updateHistogram(rollResult.summary);
        this.trackModifierContribution(rollResult.summary);
      }

      // Calculate probabilities using running statistics
      const successProbability =
        this.runningStats.successCount / this.iterations;
      const criticalSuccessProbability =
        this.runningStats.criticalSuccessCount / this.iterations;
      const criticalFailureProbability =
        this.runningStats.criticalFailureCount / this.iterations;
      const netPositiveProbability =
        this.runningStats.netPositiveCount / this.iterations;

      // Calculate averages using running statistics
      const averages = {
        successes: this.runningStats.sumSuccesses / this.iterations,
        advantages: this.runningStats.sumAdvantages / this.iterations,
        triumphs: this.runningStats.sumTriumphs / this.iterations,
        failures: this.runningStats.sumFailures / this.iterations,
        threats: this.runningStats.sumThreats / this.iterations,
        despair: this.runningStats.sumDespair / this.iterations,
        lightSide: this.runningStats.sumLightSide / this.iterations,
        darkSide: this.runningStats.sumDarkSide / this.iterations,
      };

      // Calculate standard deviations using running statistics
      const standardDeviations = {
        successes: Math.sqrt(
          this.runningStats.sumSquaredSuccesses / this.iterations -
            averages.successes * averages.successes,
        ),
        advantages: Math.sqrt(
          this.runningStats.sumSquaredAdvantages / this.iterations -
            averages.advantages * averages.advantages,
        ),
        triumphs: Math.sqrt(
          this.runningStats.sumSquaredTriumphs / this.iterations -
            averages.triumphs * averages.triumphs,
        ),
        failures: Math.sqrt(
          this.runningStats.sumSquaredFailures / this.iterations -
            averages.failures * averages.failures,
        ),
        threats: Math.sqrt(
          this.runningStats.sumSquaredThreats / this.iterations -
            averages.threats * averages.threats,
        ),
        despair: Math.sqrt(
          this.runningStats.sumSquaredDespair / this.iterations -
            averages.despair * averages.despair,
        ),
        lightSide: Math.sqrt(
          this.runningStats.sumSquaredLightSide / this.iterations -
            averages.lightSide * averages.lightSide,
        ),
        darkSide: Math.sqrt(
          this.runningStats.sumSquaredDarkSide / this.iterations -
            averages.darkSide * averages.darkSide,
        ),
      };

      // Calculate medians using histogram data
      const medians = {
        successes: this.calculateMedianFromHistogram(
          this.histogram.netSuccesses,
        ),
        advantages: this.calculateMedianFromHistogram(
          this.histogram.netAdvantages,
        ),
        triumphs: this.calculateMedianFromHistogram(this.histogram.triumphs),
        failures: this.calculateMedianFromHistogram(this.histogram.despairs),
        threats: this.calculateMedianFromHistogram(
          this.histogram.netAdvantages,
        ),
        despair: this.calculateMedianFromHistogram(this.histogram.despairs),
        lightSide: this.calculateMedianFromHistogram(this.histogram.lightSide),
        darkSide: this.calculateMedianFromHistogram(this.histogram.darkSide),
      };

      // Calculate analysis for each histogram category
      const analysis = {
        netSuccesses: this.analyzeDistribution(
          this.histogram.netSuccesses,
          this.iterations,
        ),
        netAdvantages: this.analyzeDistribution(
          this.histogram.netAdvantages,
          this.iterations,
        ),
        triumphs: this.analyzeDistribution(
          this.histogram.triumphs,
          this.iterations,
        ),
        despairs: this.analyzeDistribution(
          this.histogram.despairs,
          this.iterations,
        ),
        lightSide: this.analyzeDistribution(
          this.histogram.lightSide,
          this.iterations,
        ),
        darkSide: this.analyzeDistribution(
          this.histogram.darkSide,
          this.iterations,
        ),
      };

      const result: MonteCarloResult = {
        averages,
        medians,
        standardDeviations,
        successProbability,
        criticalSuccessProbability,
        criticalFailureProbability,
        netPositiveProbability,
        histogram: this.histogram,
        analysis,
      };

      // Add modifier analysis if modifiers were used
      if (this.modifiers) {
        // Calculate average contributions
        const iterations = this.iterations;
        result.modifierAnalysis = {
          automaticSymbolContribution: {
            successes:
              this.modifierStats.automaticSymbolContribution.successes /
              iterations,
            failures:
              this.modifierStats.automaticSymbolContribution.failures /
              iterations,
            advantages:
              this.modifierStats.automaticSymbolContribution.advantages /
              iterations,
            threats:
              this.modifierStats.automaticSymbolContribution.threats /
              iterations,
            triumphs:
              this.modifierStats.automaticSymbolContribution.triumphs /
              iterations,
            despairs:
              this.modifierStats.automaticSymbolContribution.despairs /
              iterations,
            lightSide:
              this.modifierStats.automaticSymbolContribution.lightSide /
              iterations,
            darkSide:
              this.modifierStats.automaticSymbolContribution.darkSide /
              iterations,
          },
          rolledSymbolContribution: {
            successes:
              this.modifierStats.rolledSymbolContribution.successes /
              iterations,
            failures:
              this.modifierStats.rolledSymbolContribution.failures / iterations,
            advantages:
              this.modifierStats.rolledSymbolContribution.advantages /
              iterations,
            threats:
              this.modifierStats.rolledSymbolContribution.threats / iterations,
            triumphs:
              this.modifierStats.rolledSymbolContribution.triumphs / iterations,
            despairs:
              this.modifierStats.rolledSymbolContribution.despairs / iterations,
            lightSide:
              this.modifierStats.rolledSymbolContribution.lightSide /
              iterations,
            darkSide:
              this.modifierStats.rolledSymbolContribution.darkSide / iterations,
          },
          upgradeImpact: this.modifierStats.upgradeImpact,
        };
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new MonteCarloError(`Simulation failed: ${error.message}`);
      }
      throw new MonteCarloError("Simulation failed with unknown error");
    }
  }

  private resetHistogram(): void {
    this.histogram = {
      netSuccesses: {},
      netAdvantages: {},
      triumphs: {},
      despairs: {},
      lightSide: {},
      darkSide: {},
    };
  }

  private calculateMedianFromHistogram(histogram: {
    [key: number]: number;
  }): number {
    const entries = Object.entries(histogram)
      .map(([value, count]) => ({ value: parseInt(value), count }))
      .sort((a, b) => a.value - b.value);

    if (entries.length === 0) {
      return 0;
    }

    let runningCount = 0;
    const targetCount = this.iterations / 2;

    for (const { value, count } of entries) {
      runningCount += count;
      if (runningCount >= targetCount) {
        return value;
      }
    }

    return entries[entries.length - 1].value;
  }

  private findModes(histogram: { [key: number]: number }): number[] {
    const entries = Object.entries(histogram);
    if (entries.length === 0) return [];

    const maxCount = Math.max(...entries.map(([, count]) => count));
    return entries
      .filter(([, count]) => count === maxCount)
      .map(([value]) => parseInt(value));
  }

  private calculatePercentiles(
    histogram: { [key: number]: number },
    totalCount: number,
  ): { [key: number]: number } {
    const sortedEntries = Object.entries(histogram)
      .map(([value, count]) => ({ value: parseInt(value), count }))
      .sort((a, b) => a.value - b.value);

    if (sortedEntries.length === 0) {
      return {};
    }

    const percentiles: { [key: number]: number } = {};
    let runningCount = 0;

    // Calculate percentiles at specific points
    const targetPercentiles = [25, 50, 75, 90];
    let currentTargetIndex = 0;

    // Find the value for each percentile
    for (const { value, count } of sortedEntries) {
      runningCount += count;
      const currentPercentile = (runningCount / totalCount) * 100;

      // Check if we've passed any target percentiles
      while (
        currentTargetIndex < targetPercentiles.length &&
        currentPercentile >= targetPercentiles[currentTargetIndex]
      ) {
        percentiles[targetPercentiles[currentTargetIndex]] = value;
        currentTargetIndex++;
      }
    }

    // If we haven't reached all target percentiles, use the maximum value
    const maxValue = sortedEntries[sortedEntries.length - 1].value;
    while (currentTargetIndex < targetPercentiles.length) {
      percentiles[targetPercentiles[currentTargetIndex]] = maxValue;
      currentTargetIndex++;
    }

    return percentiles;
  }
}
