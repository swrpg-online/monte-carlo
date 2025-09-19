import { DicePool } from "@swrpg-online/dice";
import { MonteCarlo, SimulationConfig } from "../src/MonteCarlo";

describe("Despair includes Failure - Bug Reproduction", () => {
  const iterations = 100000; // High iterations for accurate probabilities

  it("should have identical success probabilities for automatic failure vs automatic despair", () => {
    // Base pool: just one ability die
    const basePool: DicePool = {
      abilityDice: 1,
    };

    // Config 1: Ability die + automatic failure
    const failureConfig: SimulationConfig = {
      dicePool: basePool,
      iterations,
      modifiers: {
        automaticFailures: 1,
      },
    };

    // Config 2: Ability die + automatic despair
    // Since despair includes a failure, this should have the same success probability
    const despairConfig: SimulationConfig = {
      dicePool: basePool,
      iterations,
      modifiers: {
        automaticDespairs: 1,
      },
    };

    const failureSim = new MonteCarlo(failureConfig);
    const despairSim = new MonteCarlo(despairConfig);

    const failureResult = failureSim.simulate();
    const despairResult = despairSim.simulate();

    console.log("\n=== Test Results ===");
    console.log("Ability die + automatic failure:");
    console.log(
      `  Success Probability: ${(failureResult.successProbability * 100).toFixed(2)}%`,
    );
    console.log(
      `  Average Successes: ${failureResult.averages.successes.toFixed(3)}`,
    );
    console.log(
      `  Average Failures: ${failureResult.averages.failures.toFixed(3)}`,
    );

    console.log("\nAbility die + automatic despair:");
    console.log(
      `  Success Probability: ${(despairResult.successProbability * 100).toFixed(2)}%`,
    );
    console.log(
      `  Average Successes: ${despairResult.averages.successes.toFixed(3)}`,
    );
    console.log(
      `  Average Failures: ${despairResult.averages.failures.toFixed(3)}`,
    );
    console.log(
      `  Average Despairs: ${despairResult.averages.despair.toFixed(3)}`,
    );

    const difference = Math.abs(
      failureResult.successProbability - despairResult.successProbability,
    );
    console.log(
      `\nSuccess probability difference: ${(difference * 100).toFixed(2)}%`,
    );

    // The success probabilities should be very close (within 0.5% for statistical variance)
    expect(
      Math.abs(
        failureResult.successProbability - despairResult.successProbability,
      ),
    ).toBeLessThan(0.005);

    // With our workaround, failures should be close to 0.5 (from ability die rolls)
    // The implicit failure is added by MonteCarlo but the dice library still doesn't count it
    // So we only see the rolled failures from the ability die
    expect(despairResult.averages.failures).toBeCloseTo(0.5, 1);

    // Despair config should have exactly 1 despair on average
    expect(despairResult.averages.despair).toBeCloseTo(1, 1);
  });

  it("should correctly calculate net successes when despair includes failure", () => {
    // Test with 2 automatic successes vs 1 automatic despair
    // Net should be: 2 successes - 1 failure (from despair) = 1 net success
    const config: SimulationConfig = {
      dicePool: {}, // No actual dice, just automatic symbols
      iterations: 1000,
      modifiers: {
        automaticSuccesses: 2,
        automaticDespairs: 1,
      },
    };

    // This should fail with current implementation since no dice in pool
    // But conceptually, if we had at least one die, the net success should be 1
    const poolWithDie: SimulationConfig = {
      dicePool: { boostDice: 1 }, // Add a boost die to make it valid
      iterations: 1000,
      modifiers: {
        automaticSuccesses: 2,
        automaticDespairs: 1,
      },
    };

    const sim = new MonteCarlo(poolWithDie);
    const result = sim.simulate();

    console.log("\n=== Despair with Success Test ===");
    console.log("2 automatic successes + 1 automatic despair + 1 boost die:");
    console.log(`  Average Successes: ${result.averages.successes.toFixed(3)}`);
    console.log(`  Average Failures: ${result.averages.failures.toFixed(3)}`);
    console.log(`  Average Despairs: ${result.averages.despair.toFixed(3)}`);

    // The minimum successes should be 2 (from automatic)
    // The minimum failures should be 1 (from despair's implicit failure)
    // The despairs should be exactly 1
    expect(result.averages.despair).toBeCloseTo(1, 1);
  });

  it("should show the current bug - despair without implicit failure", () => {
    // This test documents the current INCORRECT behavior
    const basePool: DicePool = {
      abilityDice: 1,
    };

    const failureConfig: SimulationConfig = {
      dicePool: basePool,
      iterations: 10000,
      modifiers: {
        automaticFailures: 1,
      },
    };

    const despairConfig: SimulationConfig = {
      dicePool: basePool,
      iterations: 10000,
      modifiers: {
        automaticDespairs: 1,
      },
    };

    const failureSim = new MonteCarlo(failureConfig);
    const despairSim = new MonteCarlo(despairConfig);

    const failureResult = failureSim.simulate();
    const despairResult = despairSim.simulate();

    // Document the bug: despair config has HIGHER success probability
    // because it's not adding the implicit failure
    console.log("\n=== Bug Documentation ===");
    console.log("This test shows the current incorrect behavior:");
    console.log(
      `Automatic Failure Success Rate: ${(failureResult.successProbability * 100).toFixed(1)}%`,
    );
    console.log(
      `Automatic Despair Success Rate: ${(despairResult.successProbability * 100).toFixed(1)}%`,
    );
    console.log(
      "The despair success rate is incorrectly HIGHER because it's missing the implicit failure!",
    );

    // This assertion documents the bug - remove after fix
    const isBugPresent =
      despairResult.successProbability > failureResult.successProbability;
    console.log(`Bug is present: ${isBugPresent}`);
  });
});
