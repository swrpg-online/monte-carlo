import { DicePool } from "@swrpg-online/dice";
import { MonteCarlo, SimulationConfig, ModifierConfig } from "./src/MonteCarlo";

// Test different dice pool configurations
const pools: { name: string; pool: DicePool }[] = [
  {
    name: "Basic Combat",
    pool: {
      abilityDice: 2,
      proficiencyDice: 1,
      difficultyDice: 2,
    },
  },
  {
    name: "Social Check",
    pool: {
      abilityDice: 3,
      boostDice: 1,
      difficultyDice: 1,
      setBackDice: 1,
    },
  },
  {
    name: "Complex Slicing",
    pool: {
      abilityDice: 2,
      proficiencyDice: 2,
      difficultyDice: 2,
      challengeDice: 1,
    },
  },
];

const ITERATIONS = 10000; // Default number of iterations

// Helper function to display results
function displayResults(
  name: string,
  results: any,
  showModifiers: boolean = false,
) {
  console.log(`\n=== ${name} ===`);

  console.log("\nProbabilities:");
  console.log("Success:", (results.successProbability * 100).toFixed(1) + "%");
  console.log(
    "Critical Success:",
    (results.criticalSuccessProbability * 100).toFixed(1) + "%",
  );
  console.log(
    "Critical Failure:",
    (results.criticalFailureProbability * 100).toFixed(1) + "%",
  );
  console.log(
    "Net Positive:",
    (results.netPositiveProbability * 100).toFixed(1) + "%",
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
    if (upgrades.abilityUpgrades > 0 || upgrades.difficultyUpgrades > 0) {
      console.log("Dice Upgrades:");
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

// Run standard simulations
console.log("==================================================");
console.log("STANDARD DICE POOL SIMULATIONS");
console.log("==================================================");

pools.forEach(({ name, pool }) => {
  try {
    const simulation = new MonteCarlo(pool, ITERATIONS);
    const results = simulation.simulate();
    displayResults(name, results);
  } catch (error) {
    console.error(
      `Error with ${name}:`,
      error instanceof Error ? error.message : error,
    );
  }
});

// Demonstrate modifier features
console.log("\n==================================================");
console.log("SIMULATIONS WITH MODIFIERS");
console.log("==================================================");

// Example 1: Sharpshooter with Superior Weapon
const combatPool: DicePool = {
  abilityDice: 3,
  proficiencyDice: 1,
  difficultyDice: 2,
};

console.log("\n--- Sharpshooter with Superior Weapon ---");
const sharpshooterConfig: SimulationConfig = {
  dicePool: combatPool,
  iterations: ITERATIONS,
  modifiers: {
    automaticSuccesses: 1, // Sharpshooter talent
    automaticAdvantages: 1, // Superior weapon
  },
};
const sharpshooterSim = new MonteCarlo(sharpshooterConfig);
const sharpshooterResults = sharpshooterSim.simulate();
displayResults("Sharpshooter Attack", sharpshooterResults, true);

// Example 2: Adversary 2 Target
console.log("\n--- Combat vs Adversary 2 ---");
const adversaryConfig: SimulationConfig = {
  dicePool: combatPool,
  iterations: ITERATIONS,
  oppositionModifiers: {
    upgradeDifficulty: 2, // Adversary 2
  },
};
const adversarySim = new MonteCarlo(adversaryConfig);
const adversaryResults = adversarySim.simulate();
displayResults("vs Adversary 2", adversaryResults, true);

// Example 3: Full Combat Scenario - Sharpshooter with Superior vs Adversary 2
console.log("\n--- Full Combat Scenario ---");
const fullCombatConfig: SimulationConfig = {
  dicePool: combatPool,
  iterations: ITERATIONS,
  playerModifiers: {
    automaticSuccesses: 1, // Sharpshooter
    automaticAdvantages: 1, // Superior weapon
    upgradeAbility: 1, // Aim maneuver
  },
  oppositionModifiers: {
    upgradeDifficulty: 2, // Adversary 2
  },
};
const fullCombatSim = new MonteCarlo(fullCombatConfig);
const fullCombatResults = fullCombatSim.simulate();
displayResults(
  "Full Combat (Sharpshooter + Aim vs Adversary 2)",
  fullCombatResults,
  true,
);

// Example 4: Comparison - With and Without Modifiers
console.log("\n==================================================");
console.log("COMPARISON: WITH AND WITHOUT MODIFIERS");
console.log("==================================================");

const baseSimulation = new MonteCarlo(combatPool, ITERATIONS);
const modifiers: ModifierConfig = {
  automaticSuccesses: 1,
  automaticAdvantages: 2,
  upgradeAbility: 1,
};

const comparison = baseSimulation.compareWithAndWithoutModifiers(modifiers);

console.log("\n--- Base Roll (No Modifiers) ---");
displayResults("Base", comparison.base);

console.log("\n--- Modified Roll ---");
displayResults("Modified", comparison.modified, true);

console.log("\n--- Improvement Analysis ---");
console.log(
  "Success Probability Change: " +
    (comparison.improvement.successProbabilityDelta > 0 ? "+" : "") +
    (comparison.improvement.successProbabilityDelta * 100).toFixed(1) +
    "%",
);
console.log(
  "Average Successes Change: " +
    (comparison.improvement.averageSuccessesDelta > 0 ? "+" : "") +
    comparison.improvement.averageSuccessesDelta.toFixed(2),
);
console.log(
  "Average Advantages Change: " +
    (comparison.improvement.averageAdvantagesDelta > 0 ? "+" : "") +
    comparison.improvement.averageAdvantagesDelta.toFixed(2),
);
console.log(
  "Critical Success Probability Change: " +
    (comparison.improvement.criticalSuccessProbabilityDelta > 0 ? "+" : "") +
    (comparison.improvement.criticalSuccessProbabilityDelta * 100).toFixed(1) +
    "%",
);

// Example 5: Using specialized methods
console.log("\n==================================================");
console.log("SPECIALIZED SIMULATION METHODS");
console.log("==================================================");

const specializedPool: DicePool = {
  abilityDice: 2,
  proficiencyDice: 2,
  difficultyDice: 2,
};

const specializedSim = new MonteCarlo(specializedPool, ITERATIONS);

// Simulate different scenarios
console.log("\n--- Adversary Talent Simulation ---");
const adversary1 = specializedSim.simulateAdversary(1);
const adversary2 = specializedSim.simulateAdversary(2);
const adversary3 = specializedSim.simulateAdversary(3);

console.log("Success probability vs:");
console.log(
  `  No Adversary: ${(specializedSim.simulate().successProbability * 100).toFixed(1)}%`,
);
console.log(
  `  Adversary 1: ${(adversary1.successProbability * 100).toFixed(1)}%`,
);
console.log(
  `  Adversary 2: ${(adversary2.successProbability * 100).toFixed(1)}%`,
);
console.log(
  `  Adversary 3: ${(adversary3.successProbability * 100).toFixed(1)}%`,
);

console.log("\n--- Aimed Attack Simulation ---");
const aim1 = specializedSim.simulateAimedAttack(1);
const aim2 = specializedSim.simulateAimedAttack(2);

console.log("Success probability with:");
console.log(
  `  No Aim: ${(specializedSim.simulate().successProbability * 100).toFixed(1)}%`,
);
console.log(`  1 Aim: ${(aim1.successProbability * 100).toFixed(1)}%`);
console.log(`  2 Aims: ${(aim2.successProbability * 100).toFixed(1)}%`);

console.log("\n--- Combat Scenario Simulation ---");
const scenarios = [
  { sharpshooter: 0, superior: false, adversary: 0, name: "Basic Attack" },
  { sharpshooter: 1, superior: false, adversary: 0, name: "Sharpshooter" },
  { sharpshooter: 0, superior: true, adversary: 0, name: "Superior Weapon" },
  {
    sharpshooter: 1,
    superior: true,
    adversary: 0,
    name: "Sharpshooter + Superior",
  },
  {
    sharpshooter: 1,
    superior: true,
    adversary: 2,
    name: "Sharpshooter + Superior vs Adversary 2",
  },
];

scenarios.forEach((scenario) => {
  const result = specializedSim.simulateCombatScenario(
    scenario.sharpshooter,
    scenario.superior,
    scenario.adversary,
  );
  console.log(`${scenario.name}:`);
  console.log(`  Success: ${(result.successProbability * 100).toFixed(1)}%`);
  console.log(`  Avg Successes: ${result.averages.successes.toFixed(2)}`);
  console.log(`  Avg Advantages: ${result.averages.advantages.toFixed(2)}`);
});

console.log("\n==================================================");
console.log("Simulation Complete!");
console.log("==================================================");
