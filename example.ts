import { DicePool } from "@swrpg-online/dice";
import { MonteCarlo } from "./src/MonteCarlo";

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

// Run simulations for each pool
pools.forEach(({ name, pool }) => {
  console.log(`\n=== ${name} ===`);
  try {
    console.log("\nDice Pool:");
    Object.entries(pool).forEach(([diceType, count]) => {
      if (count > 0) {
        console.log(`${diceType}: ${count}`);
      }
    });

    const simulation = new MonteCarlo(pool);
    const results = simulation.simulate();
    console.log(JSON.stringify(results, null, 2));

    console.log("\nProbabilities:");
    console.log(
      "Success:",
      (results.successProbability * 100).toFixed(1) + "%",
    );
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
    Object.entries(results.averages).forEach(([key, value]) => {
      console.log(`${key}: ${value.toFixed(2)}`);
    });

    console.log("\nStandard Deviations:");
    Object.entries(results.standardDeviations).forEach(([key, value]) => {
      console.log(`${key}: ${value.toFixed(2)}`);
    });
  } catch (error) {
    console.error(
      `Error with ${name}:`,
      error instanceof Error ? error.message : error,
    );
  }
});
