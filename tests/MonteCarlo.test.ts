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
  });
});
