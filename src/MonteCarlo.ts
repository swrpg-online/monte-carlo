import { DicePool, roll } from "@swrpg-online/dice";

export { DicePool };

export class MonteCarloError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MonteCarloError";
  }
}

export interface DiceResult {
  success: number;
  advantage: number;
  triumph: number;
  failure: number;
  threat: number;
  despair: number;
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
        this.results.push({
          success: rollResult.summary.successes,
          advantage: rollResult.summary.advantages,
          triumph: rollResult.summary.triumphs,
          failure: rollResult.summary.failures,
          threat: rollResult.summary.threats,
          despair: rollResult.summary.despair,
        });
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
      success: this.average((r) => r.success),
      advantage: this.average((r) => r.advantage),
      triumph: this.average((r) => r.triumph),
      failure: this.average((r) => r.failure),
      threat: this.average((r) => r.threat),
      despair: this.average((r) => r.despair),
    };
  }

  private calculateMedians(): DiceResult {
    return {
      success: this.median((r) => r.success),
      advantage: this.median((r) => r.advantage),
      triumph: this.median((r) => r.triumph),
      failure: this.median((r) => r.failure),
      threat: this.median((r) => r.threat),
      despair: this.median((r) => r.despair),
    };
  }

  private calculateStandardDeviations(): DiceResult {
    return {
      success: this.standardDeviation((r) => r.success),
      advantage: this.standardDeviation((r) => r.advantage),
      triumph: this.standardDeviation((r) => r.triumph),
      failure: this.standardDeviation((r) => r.failure),
      threat: this.standardDeviation((r) => r.threat),
      despair: this.standardDeviation((r) => r.despair),
    };
  }

  private calculateSuccessProbability(): number {
    return (
      this.results.filter((r) => r.success - r.failure > 0).length /
      this.iterations
    );
  }

  private calculateCriticalSuccessProbability(): number {
    return this.results.filter((r) => r.triumph > 0).length / this.iterations;
  }

  private calculateCriticalFailureProbability(): number {
    return this.results.filter((r) => r.despair > 0).length / this.iterations;
  }

  private calculateNetPositiveProbability(): number {
    return (
      this.results.filter(
        (r) => r.success - r.failure > 0 && r.advantage - r.threat > 0,
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
