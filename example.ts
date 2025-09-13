import { DicePool } from "@swrpg-online/dice";
import { MonteCarlo, SimulationConfig, ModifierConfig } from "./src/MonteCarlo";

const ITERATIONS = 10000;

// Helper function to display results
function displayResults(
  name: string,
  results: any,
  showModifiers: boolean = false,
) {
  console.log(`\n=== ${name} ===`);

  console.log("\nProbabilities:");
  console.log(`Success: ${(results.successProbability * 100).toFixed(1)}%`);
  console.log(
    `Critical Success: ${(results.criticalSuccessProbability * 100).toFixed(1)}%`,
  );
  console.log(
    `Critical Failure: ${(results.criticalFailureProbability * 100).toFixed(1)}%`,
  );
  console.log(
    `Net Positive: ${(results.netPositiveProbability * 100).toFixed(1)}%`,
  );

  console.log("\nAverages:");
  console.log(`Successes: ${results.averages.successes.toFixed(2)}`);
  console.log(`Failures: ${results.averages.failures.toFixed(2)}`);
  console.log(`Advantages: ${results.averages.advantages.toFixed(2)}`);
  console.log(`Threats: ${results.averages.threats.toFixed(2)}`);
  console.log(`Triumphs: ${results.averages.triumphs.toFixed(2)}`);
  console.log(`Despairs: ${results.averages.despair.toFixed(2)}`);

  if (showModifiers && results.modifierAnalysis) {
    console.log("\nModifier Analysis:");
    console.log("Automatic Symbol Contributions (per roll):");
    const auto = results.modifierAnalysis.automaticSymbolContribution;
    if (auto.successes > 0)
      console.log(`  Successes: ${auto.successes.toFixed(2)}`);
    if (auto.failures > 0)
      console.log(`  Failures: ${auto.failures.toFixed(2)}`);
    if (auto.advantages > 0)
      console.log(`  Advantages: ${auto.advantages.toFixed(2)}`);
    if (auto.threats > 0) console.log(`  Threats: ${auto.threats.toFixed(2)}`);
    if (auto.triumphs > 0)
      console.log(`  Triumphs: ${auto.triumphs.toFixed(2)}`);
    if (auto.despairs > 0)
      console.log(`  Despairs: ${auto.despairs.toFixed(2)}`);

    console.log("Rolled Symbol Contributions (per roll):");
    const rolled = results.modifierAnalysis.rolledSymbolContribution;
    console.log(`  Successes: ${rolled.successes.toFixed(2)}`);
    console.log(`  Failures: ${rolled.failures.toFixed(2)}`);
    console.log(`  Advantages: ${rolled.advantages.toFixed(2)}`);
    console.log(`  Threats: ${rolled.threats.toFixed(2)}`);

    const upgrades = results.modifierAnalysis.upgradeImpact;
    if (
      upgrades.abilityUpgrades > 0 ||
      upgrades.difficultyUpgrades > 0 ||
      upgrades.proficiencyDowngrades > 0 ||
      upgrades.challengeDowngrades > 0
    ) {
      console.log("Dice Modifications:");
      if (upgrades.abilityUpgrades > 0)
        console.log(`  Ability Upgrades: ${upgrades.abilityUpgrades}`);
      if (upgrades.difficultyUpgrades > 0)
        console.log(`  Difficulty Upgrades: ${upgrades.difficultyUpgrades}`);
      if (upgrades.proficiencyDowngrades > 0)
        console.log(
          `  Proficiency Downgrades: ${upgrades.proficiencyDowngrades}`,
        );
      if (upgrades.challengeDowngrades > 0)
        console.log(`  Challenge Downgrades: ${upgrades.challengeDowngrades}`);
    }
  }
}

console.log("==================================================");
console.log("MONTE CARLO SIMULATION WITH DICE POOL MODIFIERS");
console.log("==================================================");

// Example 1: Basic dice pool without modifiers
const basicPool: DicePool = {
  abilityDice: 2,
  proficiencyDice: 1,
  difficultyDice: 2,
};

console.log("\n--- Basic Dice Pool (No Modifiers) ---");
const basicSim = new MonteCarlo(basicPool, ITERATIONS);
const basicResults = basicSim.simulate();
displayResults("Basic Roll", basicResults);

// Example 2: Automatic symbols
console.log("\n--- Automatic Symbols ---");
const autoSymbolConfig: SimulationConfig = {
  dicePool: basicPool,
  iterations: ITERATIONS,
  modifiers: {
    automaticSuccesses: 2,
    automaticAdvantages: 1,
  },
};
const autoSymbolSim = new MonteCarlo(autoSymbolConfig);
const autoSymbolResults = autoSymbolSim.simulate();
displayResults("With Automatic Symbols", autoSymbolResults, true);

