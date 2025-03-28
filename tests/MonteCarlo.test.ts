import { DicePool } from "@swrpg-online/dice";
import { MonteCarlo, MonteCarloError } from "../src/MonteCarlo";

describe("MonteCarlo", () => {
  let dicePool: DicePool;

  beforeEach(() => {
    // Create a simple dice pool with known probabilities
    dicePool = {
      abilityDice: 2, // Green dice
      proficiencyDice: 1, // Yellow die
    };
  });

  describe("constructor validation", () => {
    it("should throw on invalid dice pool", () => {
      expect(() => new MonteCarlo(null as any)).toThrow(MonteCarloError);
      expect(() => new MonteCarlo({} as DicePool)).toThrow(MonteCarloError);
      expect(() => new MonteCarlo({ abilityDice: -1 })).toThrow(
        MonteCarloError,
      );
      expect(() => new MonteCarlo({ abilityDice: 1.5 })).toThrow(
        MonteCarloError,
      );
    });

    it("should throw on invalid iterations", () => {
      expect(() => new MonteCarlo(dicePool, 50)).toThrow(MonteCarloError);
      expect(() => new MonteCarlo(dicePool, 2000000)).toThrow(MonteCarloError);
      expect(() => new MonteCarlo(dicePool, -1)).toThrow(MonteCarloError);
      expect(() => new MonteCarlo(dicePool, 1.5)).toThrow(MonteCarloError);
    });

    it("should accept valid dice pools", () => {
      expect(() => new MonteCarlo({ abilityDice: 1 })).not.toThrow();
      expect(() => new MonteCarlo({ proficiencyDice: 1 })).not.toThrow();
      expect(() => new MonteCarlo({ boostDice: 1 })).not.toThrow();
      expect(() => new MonteCarlo({ setBackDice: 1 })).not.toThrow();
      expect(() => new MonteCarlo({ difficultyDice: 1 })).not.toThrow();
      expect(() => new MonteCarlo({ challengeDice: 1 })).not.toThrow();
      expect(() => new MonteCarlo({ forceDice: 1 })).not.toThrow();
    });
  });

  describe("simulate", () => {
    it("should run the specified number of iterations", () => {
      const iterations = 1000;
      const monteCarlo = new MonteCarlo(dicePool, iterations);
      const result = monteCarlo.simulate();

      // All probabilities should be between 0 and 1
      expect(result.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.successProbability).toBeLessThanOrEqual(1);
      expect(result.criticalSuccessProbability).toBeGreaterThanOrEqual(0);
      expect(result.criticalSuccessProbability).toBeLessThanOrEqual(1);
    });

    it("should calculate averages correctly", () => {
      const monteCarlo = new MonteCarlo(dicePool, 10000);
      const result = monteCarlo.simulate();

      // With 2 Ability dice and 1 Proficiency die, we expect positive averages
      expect(result.averages.successes).toBeGreaterThan(0);
      expect(result.averages.advantages).toBeGreaterThan(0);
      expect(result.averages.triumphs).toBeGreaterThanOrEqual(0);

      // These should be very close to 0 for this pool
      expect(result.averages.failures).toBe(0);
      expect(result.averages.threats).toBe(0);
      expect(result.averages.despair).toBe(0);
      expect(result.averages.lightSide).toBe(0);
      expect(result.averages.darkSide).toBe(0);
    });

    it("should calculate standard deviations correctly", () => {
      const monteCarlo = new MonteCarlo(dicePool, 10000);
      const result = monteCarlo.simulate();

      // Standard deviations should be non-negative
      expect(result.standardDeviations.successes).toBeGreaterThan(0);
      expect(result.standardDeviations.advantages).toBeGreaterThan(0);
      expect(result.standardDeviations.triumphs).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.failures).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.threats).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.despair).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.lightSide).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.darkSide).toBeGreaterThanOrEqual(0);
    });

    it("should calculate medians correctly", () => {
      const monteCarlo = new MonteCarlo(dicePool, 10000);
      const result = monteCarlo.simulate();

      // Medians should be integers
      expect(Number.isInteger(result.medians.successes)).toBe(true);
      expect(Number.isInteger(result.medians.advantages)).toBe(true);
      expect(Number.isInteger(result.medians.triumphs)).toBe(true);
      expect(Number.isInteger(result.medians.failures)).toBe(true);
      expect(Number.isInteger(result.medians.threats)).toBe(true);
      expect(Number.isInteger(result.medians.despair)).toBe(true);
      expect(Number.isInteger(result.medians.lightSide)).toBe(true);
      expect(Number.isInteger(result.medians.darkSide)).toBe(true);
    });

    it("should use default iterations when not specified", () => {
      const monteCarlo = new MonteCarlo(dicePool);
      const result = monteCarlo.simulate();

      // Just verify we get valid results
      expect(result.averages.successes).toBeDefined();
      expect(result.medians.successes).toBeDefined();
      expect(result.standardDeviations.successes).toBeDefined();
    });

    it("should calculate net positive probability correctly", () => {
      const monteCarlo = new MonteCarlo(dicePool, 10000);
      const result = monteCarlo.simulate();

      // With this positive dice pool, net positive should be common
      expect(result.netPositiveProbability).toBeGreaterThan(0.5);
    });

    it("should handle difficult dice pools", () => {
      const difficultPool: DicePool = {
        difficultyDice: 2,
        challengeDice: 1,
      };
      const monteCarlo = new MonteCarlo(difficultPool, 10000);
      const result = monteCarlo.simulate();

      // With a difficult pool, success should be rare
      expect(result.successProbability).toBeLessThan(0.5);
      expect(result.netPositiveProbability).toBeLessThan(0.5);
    });

    it("should handle force dice", () => {
      const forcePool: DicePool = {
        forceDice: 1,
      };
      const monteCarlo = new MonteCarlo(forcePool, 10000);
      const result = monteCarlo.simulate();

      // Force dice don't affect normal success/failure
      expect(result.averages.successes).toBe(0);
      expect(result.averages.failures).toBe(0);

      // Force dice should show light/dark side results
      expect(result.averages.lightSide).toBeGreaterThan(0);
      expect(result.averages.darkSide).toBeGreaterThan(0);
    });
  });
});
