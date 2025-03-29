import { DicePool, roll } from "@swrpg-online/dice";
import { DiceResult } from "@swrpg-online/dice/dist/types";

export { DicePool };

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
}

export class MonteCarlo {
  private readonly dicePool: DicePool;
  private readonly iterations: number;
  private results: DiceResult[] = [];
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
  // Cache for statistical calculations
  private statsCache: Map<string, number> = new Map();

  constructor(dicePool: DicePool, iterations: number = 10000) {
    this.validateDicePool(dicePool);
    this.validateIterations(iterations);
    this.dicePool = dicePool;
    this.iterations = iterations;
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

  private average(selector: (roll: DiceResult) => number): number {
    const cacheKey = selector.toString();
    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey)!;
    }

    const avg =
      this.results.reduce((sum, roll) => sum + selector(roll), 0) /
      this.iterations;
    this.statsCache.set(cacheKey, avg);
    return avg;
  }

  private standardDeviation(selector: (roll: DiceResult) => number): number {
    const cacheKey = `std_${selector.toString()}`;
    if (this.statsCache.has(cacheKey)) {
      return this.statsCache.get(cacheKey)!;
    }

    const avg = this.average(selector);
    const squareSum = this.results.reduce((sum, roll) => {
      const diff = selector(roll) - avg;
      return sum + diff * diff;
    }, 0);

    const stdDev = Math.sqrt(squareSum / this.iterations);
    this.statsCache.set(cacheKey, stdDev);
    return stdDev;
  }

  public simulate(): MonteCarloResult {
    try {
      this.results = [];
      this.resetHistogram();
      this.statsCache.clear();

      // Run simulations and update histograms in a single pass
      let successCount = 0;
      let criticalSuccessCount = 0;
      let criticalFailureCount = 0;
      let netPositiveCount = 0;

      for (let i = 0; i < this.iterations; i++) {
        const rollResult = roll(this.dicePool);
        this.results.push(rollResult.summary);
        this.updateHistogram(rollResult.summary);

        // Update counts in the same pass
        if (rollResult.summary.successes - rollResult.summary.failures > 0) {
          successCount++;
          if (rollResult.summary.advantages - rollResult.summary.threats > 0) {
            netPositiveCount++;
          }
        }
        if (rollResult.summary.triumphs > 0) criticalSuccessCount++;
        if (rollResult.summary.despair > 0) criticalFailureCount++;
      }

      // Calculate probabilities without additional array iterations
      const successProbability = successCount / this.iterations;
      const criticalSuccessProbability = criticalSuccessCount / this.iterations;
      const criticalFailureProbability = criticalFailureCount / this.iterations;
      const netPositiveProbability = netPositiveCount / this.iterations;

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

      return {
        averages: this.calculateAverages(),
        medians: this.calculateMedians(),
        standardDeviations: this.calculateStandardDeviations(),
        successProbability,
        criticalSuccessProbability,
        criticalFailureProbability,
        netPositiveProbability,
        histogram: this.histogram,
        analysis,
      };
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

  private updateHistogram(result: DiceResult): void {
    // Update net successes
    const netSuccesses = result.successes - result.failures;
    this.histogram.netSuccesses[netSuccesses] =
      (this.histogram.netSuccesses[netSuccesses] || 0) + 1;

    // Update net advantages
    const netAdvantages = result.advantages - result.threats;
    this.histogram.netAdvantages[netAdvantages] =
      (this.histogram.netAdvantages[netAdvantages] || 0) + 1;

    // Update triumphs
    this.histogram.triumphs[result.triumphs] =
      (this.histogram.triumphs[result.triumphs] || 0) + 1;

    // Update despairs
    this.histogram.despairs[result.despair] =
      (this.histogram.despairs[result.despair] || 0) + 1;

    // Update light side
    this.histogram.lightSide[result.lightSide] =
      (this.histogram.lightSide[result.lightSide] || 0) + 1;

    // Update dark side
    this.histogram.darkSide[result.darkSide] =
      (this.histogram.darkSide[result.darkSide] || 0) + 1;
  }

  private calculateAverages(): DiceResult {
    return {
      successes: this.average((r) => r.successes),
      advantages: this.average((r) => r.advantages),
      triumphs: this.average((r) => r.triumphs),
      failures: this.average((r) => r.failures),
      threats: this.average((r) => r.threats),
      despair: this.average((r) => r.despair),
      lightSide: this.average((r) => r.lightSide),
      darkSide: this.average((r) => r.darkSide),
    };
  }

  private calculateMedians(): DiceResult {
    return {
      successes: this.median((r) => r.successes),
      advantages: this.median((r) => r.advantages),
      triumphs: this.median((r) => r.triumphs),
      failures: this.median((r) => r.failures),
      threats: this.median((r) => r.threats),
      despair: this.median((r) => r.despair),
      lightSide: this.median((r) => r.lightSide),
      darkSide: this.median((r) => r.darkSide),
    };
  }

  private calculateStandardDeviations(): DiceResult {
    return {
      successes: this.standardDeviation((r) => r.successes),
      advantages: this.standardDeviation((r) => r.advantages),
      triumphs: this.standardDeviation((r) => r.triumphs),
      failures: this.standardDeviation((r) => r.failures),
      threats: this.standardDeviation((r) => r.threats),
      despair: this.standardDeviation((r) => r.despair),
      lightSide: this.standardDeviation((r) => r.lightSide),
      darkSide: this.standardDeviation((r) => r.darkSide),
    };
  }

  private calculatePercentiles(
    histogram: { [key: number]: number },
    totalCount: number,
  ): { [key: number]: number } {
    const sortedEntries = Object.entries(histogram)
      .map(([value, count]) => ({ value: parseInt(value), count }))
      .sort((a, b) => a.value - b.value);

    const percentiles: { [key: number]: number } = {};
    let runningCount = 0;

    // Calculate percentiles at specific points
    const targetPercentiles = [25, 50, 75, 90];
    let currentTargetIndex = 0;

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
    while (currentTargetIndex < targetPercentiles.length) {
      percentiles[targetPercentiles[currentTargetIndex]] =
        sortedEntries[sortedEntries.length - 1].value;
      currentTargetIndex++;
    }

    return percentiles;
  }

  private findModes(histogram: { [key: number]: number }): number[] {
    const entries = Object.entries(histogram);
    if (entries.length === 0) return [];

    const maxCount = Math.max(...entries.map(([, count]) => count));
    return entries
      .filter(([, count]) => count === maxCount)
      .map(([value]) => parseInt(value));
  }

  private median(selector: (roll: DiceResult) => number): number {
    const values = this.results.map(selector).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2
      ? values[mid]
      : (values[mid - 1] + values[mid]) / 2;
  }
}
