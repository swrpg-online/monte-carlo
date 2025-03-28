import { DicePool, roll } from "@swrpg-online/dice";
import { DiceResult } from "@swrpg-online/dice/dist/types";

export { DicePool };

export class MonteCarloError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonteCarloError";
  }
}

export interface MonteCarloResult {
  averages: DiceResult;
  medians: DiceResult;
  standardDeviations: DiceResult;
  successProbability: number;
  criticalSuccessProbability: number;
  criticalFailureProbability: number;
  netPositiveProbability: number;
}

export class MonteCarlo {
  private readonly dicePool: DicePool;
  private readonly iterations: number;
  private results: DiceResult[] = [];
  private static readonly MIN_ITERATIONS = 100;
  private static readonly MAX_ITERATIONS = 1000000;

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

  public simulate(): MonteCarloResult {
    try {
      this.results = [];

      // Run simulations
      for (let i = 0; i < this.iterations; i++) {
        const rollResult = roll(this.dicePool);
        this.results.push(rollResult.summary);
      }

      return {
        averages: this.calculateAverages(),
        medians: this.calculateMedians(),
        standardDeviations: this.calculateStandardDeviations(),
        successProbability: this.calculateSuccessProbability(),
        criticalSuccessProbability: this.calculateCriticalSuccessProbability(),
        criticalFailureProbability: this.calculateCriticalFailureProbability(),
        netPositiveProbability: this.calculateNetPositiveProbability(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new MonteCarloError(`Simulation failed: ${error.message}`);
      }
      throw new MonteCarloError("Simulation failed with unknown error");
    }
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

  private calculateSuccessProbability(): number {
    return (
      this.results.filter((r) => r.successes - r.failures > 0).length /
      this.iterations
    );
  }

  private calculateCriticalSuccessProbability(): number {
    return this.results.filter((r) => r.triumphs > 0).length / this.iterations;
  }

  private calculateCriticalFailureProbability(): number {
    return this.results.filter((r) => r.despair > 0).length / this.iterations;
  }

  private calculateNetPositiveProbability(): number {
    return (
      this.results.filter(
        (r) => r.successes - r.failures > 0 && r.advantages - r.threats > 0,
      ).length / this.iterations
    );
  }

  private average(selector: (roll: DiceResult) => number): number {
    return (
      this.results.reduce((sum, roll) => sum + selector(roll), 0) /
      this.iterations
    );
  }

  private median(selector: (roll: DiceResult) => number): number {
    const values = this.results.map(selector).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2
      ? values[mid]
      : (values[mid - 1] + values[mid]) / 2;
  }

  private standardDeviation(selector: (roll: DiceResult) => number): number {
    const avg = this.average(selector);
    const squareDiffs = this.results.map((roll) => {
      const diff = selector(roll) - avg;
      return diff * diff;
    });
    return Math.sqrt(
      squareDiffs.reduce((sum, diff) => sum + diff, 0) / this.iterations,
    );
  }
}