// Example 3: Dice upgrades
console.log("\n--- Dice Upgrades ---");
const upgradeConfig: SimulationConfig = {
  dicePool: basicPool,
  iterations: ITERATIONS,
  modifiers: {
    upgradeAbility: 1,
    upgradeDifficulty: 1,
  },
};
const upgradeSim = new MonteCarlo(upgradeConfig);
const upgradeResults = upgradeSim.simulate();
displayResults("With Dice Upgrades", upgradeResults, true);

// Example 4: Dice downgrades
console.log("\n--- Dice Downgrades ---");
const downgradePool: DicePool = {
  proficiencyDice: 2,
  challengeDice: 2,
};
const downgradeConfig: SimulationConfig = {
  dicePool: downgradePool,
  iterations: ITERATIONS,
  modifiers: {
    downgradeProficiency: 1,
    downgradeChallenge: 1,
  },
};
const downgradeSim = new MonteCarlo(downgradeConfig);
const downgradeResults = downgradeSim.simulate();
displayResults("With Dice Downgrades", downgradeResults, true);

// Example 5: Combined modifiers
console.log("\n--- Combined Modifiers ---");
const combinedConfig: SimulationConfig = {
  dicePool: basicPool,
  iterations: ITERATIONS,
  modifiers: {
    automaticSuccesses: 1,
    automaticAdvantages: 2,
    automaticThreats: 1,
    upgradeAbility: 1,
    upgradeDifficulty: 1,
  },
};
const combinedSim = new MonteCarlo(combinedConfig);
const combinedResults = combinedSim.simulate();
displayResults("With Combined Modifiers", combinedResults, true);

// Example 6: Player vs Opposition modifiers
console.log("\n--- Player vs Opposition Modifiers ---");
const pvpConfig: SimulationConfig = {
  dicePool: basicPool,
  iterations: ITERATIONS,
  playerModifiers: {
    automaticSuccesses: 1,
    automaticAdvantages: 1,
    upgradeAbility: 1,
  },
  oppositionModifiers: {
    automaticFailures: 1,
    automaticThreats: 1,
    upgradeDifficulty: 1,
  },
};
const pvpSim = new MonteCarlo(pvpConfig);
const pvpResults = pvpSim.simulate();
displayResults("Player vs Opposition", pvpResults, true);

// Example 7: Comparison analysis
console.log("\n==================================================");
console.log("COMPARISON: BASE VS MODIFIED");
console.log("==================================================");

const comparisonPool: DicePool = {
  abilityDice: 3,
  difficultyDice: 2,
};

// Base simulation
const baseSim = new MonteCarlo(comparisonPool, ITERATIONS);
const baseResult = baseSim.simulate();

// Modified simulation
const modifiedConfig: SimulationConfig = {
  dicePool: comparisonPool,
  iterations: ITERATIONS,
  modifiers: {
    automaticSuccesses: 1,
    automaticAdvantages: 2,
    upgradeAbility: 1,
  },
};
const modifiedSim = new MonteCarlo(modifiedConfig);
const modifiedResult = modifiedSim.simulate();

console.log("\n--- Base Roll ---");
displayResults("Base", baseResult);

console.log("\n--- Modified Roll ---");
displayResults("Modified", modifiedResult, true);

console.log("\n--- Improvement Analysis ---");
const successDelta =
  modifiedResult.successProbability - baseResult.successProbability;
const avgSuccessDelta =
  modifiedResult.averages.successes - baseResult.averages.successes;
const avgAdvantageDelta =
  modifiedResult.averages.advantages - baseResult.averages.advantages;
const critSuccessDelta =
  modifiedResult.criticalSuccessProbability -
  baseResult.criticalSuccessProbability;

console.log(
  `Success Probability Change: ${successDelta > 0 ? "+" : ""}${(successDelta * 100).toFixed(1)}%`,
);
console.log(
  `Average Successes Change: ${avgSuccessDelta > 0 ? "+" : ""}${avgSuccessDelta.toFixed(2)}`,
);
console.log(
  `Average Advantages Change: ${avgAdvantageDelta > 0 ? "+" : ""}${avgAdvantageDelta.toFixed(2)}`,
);
console.log(
  `Critical Success Probability Change: ${critSuccessDelta > 0 ? "+" : ""}${(critSuccessDelta * 100).toFixed(1)}%`,
);

console.log("\n==================================================");
console.log("Simulation Complete!");
console.log("==================================================");
