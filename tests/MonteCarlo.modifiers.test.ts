import { DicePool } from "@swrpg-online/dice";
import {
  MonteCarlo,
  MonteCarloError,
  ModifierConfig,
  SimulationConfig,
} from "../src/MonteCarlo";

describe("MonteCarlo with Modifiers", () => {
  let baseDicePool: DicePool;

  beforeEach(() => {
    baseDicePool = {
      abilityDice: 2,
      proficiencyDice: 1,
      difficultyDice: 2,
    };
  });

  describe("SimulationConfig constructor", () => {
    it("should accept SimulationConfig with modifiers", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 1000,
        modifiers: {
          automaticSuccesses: 1,
          automaticAdvantages: 2,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis).toBeDefined();
      expect(result.averages.successes).toBeGreaterThan(0);
    });

    it("should accept SimulationConfig with player and opposition modifiers", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 1000,
        playerModifiers: {
          automaticSuccesses: 1,
          upgradeAbility: 1,
        },
        oppositionModifiers: {
          automaticFailures: 1,
          upgradeDifficulty: 1,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis).toBeDefined();
      expect(result.modifierAnalysis?.upgradeImpact.abilityUpgrades).toBe(1);
      expect(result.modifierAnalysis?.upgradeImpact.difficultyUpgrades).toBe(1);
    });

    it("should maintain backward compatibility with DicePool constructor", () => {
      const monteCarlo = new MonteCarlo(baseDicePool, 1000);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis).toBeUndefined();
      expect(result.averages.successes).toBeDefined();
    });
  });

  describe("Automatic symbols", () => {
    it("should apply automatic successes", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 10000,
        modifiers: {
          automaticSuccesses: 2,
        },
      };

      const withModifiers = new MonteCarlo(config);
      const withoutModifiers = new MonteCarlo(baseDicePool, 10000);

      const modifiedResult = withModifiers.simulate();
      const baseResult = withoutModifiers.simulate();

      // Average successes should be increased by automatic successes
      // Allow more tolerance due to randomness
      const expectedIncrease = 2;
      const actualIncrease =
        modifiedResult.averages.successes - baseResult.averages.successes;
      expect(actualIncrease).toBeGreaterThan(expectedIncrease - 0.3);
      expect(actualIncrease).toBeLessThan(expectedIncrease + 0.3);

      // Modifier analysis should track the contribution
      expect(
        modifiedResult.modifierAnalysis?.automaticSymbolContribution.successes,
      ).toBeCloseTo(2, 1);
    });

    it("should apply automatic failures", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 10000,
        modifiers: {
          automaticFailures: 1,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(
        result.modifierAnalysis?.automaticSymbolContribution.failures,
      ).toBeCloseTo(1, 1);
      expect(result.averages.failures).toBeGreaterThan(0);
    });

    it("should apply automatic advantages and threats", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 10000,
        modifiers: {
          automaticAdvantages: 3,
          automaticThreats: 1,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(
        result.modifierAnalysis?.automaticSymbolContribution.advantages,
      ).toBeCloseTo(3, 1);
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.threats,
      ).toBeCloseTo(1, 1);
    });

    it("should apply automatic triumphs and despairs", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 10000,
        modifiers: {
          automaticTriumphs: 1,
          automaticDespairs: 1,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(
        result.modifierAnalysis?.automaticSymbolContribution.triumphs,
      ).toBeCloseTo(1, 1);
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.despairs,
      ).toBeCloseTo(1, 1);
      expect(result.criticalSuccessProbability).toBe(1); // Always have triumph
      expect(result.criticalFailureProbability).toBe(1); // Always have despair
    });
  });

  describe("Dice upgrades and downgrades", () => {
    it("should apply ability upgrades", () => {
      const config: SimulationConfig = {
        dicePool: {
          abilityDice: 3,
          difficultyDice: 2,
        },
        iterations: 10000,
        modifiers: {
          upgradeAbility: 2,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis?.upgradeImpact.abilityUpgrades).toBe(2);
      // Upgrades should increase chance of triumphs
      expect(result.criticalSuccessProbability).toBeGreaterThan(0);
    });

    it("should apply difficulty upgrades", () => {
      const config: SimulationConfig = {
        dicePool: {
          abilityDice: 2,
          difficultyDice: 3,
        },
        iterations: 10000,
        modifiers: {
          upgradeDifficulty: 2,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis?.upgradeImpact.difficultyUpgrades).toBe(2);
      // Upgrades should increase chance of despairs
      expect(result.criticalFailureProbability).toBeGreaterThan(0);
    });

    it("should apply proficiency downgrades", () => {
      const config: SimulationConfig = {
        dicePool: {
          proficiencyDice: 3,
          difficultyDice: 2,
        },
        iterations: 10000,
        modifiers: {
          downgradeProficiency: 2,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis?.upgradeImpact.proficiencyDowngrades).toBe(
        2,
      );
    });

    it("should apply challenge downgrades", () => {
      const config: SimulationConfig = {
        dicePool: {
          abilityDice: 2,
          challengeDice: 3,
        },
        iterations: 10000,
        modifiers: {
          downgradeChallenge: 2,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis?.upgradeImpact.challengeDowngrades).toBe(
        2,
      );
    });
  });

  describe("Combined modifiers", () => {
    it("should apply multiple modifiers simultaneously", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 10000,
        modifiers: {
          automaticSuccesses: 1,
          automaticAdvantages: 2,
          upgradeAbility: 1,
          upgradeDifficulty: 1,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis).toBeDefined();
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.successes,
      ).toBeCloseTo(1, 1);
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.advantages,
      ).toBeCloseTo(2, 1);
      expect(result.modifierAnalysis?.upgradeImpact.abilityUpgrades).toBe(1);
      expect(result.modifierAnalysis?.upgradeImpact.difficultyUpgrades).toBe(1);
    });

    it("should correctly track rolled vs automatic contributions", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 10000,
        modifiers: {
          automaticSuccesses: 2,
          automaticAdvantages: 3,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      // Total should be sum of automatic and rolled
      const totalSuccesses = result.averages.successes;
      const autoSuccesses =
        result.modifierAnalysis?.automaticSymbolContribution.successes || 0;
      const rolledSuccesses =
        result.modifierAnalysis?.rolledSymbolContribution.successes || 0;

      // Allow small tolerance for floating point arithmetic
      expect(totalSuccesses).toBeCloseTo(autoSuccesses + rolledSuccesses, 0);
    });
  });

  describe("Specialized simulation methods", () => {
    it("should simulate Adversary talent", () => {
      const monteCarlo = new MonteCarlo(baseDicePool, 10000);
      const adversaryResult = monteCarlo.simulateAdversary(2);

      expect(adversaryResult.modifierAnalysis).toBeDefined();
      expect(
        adversaryResult.modifierAnalysis?.upgradeImpact.difficultyUpgrades,
      ).toBe(2);
      expect(adversaryResult.criticalFailureProbability).toBeGreaterThan(0);
    });

    it("should simulate aimed attacks", () => {
      const monteCarlo = new MonteCarlo(baseDicePool, 10000);
      const aimedResult = monteCarlo.simulateAimedAttack(1);

      expect(aimedResult.modifierAnalysis).toBeDefined();
      expect(aimedResult.modifierAnalysis?.upgradeImpact.abilityUpgrades).toBe(
        1,
      );
    });

    it("should simulate Superior weapons", () => {
      const monteCarlo = new MonteCarlo(baseDicePool, 10000);
      const superiorResult = monteCarlo.simulateSuperiorWeapon(1);

      expect(superiorResult.modifierAnalysis).toBeDefined();
      expect(
        superiorResult.modifierAnalysis?.automaticSymbolContribution.advantages,
      ).toBeCloseTo(1, 1);
    });

    it("should simulate complex combat scenarios", () => {
      const monteCarlo = new MonteCarlo(baseDicePool, 10000);
      const combatResult = monteCarlo.simulateCombatScenario(1, true, 2);

      expect(combatResult.modifierAnalysis).toBeDefined();
      expect(
        combatResult.modifierAnalysis?.automaticSymbolContribution.successes,
      ).toBeCloseTo(1, 1);
      expect(
        combatResult.modifierAnalysis?.automaticSymbolContribution.advantages,
      ).toBeCloseTo(1, 1);
      expect(
        combatResult.modifierAnalysis?.upgradeImpact.difficultyUpgrades,
      ).toBe(2);
    });

    it("should compare with and without modifiers", () => {
      const monteCarlo = new MonteCarlo(baseDicePool, 10000);
      const modifiers: ModifierConfig = {
        automaticSuccesses: 1,
        automaticAdvantages: 2,
        upgradeAbility: 1,
      };

      const comparison = monteCarlo.compareWithAndWithoutModifiers(modifiers);

      expect(comparison.base).toBeDefined();
      expect(comparison.modified).toBeDefined();
      expect(comparison.improvement).toBeDefined();

      // Modified should be better than base
      expect(comparison.improvement.successProbabilityDelta).toBeGreaterThan(0);
      // Allow tolerance for randomness
      expect(comparison.improvement.averageSuccessesDelta).toBeGreaterThan(0.7);
      expect(comparison.improvement.averageSuccessesDelta).toBeLessThan(1.3);
      expect(comparison.improvement.averageAdvantagesDelta).toBeGreaterThan(
        1.5,
      );
      expect(comparison.improvement.averageAdvantagesDelta).toBeLessThan(2.5);
    });

    it("should apply custom modifiers", () => {
      const monteCarlo = new MonteCarlo(baseDicePool, 10000);
      const customModifiers: ModifierConfig = {
        automaticSuccesses: 2,
        automaticFailures: 1,
        automaticAdvantages: 3,
        automaticThreats: 1,
        automaticTriumphs: 1,
        upgradeAbility: 2,
        upgradeDifficulty: 1,
      };

      const result = monteCarlo.simulateWithModifiers(customModifiers);

      expect(result.modifierAnalysis).toBeDefined();
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.successes,
      ).toBeCloseTo(2, 1);
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.failures,
      ).toBeCloseTo(1, 1);
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.triumphs,
      ).toBeCloseTo(1, 1);
      expect(result.modifierAnalysis?.upgradeImpact.abilityUpgrades).toBe(2);
      expect(result.modifierAnalysis?.upgradeImpact.difficultyUpgrades).toBe(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle no modifiers", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 1000,
        modifiers: {},
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.modifierAnalysis).toBeDefined();
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.successes,
      ).toBe(0);
    });

    it("should handle extreme automatic symbols", () => {
      const config: SimulationConfig = {
        dicePool: { abilityDice: 1 },
        iterations: 1000,
        modifiers: {
          automaticSuccesses: 10,
          automaticAdvantages: 10,
          automaticTriumphs: 5,
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      expect(result.averages.successes).toBeGreaterThanOrEqual(10);
      expect(result.averages.advantages).toBeGreaterThanOrEqual(10);
      expect(result.averages.triumphs).toBeGreaterThanOrEqual(5);
    });

    it("should handle dice pool with only automatic symbols (no dice)", () => {
      const config: SimulationConfig = {
        dicePool: {}, // No actual dice
        iterations: 1000,
        modifiers: {
          automaticSuccesses: 3,
          automaticAdvantages: 2,
        },
      };

      // Should throw error because no dice in pool
      expect(() => new MonteCarlo(config)).toThrow(MonteCarloError);
    });

    it("should handle all upgrades with no base dice", () => {
      const config: SimulationConfig = {
        dicePool: {
          abilityDice: 0,
          difficultyDice: 2,
        },
        iterations: 1000,
        modifiers: {
          upgradeAbility: 3, // Can't upgrade non-existent dice
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      // Upgrades should create proficiency dice from nothing in the dice library
      expect(result.modifierAnalysis?.upgradeImpact.abilityUpgrades).toBe(3);
    });

    it("should handle all downgrades with no yellow/red dice", () => {
      const config: SimulationConfig = {
        dicePool: {
          abilityDice: 3,
          difficultyDice: 2,
        },
        iterations: 1000,
        modifiers: {
          downgradeProficiency: 2, // No proficiency dice to downgrade
          downgradeChallenge: 2, // No challenge dice to downgrade
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      // Downgrades should be tracked but have no effect
      expect(result.modifierAnalysis?.upgradeImpact.proficiencyDowngrades).toBe(
        2,
      );
      expect(result.modifierAnalysis?.upgradeImpact.challengeDowngrades).toBe(
        2,
      );
    });

    it("should handle negative net results with automatic symbols", () => {
      const config: SimulationConfig = {
        dicePool: {
          difficultyDice: 3,
        },
        iterations: 1000,
        modifiers: {
          automaticSuccesses: 1, // Won't overcome 3 difficulty dice usually
        },
      };

      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();

      // Should still track automatic contribution even if net is negative
      expect(
        result.modifierAnalysis?.automaticSymbolContribution.successes,
      ).toBeCloseTo(1, 1);
      expect(result.successProbability).toBeLessThan(0.5);
    });
  });

  describe("Performance", () => {
    it("should handle large iterations with modifiers efficiently", () => {
      const config: SimulationConfig = {
        dicePool: baseDicePool,
        iterations: 100000,
        modifiers: {
          automaticSuccesses: 2,
          automaticAdvantages: 3,
          upgradeAbility: 1,
          upgradeDifficulty: 1,
        },
      };

      const startTime = Date.now();
      const monteCarlo = new MonteCarlo(config);
      const result = monteCarlo.simulate();
      const endTime = Date.now();

      expect(result.modifierAnalysis).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
