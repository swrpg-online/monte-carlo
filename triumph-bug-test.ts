import { DicePool } from "@swrpg-online/dice";
import { MonteCarlo, SimulationConfig } from "./src/MonteCarlo";

console.log("Testing Triumph vs Success Probabilities");
console.log("=".repeat(70));

const iterations = 50000;

// Test 1: Difficulty die (only failures/threats) + automatic success
const successConfig: SimulationConfig = {
  dicePool: { difficultyDice: 1 },
  iterations,
  modifiers: {
    automaticSuccesses: 1,
  },
};

// Test 2: Difficulty die + automatic triumph (should include success)
const triumphConfig: SimulationConfig = {
  dicePool: { difficultyDice: 1 },
  iterations,
  modifiers: {
    automaticTriumphs: 1,
  },
};

const successSim = new MonteCarlo(successConfig);
const triumphSim = new MonteCarlo(triumphConfig);

const successResult = successSim.simulate();
const triumphResult = triumphSim.simulate();

console.log("\nDifficulty die + 1 automatic success:");
console.log(
  `  Success Probability: ${(successResult.successProbability * 100).toFixed(2)}%`,
);
console.log(
  `  Average Successes: ${successResult.averages.successes.toFixed(3)}`,
);
console.log(
  `  Average Triumphs: ${successResult.averages.triumphs.toFixed(3)}`,
);

console.log("\nDifficulty die + 1 automatic triumph:");
console.log(
  `  Success Probability: ${(triumphResult.successProbability * 100).toFixed(2)}%`,
);
console.log(
  `  Average Successes: ${triumphResult.averages.successes.toFixed(3)}`,
);
console.log(
  `  Average Triumphs: ${triumphResult.averages.triumphs.toFixed(3)}`,
);

console.log("\n" + "=".repeat(70));
console.log("Analysis:");
if (
  triumphResult.successProbability <
  successResult.successProbability - 0.01
) {
  console.log(
    "❌ BUG CONFIRMED: Automatic triumphs do NOT include implicit success!",
  );
  console.log(
    `   Success rate difference: ${((successResult.successProbability - triumphResult.successProbability) * 100).toFixed(2)}%`,
  );
} else {
  console.log("✅ Automatic triumphs correctly include implicit success");
}

// Test the mirror case with despairs
console.log("\n" + "=".repeat(70));
console.log("\nMirror Test with Despairs:");

// Test 3: Ability die + automatic failure
const failureConfig: SimulationConfig = {
  dicePool: { abilityDice: 1 },
  iterations,
  modifiers: {
    automaticFailures: 1,
  },
};

// Test 4: Ability die + automatic despair (should include failure)
const despairConfig: SimulationConfig = {
  dicePool: { abilityDice: 1 },
  iterations,
  modifiers: {
    automaticDespairs: 1,
  },
};

const failureSim = new MonteCarlo(failureConfig);
const despairSim = new MonteCarlo(despairConfig);

const failureResult = failureSim.simulate();
const despairResult = despairSim.simulate();

console.log("\nAbility die + 1 automatic failure:");
console.log(
  `  Success Probability: ${(failureResult.successProbability * 100).toFixed(2)}%`,
);
console.log(
  `  Average Failures: ${failureResult.averages.failures.toFixed(3)}`,
);

console.log("\nAbility die + 1 automatic despair (with our fix):");
console.log(
  `  Success Probability: ${(despairResult.successProbability * 100).toFixed(2)}%`,
);
console.log(
  `  Average Failures: ${despairResult.averages.failures.toFixed(3)}`,
);
console.log(`  Average Despairs: ${despairResult.averages.despair.toFixed(3)}`);

if (
  Math.abs(
    failureResult.successProbability - despairResult.successProbability,
  ) < 0.01
) {
  console.log(
    "✅ Despairs correctly include implicit failure (due to our workaround)",
  );
} else {
  console.log("❌ Despairs still not including implicit failure");
}
