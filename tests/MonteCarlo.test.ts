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

    it("should handle boost and setback dice", () => {
      const boostSetbackPool: DicePool = {
        boostDice: 2,
        setBackDice: 2,
      };
      const monteCarlo = new MonteCarlo(boostSetbackPool, 10000);
      const result = monteCarlo.simulate();

      // Boost and setback dice affect both success/failure and advantages/threats
      expect(result.averages.successes).toBeGreaterThan(0);
      expect(result.averages.failures).toBeGreaterThan(0);
      expect(result.averages.advantages).toBeGreaterThan(0);
      expect(result.averages.threats).toBeGreaterThan(0);

      // Success probability should be within reasonable bounds
      expect(result.successProbability).toBeGreaterThan(0.2);
      expect(result.successProbability).toBeLessThan(0.4);
    });

    it("should include histogram data in results", () => {
      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      expect(result.histogram).toBeDefined();
      expect(result.histogram.netSuccesses).toBeDefined();
      expect(result.histogram.netAdvantages).toBeDefined();
      expect(result.histogram.triumphs).toBeDefined();
      expect(result.histogram.despairs).toBeDefined();
      expect(result.histogram.lightSide).toBeDefined();
      expect(result.histogram.darkSide).toBeDefined();
    });

    it("should track net successes correctly in histogram", () => {
      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      const netSuccesses = result.histogram.netSuccesses;
      const totalCount = Object.values(netSuccesses).reduce((a, b) => a + b, 0);
      expect(totalCount).toBe(1000);

      // Verify histogram matches success probability
      const positiveNetSuccesses = Object.entries(netSuccesses)
        .filter(([value]) => parseInt(value) > 0)
        .reduce((sum, [, count]) => sum + count, 0);
      expect(positiveNetSuccesses / 1000).toBeCloseTo(
        result.successProbability,
        2,
      );
    });

    it("should track net advantages correctly in histogram", () => {
      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      const netAdvantages = result.histogram.netAdvantages;
      const totalCount = Object.values(netAdvantages).reduce(
        (a, b) => a + b,
        0,
      );
      expect(totalCount).toBe(1000);
    });

    it("should track triumphs and despairs correctly in histogram", () => {
      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      // Verify triumphs histogram matches critical success probability
      const triumphsCount = Object.entries(result.histogram.triumphs)
        .filter(([value]) => parseInt(value) > 0)
        .reduce((sum, [, count]) => sum + count, 0);
      expect(triumphsCount / 1000).toBeCloseTo(
        result.criticalSuccessProbability,
        2,
      );

      // Verify despairs histogram matches critical failure probability
      const despairsCount = Object.entries(result.histogram.despairs)
        .filter(([value]) => parseInt(value) > 0)
        .reduce((sum, [, count]) => sum + count, 0);
      expect(despairsCount / 1000).toBeCloseTo(
        result.criticalFailureProbability,
        2,
      );
    });

    it("should maintain sparse storage in histogram", () => {
      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      // Check that we don't store zero counts
      Object.values(result.histogram).forEach((category) => {
        Object.entries(category).forEach(([value, count]) => {
          expect(count).toBeGreaterThan(0);
        });
      });
    });

    it("should handle force dice in histogram", () => {
      const forcePool: DicePool = {
        forceDice: 2,
      };
      const monteCarlo = new MonteCarlo(forcePool, 1000);
      const result = monteCarlo.simulate();

      // Force dice should show light/dark side results
      const lightSideCount = Object.values(result.histogram.lightSide).reduce(
        (a, b) => a + b,
        0,
      );
      const darkSideCount = Object.values(result.histogram.darkSide).reduce(
        (a, b) => a + b,
        0,
      );
      expect(lightSideCount).toBe(1000);
      expect(darkSideCount).toBe(1000);
    });

    it("should handle mixed dice pools in histogram", () => {
      const mixedPool: DicePool = {
        abilityDice: 2,
        difficultyDice: 1,
        boostDice: 1,
        setBackDice: 1,
      };
      const monteCarlo = new MonteCarlo(mixedPool, 1000);
      const result = monteCarlo.simulate();

      // Should track both positive and negative net values
      const hasNegativeSuccesses = Object.keys(
        result.histogram.netSuccesses,
      ).some((value) => parseInt(value) < 0);
      const hasNegativeAdvantages = Object.keys(
        result.histogram.netAdvantages,
      ).some((value) => parseInt(value) < 0);
      expect(hasNegativeSuccesses).toBe(true);
      expect(hasNegativeAdvantages).toBe(true);
    });
  });

  describe("distribution analysis", () => {
    it("should calculate skewness correctly", () => {
      const pool: DicePool = {
        abilityDice: 2,
        difficultyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // Net successes should be slightly right-skewed due to ability dice
      expect(result.analysis.netSuccesses.skewness).toBeGreaterThan(0);
      // Net advantages should be symmetric
      expect(Math.abs(result.analysis.netAdvantages.skewness)).toBeLessThan(
        0.5,
      );
    });

    it("should calculate kurtosis correctly", () => {
      const pool: DicePool = {
        abilityDice: 2,
        difficultyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // Kurtosis should be finite and within reasonable bounds
      expect(Number.isFinite(result.analysis.netSuccesses.kurtosis)).toBe(true);
      expect(Number.isFinite(result.analysis.netAdvantages.kurtosis)).toBe(
        true,
      );
      expect(Math.abs(result.analysis.netSuccesses.kurtosis)).toBeLessThan(10);
      expect(Math.abs(result.analysis.netAdvantages.kurtosis)).toBeLessThan(10);
    });

    it("should detect outliers correctly", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // With multiple positive dice, should have some high-value outliers
      expect(result.analysis.netSuccesses.outliers.length).toBeGreaterThan(0);
      expect(
        Math.max(...result.analysis.netSuccesses.outliers),
      ).toBeGreaterThan(0);
    });

    it("should find modes correctly", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // Should have at least one mode
      expect(result.analysis.netSuccesses.modes.length).toBeGreaterThan(0);
      // Mode should be a valid value
      expect(result.analysis.netSuccesses.modes[0]).toBeDefined();
    });

    it("should calculate percentiles correctly", () => {
      const pool: DicePool = {
        abilityDice: 2,
        difficultyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // Should have key percentiles
      expect(result.analysis.netSuccesses.percentiles[25]).toBeDefined();
      expect(result.analysis.netSuccesses.percentiles[50]).toBeDefined();
      expect(result.analysis.netSuccesses.percentiles[75]).toBeDefined();
      expect(result.analysis.netSuccesses.percentiles[90]).toBeDefined();

      // Percentiles should be in ascending order
      const percentiles = Object.entries(
        result.analysis.netSuccesses.percentiles,
      )
        .map(([p, v]) => ({ percentile: parseInt(p), value: v }))
        .sort((a, b) => a.percentile - b.percentile);

      for (let i = 1; i < percentiles.length; i++) {
        expect(percentiles[i].value).toBeGreaterThanOrEqual(
          percentiles[i - 1].value,
        );
      }
    });

    it("should handle zero standard deviation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 100);
      const result = monteCarlo.simulate();

      // Should handle zero standard deviation gracefully
      expect(() => result.analysis.netSuccesses.skewness).not.toThrow();
      expect(() => result.analysis.netSuccesses.kurtosis).not.toThrow();
      expect(() => result.analysis.netSuccesses.outliers).not.toThrow();
    });

    it("should handle single value distributions", () => {
      const pool: DicePool = {
        abilityDice: 1,
        difficultyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 100);
      const result = monteCarlo.simulate();

      // Should handle single value distributions gracefully
      expect(() => result.analysis.netSuccesses.skewness).not.toThrow();
      expect(() => result.analysis.netSuccesses.kurtosis).not.toThrow();
      expect(() => result.analysis.netSuccesses.outliers).not.toThrow();
    });

    it("should handle bimodal distributions", () => {
      const pool: DicePool = {
        abilityDice: 2,
        difficultyDice: 2,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // Should be able to detect multiple modes
      expect(result.analysis.netSuccesses.modes.length).toBeGreaterThanOrEqual(
        1,
      );
      // With equal positive and negative dice, might have multiple modes
      expect(result.analysis.netSuccesses.modes.length).toBeLessThanOrEqual(3);
    });

    it("should maintain analysis consistency", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // Analysis should be consistent with histogram data
      const netSuccesses = result.histogram.netSuccesses;
      const totalCount = Object.values(netSuccesses).reduce((a, b) => a + b, 0);
      expect(totalCount).toBe(10000);

      // Mode should match highest count in histogram
      const maxCount = Math.max(...Object.values(netSuccesses));
      const histogramModes = Object.entries(netSuccesses)
        .filter(([, count]) => count === maxCount)
        .map(([value]) => parseInt(value));
      expect(result.analysis.netSuccesses.modes).toEqual(histogramModes);
    });
  });

  describe("edge cases", () => {
    it("should handle dice pool with all zeros", () => {
      const emptyPool: DicePool = {
        abilityDice: 0,
        proficiencyDice: 0,
        boostDice: 0,
        setBackDice: 0,
        difficultyDice: 0,
        challengeDice: 0,
        forceDice: 0,
      };
      expect(() => new MonteCarlo(emptyPool)).toThrow(MonteCarloError);
    });

    it("should handle dice pool with all undefined values", () => {
      const undefinedPool = {
        abilityDice: undefined,
        proficiencyDice: undefined,
        boostDice: undefined,
        setBackDice: undefined,
        difficultyDice: undefined,
        challengeDice: undefined,
        forceDice: undefined,
      } as DicePool;
      expect(() => new MonteCarlo(undefinedPool)).toThrow(MonteCarloError);
    });

    it("should handle large numbers of dice", () => {
      const largePool: DicePool = {
        abilityDice: 100,
        proficiencyDice: 50,
      };
      const monteCarlo = new MonteCarlo(largePool, 1000);
      const result = monteCarlo.simulate();

      // With this many positive dice, success should be extremely likely
      expect(result.successProbability).toBeGreaterThan(0.99);
      expect(result.averages.successes).toBeGreaterThan(50);
    });

    it("should handle mixed positive and negative dice", () => {
      const mixedPool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
        difficultyDice: 2,
        challengeDice: 1,
      };
      const monteCarlo = new MonteCarlo(mixedPool, 10000);
      const result = monteCarlo.simulate();

      // With equal positive and negative dice, success should be around 50%
      expect(result.successProbability).toBeGreaterThan(0.4);
      expect(result.successProbability).toBeLessThan(0.6);
    });

    it("should handle minimum iterations", () => {
      const minIterationsPool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(minIterationsPool, 100);
      const result = monteCarlo.simulate();

      // Should still produce valid results even with minimum iterations
      expect(result.averages.successes).toBeDefined();
      expect(result.medians.successes).toBeDefined();
      expect(result.standardDeviations.successes).toBeDefined();
    });

    it("should handle force dice with other dice types", () => {
      const forceMixedPool: DicePool = {
        forceDice: 2,
        abilityDice: 2,
        difficultyDice: 1,
      };
      const monteCarlo = new MonteCarlo(forceMixedPool, 10000);
      const result = monteCarlo.simulate();

      // Force dice should show light/dark side while still allowing normal success/failure
      expect(result.averages.lightSide).toBeGreaterThan(0);
      expect(result.averages.darkSide).toBeGreaterThan(0);
      expect(result.averages.successes).toBeGreaterThan(0);
      expect(result.averages.failures).toBeGreaterThan(0);
    });

    it("should handle standard deviation edge cases", () => {
      const deterministicPool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(deterministicPool, 1000);
      const result = monteCarlo.simulate();

      // Standard deviations should be non-negative even with deterministic results
      expect(result.standardDeviations.successes).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.advantages).toBeGreaterThanOrEqual(0);
    });

    it("should handle median calculations with even and odd results", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1001); // Odd number of iterations
      const result = monteCarlo.simulate();

      // Medians should be integers for discrete dice results
      expect(Number.isInteger(result.medians.successes)).toBe(true);
      expect(Number.isInteger(result.medians.advantages)).toBe(true);
    });

    it("should handle combinations producing specific patterns", () => {
      const triumphPool: DicePool = {
        proficiencyDice: 2, // High chance of triumphs
        difficultyDice: 1,
      };
      const monteCarlo = new MonteCarlo(triumphPool, 10000);
      const result = monteCarlo.simulate();

      // With multiple proficiency dice, should see some triumphs
      expect(result.criticalSuccessProbability).toBeGreaterThan(0);
      expect(result.averages.triumphs).toBeGreaterThan(0);
    });

    it("should handle probability edge cases", () => {
      // Test for guaranteed success
      const guaranteedSuccessPool: DicePool = {
        abilityDice: 10,
        difficultyDice: 0,
      };
      const successMonteCarlo = new MonteCarlo(guaranteedSuccessPool, 10000);
      const successResult = successMonteCarlo.simulate();
      expect(successResult.successProbability).toBeGreaterThan(0.99);

      // Test for guaranteed failure
      const guaranteedFailurePool: DicePool = {
        abilityDice: 0,
        difficultyDice: 10,
      };
      const failureMonteCarlo = new MonteCarlo(guaranteedFailurePool, 10000);
      const failureResult = failureMonteCarlo.simulate();
      expect(failureResult.successProbability).toBeLessThan(0.01);
    });

    it("should handle maximum iterations", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000000); // MAX_ITERATIONS
      const result = monteCarlo.simulate();

      // Should complete without errors
      expect(result.averages.successes).toBeDefined();
      expect(result.medians.successes).toBeDefined();
      expect(result.standardDeviations.successes).toBeDefined();
    });

    it("should handle NaN and Infinity values in calculations", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // All numeric values should be finite
      expect(Number.isFinite(result.averages.successes)).toBe(true);
      expect(Number.isFinite(result.averages.advantages)).toBe(true);
      expect(Number.isFinite(result.standardDeviations.successes)).toBe(true);
      expect(Number.isFinite(result.successProbability)).toBe(true);
    });

    it("should handle roll operation errors gracefully", () => {
      // Create a pool that might cause issues with the roll operation
      const problematicPool: DicePool = {
        abilityDice: 1,
        proficiencyDice: 1,
        difficultyDice: 1,
        challengeDice: 1,
        boostDice: 1,
        setBackDice: 1,
        forceDice: 1,
      };
      const monteCarlo = new MonteCarlo(problematicPool, 1000);

      // Should not throw during simulation
      expect(() => monteCarlo.simulate()).not.toThrow();
    });

    it("should handle memory usage with large dice pools", () => {
      const largePool: DicePool = {
        abilityDice: 50,
        proficiencyDice: 25,
        difficultyDice: 25,
        challengeDice: 25,
      };
      const monteCarlo = new MonteCarlo(largePool, 10000);

      // Should complete without memory issues
      expect(() => monteCarlo.simulate()).not.toThrow();
    });

    it("should handle extreme value combinations", () => {
      const extremePool: DicePool = {
        abilityDice: 1,
        difficultyDice: 1,
        boostDice: 10,
        setBackDice: 10,
      };
      const monteCarlo = new MonteCarlo(extremePool, 10000);
      const result = monteCarlo.simulate();

      // Should handle extreme advantage/threat values
      expect(result.averages.advantages).toBeGreaterThan(0);
      expect(result.averages.threats).toBeGreaterThan(0);
      expect(result.standardDeviations.advantages).toBeGreaterThan(0);
      expect(result.standardDeviations.threats).toBeGreaterThan(0);
    });

    it("should handle deterministic dice pools", () => {
      const deterministicPool: DicePool = {
        abilityDice: 1,
        difficultyDice: 0,
      };
      const monteCarlo = new MonteCarlo(deterministicPool, 1000);
      const result = monteCarlo.simulate();

      // With deterministic pool, standard deviation should be small
      expect(result.standardDeviations.successes).toBeLessThan(1);
      expect(result.standardDeviations.advantages).toBeLessThan(1);
    });

    it("should handle simulation errors properly", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);

      // Mock the roll function to throw an error
      const mockRoll = jest.spyOn(require("@swrpg-online/dice"), "roll");
      mockRoll.mockImplementation(() => {
        throw new Error("Mock roll error");
      });

      // Should throw MonteCarloError with the error message
      expect(() => monteCarlo.simulate()).toThrow(MonteCarloError);
      expect(() => monteCarlo.simulate()).toThrow(
        "Simulation failed: Mock roll error",
      );

      // Clean up
      mockRoll.mockRestore();
    });

    it("should handle unknown simulation errors", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);

      // Mock the roll function to throw a non-Error object
      const mockRoll = jest.spyOn(require("@swrpg-online/dice"), "roll");
      mockRoll.mockImplementation(() => {
        throw "Unknown error"; // This is not an Error object
      });

      // Should throw MonteCarloError with generic message
      expect(() => monteCarlo.simulate()).toThrow(MonteCarloError);
      expect(() => monteCarlo.simulate()).toThrow(
        "Simulation failed with unknown error",
      );

      // Clean up
      mockRoll.mockRestore();
    });

    it("should handle empty histogram for median calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = {};

      // @ts-ignore - Accessing private method for testing
      const median = monteCarlo["calculateMedianFromHistogram"](histogram);
      expect(median).toBe(0);
    });

    it("should handle cache hits in statistical calculations", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Call averages and standard deviations multiple times to test caching
      const firstAvg = result.averages.successes;
      const secondAvg = result.averages.successes;
      expect(firstAvg).toBe(secondAvg);

      const firstStdDev = result.standardDeviations.successes;
      const secondStdDev = result.standardDeviations.successes;
      expect(firstStdDev).toBe(secondStdDev);
    });

    it("should handle unknown selectors in statistical calculations", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // @ts-ignore - Testing invalid selector
      expect(() => monteCarlo["average"]({ name: "unknown" })).toThrow(
        MonteCarloError,
      );
      // @ts-ignore - Testing invalid selector
      expect(() =>
        monteCarlo["standardDeviation"]({ name: "unknown" }),
      ).toThrow(MonteCarloError);
    });

    it("should handle empty histogram for percentile calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = {};

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 0);
      expect(percentiles).toEqual({});
    });

    it("should handle incomplete percentile data", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = { 1: 1 }; // Only one data point

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 1);
      expect(percentiles[25]).toBe(1); // Should use the only value for all percentiles
      expect(percentiles[50]).toBe(1);
      expect(percentiles[75]).toBe(1);
      expect(percentiles[90]).toBe(1);
    });

    it("should handle cache misses in statistical calculations", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      monteCarlo.simulate();

      // @ts-ignore - Testing private method
      monteCarlo["statsCache"].clear();

      // Test cache misses for average
      // @ts-ignore - Testing private method
      const avgSuccesses = monteCarlo["average"]((roll) => roll.successes);
      expect(avgSuccesses).toBeGreaterThanOrEqual(0);

      // Test cache misses for standard deviation
      // @ts-ignore - Testing private method
      const stdDevSuccesses = monteCarlo["standardDeviation"](
        (roll) => roll.successes,
      );
      expect(stdDevSuccesses).toBeGreaterThanOrEqual(0);
    });

    it("should handle median calculation with no target count reached", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = { 5: 100 }; // Less than iterations/2

      // @ts-ignore - Accessing private method for testing
      const median = monteCarlo["calculateMedianFromHistogram"](histogram);
      expect(median).toBe(5);
    });

    it("should handle percentile calculation with partial data", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = { 1: 180, 2: 20 }; // Not enough data for all percentiles

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 200);
      expect(percentiles[25]).toBe(1);
      expect(percentiles[50]).toBe(1);
      expect(percentiles[75]).toBe(1);
      expect(percentiles[90]).toBe(1); // When not reaching target percentile, use max value (1 in this case)
    });

    it("should handle all selector types in average calculation with cache misses", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
        forceDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Clear the cache to force recalculation
      // @ts-ignore - Accessing private property for testing
      monteCarlo["_averages"] = null;

      // Test all selector types using the public API
      expect(result.averages.successes).toBeGreaterThanOrEqual(0);
      expect(result.averages.advantages).toBeGreaterThanOrEqual(0);
      expect(result.averages.triumphs).toBeGreaterThanOrEqual(0);
      expect(result.averages.failures).toBeGreaterThanOrEqual(0);
      expect(result.averages.threats).toBeGreaterThanOrEqual(0);
      expect(result.averages.despair).toBeGreaterThanOrEqual(0);
      expect(result.averages.lightSide).toBeGreaterThanOrEqual(0);
      expect(result.averages.darkSide).toBeGreaterThanOrEqual(0);
    });

    it("should handle all selector types in standard deviation calculation with cache misses", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
        forceDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Clear the cache to force recalculation
      // @ts-ignore - Accessing private property for testing
      monteCarlo["_standardDeviations"] = null;

      // Test all selector types using the public API
      expect(result.standardDeviations.successes).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.advantages).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.triumphs).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.failures).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.threats).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.despair).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.lightSide).toBeGreaterThanOrEqual(0);
      expect(result.standardDeviations.darkSide).toBeGreaterThanOrEqual(0);
    });

    it("should handle percentile calculation with missing data", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = { 1: 100 }; // Only one value

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 100);
      expect(percentiles[25]).toBe(1);
      expect(percentiles[50]).toBe(1);
      expect(percentiles[75]).toBe(1);
      expect(percentiles[90]).toBe(1);
    });

    it("should handle unknown selector types in average calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Clear the cache to force recalculation
      // @ts-ignore - Accessing private property for testing
      monteCarlo["_averages"] = null;

      // Test with an unknown selector
      // @ts-ignore - Testing private method with invalid input
      expect(() => monteCarlo["average"]({ name: "unknown" })).toThrow();
    });

    it("should handle unknown selector types in standard deviation calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Clear the cache to force recalculation
      // @ts-ignore - Accessing private property for testing
      monteCarlo["_standardDeviations"] = null;

      // Test with an unknown selector
      // @ts-ignore - Testing private method with invalid input
      expect(() =>
        monteCarlo["standardDeviation"]({ name: "unknown" }),
      ).toThrow();
    });

    it("should handle percentile calculation with no data", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = {}; // Empty histogram

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 0);
      expect(percentiles).toEqual({});
    });

    it("should handle cache hits in average calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // First call should populate the cache
      // @ts-ignore - Testing private method
      const firstCall = monteCarlo["average"]({ name: "successes" });

      // Second call should use the cache
      // @ts-ignore - Testing private method
      const secondCall = monteCarlo["average"]({ name: "successes" });

      expect(firstCall).toBe(secondCall);
    });

    it("should handle cache hits in standard deviation calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // First call should populate the cache
      // @ts-ignore - Testing private method
      const firstCall = monteCarlo["standardDeviation"]({ name: "successes" });

      // Second call should use the cache
      // @ts-ignore - Testing private method
      const secondCall = monteCarlo["standardDeviation"]({ name: "successes" });

      expect(firstCall).toBe(secondCall);
    });

    it("should handle percentile calculation with multiple missing percentiles", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = { 1: 50 }; // Only enough data for 50th percentile

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 100);
      expect(percentiles[25]).toBe(1);
      expect(percentiles[50]).toBe(1);
      expect(percentiles[75]).toBe(1);
      expect(percentiles[90]).toBe(1);
    });

    it("should handle cache misses with valid selectors and non-zero running stats in average calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      // @ts-ignore - Testing private constructor
      const monteCarlo = new MonteCarlo(pool, 250, false); // Pass false to avoid running simulate() in constructor

      // Set running stats before any other operations
      // @ts-ignore - Accessing private property for testing
      monteCarlo["runningStats"] = {
        successCount: 0,
        criticalSuccessCount: 0,
        criticalFailureCount: 0,
        netPositiveCount: 0,
        sumSuccesses: 100,
        sumAdvantages: 50,
        sumTriumphs: 10,
        sumFailures: 20,
        sumThreats: 30,
        sumDespair: 5,
        sumLightSide: 15,
        sumDarkSide: 25,
        sumSquaredSuccesses: 200,
        sumSquaredAdvantages: 100,
        sumSquaredThreats: 60,
      };

      // Clear the cache
      // @ts-ignore - Accessing private property for testing
      monteCarlo["statsCache"] = new Map();

      // Test with a valid selector
      // @ts-ignore - Testing private method
      const avgSuccesses = monteCarlo["average"]({ name: "successes" });
      expect(avgSuccesses).toBe(0.4); // 100 / 250

      // @ts-ignore - Testing private method
      const avgAdvantages = monteCarlo["average"]({ name: "advantages" });
      expect(avgAdvantages).toBe(0.2); // 50 / 250

      // @ts-ignore - Testing private method
      const avgTriumphs = monteCarlo["average"]({ name: "triumphs" });
      expect(avgTriumphs).toBe(0.04); // 10 / 250

      // @ts-ignore - Testing private method
      const avgFailures = monteCarlo["average"]({ name: "failures" });
      expect(avgFailures).toBe(0.08); // 20 / 250

      // @ts-ignore - Testing private method
      const avgThreats = monteCarlo["average"]({ name: "threats" });
      expect(avgThreats).toBe(0.12); // 30 / 250

      // @ts-ignore - Testing private method
      const avgDespair = monteCarlo["average"]({ name: "despair" });
      expect(avgDespair).toBe(0.02); // 5 / 250

      // @ts-ignore - Testing private method
      const avgLightSide = monteCarlo["average"]({ name: "lightSide" });
      expect(avgLightSide).toBe(0.06); // 15 / 250

      // @ts-ignore - Testing private method
      const avgDarkSide = monteCarlo["average"]({ name: "darkSide" });
      expect(avgDarkSide).toBe(0.1); // 25 / 250
    });

    it("should handle cache misses with valid selectors in standard deviation calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      // @ts-ignore - Testing private constructor
      const monteCarlo = new MonteCarlo(pool, 250, false);

      // Set running stats before any other operations
      // @ts-ignore - Accessing private property for testing
      monteCarlo["runningStats"] = {
        successCount: 0,
        criticalSuccessCount: 0,
        criticalFailureCount: 0,
        netPositiveCount: 0,
        sumSuccesses: 100,
        sumAdvantages: 50,
        sumTriumphs: 10,
        sumFailures: 20,
        sumThreats: 30,
        sumDespair: 5,
        sumLightSide: 15,
        sumDarkSide: 25,
        sumSquaredSuccesses: 200,
        sumSquaredAdvantages: 100,
        sumSquaredThreats: 60,
      };

      // Set test results with varying values
      // @ts-ignore - Accessing private property for testing
      monteCarlo["results"] = Array(250)
        .fill(0)
        .map((_, i) => ({
          successes: i % 2,
          advantages: i % 3,
          triumphs: i % 2,
          failures: i % 3,
          threats: i % 2,
          despair: i % 2,
          lightSide: i % 3,
          darkSide: i % 2,
        }));

      // Clear the cache to force recalculation
      // @ts-ignore - Accessing private property for testing
      monteCarlo["statsCache"] = new Map();

      // Test with a valid selector
      // @ts-ignore - Testing private method
      const stdDevSuccesses = monteCarlo["standardDeviation"](
        (roll) => roll.successes,
      );
      expect(stdDevSuccesses).toBeGreaterThan(0);

      // @ts-ignore - Testing private method
      const stdDevAdvantages = monteCarlo["standardDeviation"](
        (roll) => roll.advantages,
      );
      expect(stdDevAdvantages).toBeGreaterThan(0);

      // @ts-ignore - Testing private method
      const stdDevThreats = monteCarlo["standardDeviation"](
        (roll) => roll.threats,
      );
      expect(stdDevThreats).toBeGreaterThan(0);

      // @ts-ignore - Testing private method
      const stdDevTriumphs = monteCarlo["standardDeviation"](
        (roll) => roll.triumphs,
      );
      expect(stdDevTriumphs).toBeGreaterThan(0);

      // @ts-ignore - Testing private method
      const stdDevFailures = monteCarlo["standardDeviation"](
        (roll) => roll.failures,
      );
      expect(stdDevFailures).toBeGreaterThan(0);

      // @ts-ignore - Testing private method
      const stdDevDespair = monteCarlo["standardDeviation"](
        (roll) => roll.despair,
      );
      expect(stdDevDespair).toBeGreaterThan(0);

      // @ts-ignore - Testing private method
      const stdDevLightSide = monteCarlo["standardDeviation"](
        (roll) => roll.lightSide,
      );
      expect(stdDevLightSide).toBeGreaterThan(0);

      // @ts-ignore - Testing private method
      const stdDevDarkSide = monteCarlo["standardDeviation"](
        (roll) => roll.darkSide,
      );
      expect(stdDevDarkSide).toBeGreaterThan(0);
    });
  });

  describe("performance optimizations", () => {
    it("should handle large numbers of iterations efficiently", () => {
      const largePool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(largePool, 100000);
      const result = monteCarlo.simulate();

      // Should complete without memory issues
      expect(result.averages.successes).toBeDefined();
      expect(result.medians.successes).toBeDefined();
      expect(result.standardDeviations.successes).toBeDefined();
    });

    it("should maintain accuracy with running statistics", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 10000);
      const result = monteCarlo.simulate();

      // Verify statistical accuracy
      expect(result.averages.successes).toBeGreaterThan(0);
      expect(result.averages.advantages).toBeGreaterThan(0);
      expect(result.standardDeviations.successes).toBeGreaterThan(0);
      expect(result.standardDeviations.advantages).toBeGreaterThan(0);
    });

    it("should use sparse histogram storage", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Histogram should only contain non-zero counts
      const netSuccesses = result.histogram.netSuccesses;
      Object.values(netSuccesses).forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });
    });

    it("should cache statistical calculations", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Multiple calls should return the same cached value
      const firstCall = result.averages.successes;
      const secondCall = result.averages.successes;
      expect(firstCall).toBe(secondCall);
    });

    it("should handle memory pressure scenarios", () => {
      const complexPool: DicePool = {
        abilityDice: 5,
        proficiencyDice: 3,
        difficultyDice: 4,
        challengeDice: 2,
        boostDice: 2,
        setBackDice: 2,
        forceDice: 1,
      };
      const monteCarlo = new MonteCarlo(complexPool, 50000);
      const result = monteCarlo.simulate();

      // Should complete without memory issues
      expect(result.averages.successes).toBeDefined();
      expect(result.medians.successes).toBeDefined();
      expect(result.standardDeviations.successes).toBeDefined();
    });

    it("should maintain histogram accuracy with direct array access", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const result = monteCarlo.simulate();

      // Verify histogram counts sum to total iterations
      const netSuccessesSum = Object.values(
        result.histogram.netSuccesses,
      ).reduce((a, b) => a + b, 0);
      expect(netSuccessesSum).toBe(1000);

      const netAdvantagesSum = Object.values(
        result.histogram.netAdvantages,
      ).reduce((a, b) => a + b, 0);
      expect(netAdvantagesSum).toBe(1000);
    });

    it("should handle long-running simulations efficiently", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000000); // MAX_ITERATIONS
      const result = monteCarlo.simulate();

      // Should complete without memory issues
      expect(result.averages.successes).toBeDefined();
      expect(result.medians.successes).toBeDefined();
      expect(result.standardDeviations.successes).toBeDefined();
    });

    it("should maintain statistical accuracy with large datasets", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 100000);
      const result = monteCarlo.simulate();

      // Verify statistical properties
      expect(result.averages.successes).toBeGreaterThan(0);
      expect(result.standardDeviations.successes).toBeGreaterThan(0);
      expect(result.medians.successes).toBeDefined();
      expect(result.analysis.netSuccesses.skewness).toBeDefined();
      expect(result.analysis.netSuccesses.kurtosis).toBeDefined();
    });
  });

  describe("additional tests", () => {
    it("should handle all selector types in average calculation", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      monteCarlo.simulate();

      // @ts-ignore - Accessing private method for testing
      const selectors = [
        { name: "successes" },
        { name: "advantages" },
        { name: "triumphs" },
        { name: "failures" },
        { name: "threats" },
        { name: "despair" },
        { name: "lightSide" },
        { name: "darkSide" },
      ];

      selectors.forEach((selector) => {
        // @ts-ignore - Testing private method
        expect(() => monteCarlo["average"](selector)).not.toThrow();
      });
    });

    it("should handle all selector types in standard deviation calculation", () => {
      const pool: DicePool = {
        abilityDice: 2,
        proficiencyDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      monteCarlo.simulate();

      // @ts-ignore - Accessing private method for testing
      const selectors = [
        { name: "successes" },
        { name: "advantages" },
        { name: "triumphs" },
        { name: "failures" },
        { name: "threats" },
        { name: "despair" },
        { name: "lightSide" },
        { name: "darkSide" },
      ];

      selectors.forEach((selector) => {
        // @ts-ignore - Testing private method
        expect(() => monteCarlo["standardDeviation"](selector)).not.toThrow();
      });
    });

    it("should handle single-entry histogram for median calculation", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = { 5: 1000 };

      // @ts-ignore - Accessing private method for testing
      const median = monteCarlo["calculateMedianFromHistogram"](histogram);
      expect(median).toBe(5);
    });

    it("should handle percentile calculation with single value", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = { 5: 1000 };

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 1000);
      expect(percentiles[25]).toBe(5);
      expect(percentiles[50]).toBe(5);
      expect(percentiles[75]).toBe(5);
      expect(percentiles[90]).toBe(5);
    });

    it("should handle percentile calculation with multiple values", () => {
      const pool: DicePool = {
        abilityDice: 1,
      };
      const monteCarlo = new MonteCarlo(pool, 1000);
      const histogram: { [key: number]: number } = {
        1: 250,
        2: 250,
        3: 250,
        4: 250,
      };

      // @ts-ignore - Accessing private method for testing
      const percentiles = monteCarlo["calculatePercentiles"](histogram, 1000);
      expect(percentiles[25]).toBe(1);
      expect(percentiles[50]).toBe(2);
      expect(percentiles[75]).toBe(3);
      expect(percentiles[90]).toBe(4);
    });
  });

  describe("result interface completeness", () => {
    it("should include histogram property in MonteCarloResult", () => {
      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      // Verify histogram exists
      expect(result.histogram).toBeDefined();
      expect(typeof result.histogram).toBe("object");

      // Verify histogram has all expected properties
      expect(result.histogram.netSuccesses).toBeDefined();
      expect(result.histogram.netAdvantages).toBeDefined();
      expect(result.histogram.triumphs).toBeDefined();
      expect(result.histogram.despairs).toBeDefined();
      expect(result.histogram.lightSide).toBeDefined();
      expect(result.histogram.darkSide).toBeDefined();

      // Verify histogram data structure
      expect(Object.keys(result.histogram.netSuccesses).length).toBeGreaterThan(
        0,
      );

      // Check property assignment works (TypeScript compilation would fail if property doesn't exist in interface)
      const histogramCopy = result.histogram;
      expect(histogramCopy).toEqual(result.histogram);
    });

    it("should include analysis property in MonteCarloResult", () => {
      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      // Verify analysis exists
      expect(result.analysis).toBeDefined();
      expect(typeof result.analysis).toBe("object");

      // Verify analysis has all expected properties
      expect(result.analysis.netSuccesses).toBeDefined();
      expect(result.analysis.netAdvantages).toBeDefined();
      expect(result.analysis.triumphs).toBeDefined();
      expect(result.analysis.despairs).toBeDefined();
      expect(result.analysis.lightSide).toBeDefined();
      expect(result.analysis.darkSide).toBeDefined();

      // Verify analysis structure is complete
      expect(result.analysis.netSuccesses.skewness).toBeDefined();
      expect(result.analysis.netSuccesses.kurtosis).toBeDefined();
      expect(result.analysis.netSuccesses.outliers).toBeDefined();
      expect(result.analysis.netSuccesses.modes).toBeDefined();
      expect(result.analysis.netSuccesses.percentiles).toBeDefined();

      // Check property assignment works (TypeScript compilation would fail if property doesn't exist in interface)
      const analysisCopy = result.analysis;
      expect(analysisCopy).toEqual(result.analysis);
    });

    it("should export the complete interface through the package", () => {
      // This is a compile-time check that verifies the exported interface includes all properties
      // If the MonteCarloResult interface exported from the package is missing properties,
      // TypeScript would throw compilation errors here

      const monteCarlo = new MonteCarlo(dicePool, 1000);
      const result = monteCarlo.simulate();

      // Create a test function that requires the full interface
      const testCompleteInterface = (
        fullResult: import("../src").MonteCarloResult,
      ) => {
        // Access all expected properties to verify the interface is complete
        const {
          averages,
          medians,
          standardDeviations,
          successProbability,
          criticalSuccessProbability,
          criticalFailureProbability,
          netPositiveProbability,
          histogram,
          analysis,
        } = fullResult;

        // Access nested properties
        const netSuccessesHist = histogram.netSuccesses;
        const skewnessValue = analysis.netSuccesses.skewness;

        return {
          netSuccessesHist,
          skewnessValue,
        };
      };

      // Call the function with our result
      const extracted = testCompleteInterface(result);

      // Verify the function could extract the nested properties
      expect(extracted.netSuccessesHist).toBeDefined();
      expect(extracted.skewnessValue).toBeDefined();
    });
  });
});
