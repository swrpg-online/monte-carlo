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

const ITERATIONS = 10000; // Default number of iterations

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

    const simulation = new MonteCarlo(pool, ITERATIONS);
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
      if (typeof value === "number") {
        console.log(`${key}: ${value.toFixed(2)}`);
      }
    });

    console.log("\nStandard Deviations:");
    Object.entries(results.standardDeviations).forEach(([key, value]) => {
      if (typeof value === "number") {
        console.log(`${key}: ${value.toFixed(2)}`);
      }
    });

    console.log("\nHistogram Data:");
    console.log("Net Successes Distribution:");
    Object.entries(results.histogram.netSuccesses)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([value, count]) => {
        console.log(
          `${value}: ${count} (${((count / ITERATIONS) * 100).toFixed(1)}%)`,
        );
      });

    console.log("\nNet Advantages Distribution:");
    Object.entries(results.histogram.netAdvantages)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([value, count]) => {
        console.log(
          `${value}: ${count} (${((count / ITERATIONS) * 100).toFixed(1)}%)`,
        );
      });

    if (pool.forceDice && pool.forceDice > 0) {
      console.log("\nForce Points Distribution:");
      console.log("Light Side:");
      Object.entries(results.histogram.lightSide)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([value, count]) => {
          console.log(
            `${value}: ${count} (${((count / ITERATIONS) * 100).toFixed(1)}%)`,
          );
        });
      console.log("Dark Side:");
      Object.entries(results.histogram.darkSide)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([value, count]) => {
          console.log(
            `${value}: ${count} (${((count / ITERATIONS) * 100).toFixed(1)}%)`,
          );
        });
    }

    console.log("\nDistribution Analysis:");
    console.log("Net Successes:");
    console.log(
      `  Skewness: ${results.analysis.netSuccesses.skewness.toFixed(3)}`,
    );
    console.log(
      `  Kurtosis: ${results.analysis.netSuccesses.kurtosis.toFixed(3)}`,
    );
    console.log(`  Modes: ${results.analysis.netSuccesses.modes.join(", ")}`);
    if (results.analysis.netSuccesses.outliers.length > 0) {
      console.log(
        `  Outliers: ${results.analysis.netSuccesses.outliers.join(", ")}`,
      );
    }
    console.log("  Key Percentiles:");
    [25, 50, 75, 90].forEach((p) => {
      if (results.analysis.netSuccesses.percentiles[p] !== undefined) {
        console.log(
          `    ${p}th: ${results.analysis.netSuccesses.percentiles[p]}`,
        );
      }
    });

    console.log("\nNet Advantages:");
    console.log(
      `  Skewness: ${results.analysis.netAdvantages.skewness.toFixed(3)}`,
    );
    console.log(
      `  Kurtosis: ${results.analysis.netAdvantages.kurtosis.toFixed(3)}`,
    );
    console.log(`  Modes: ${results.analysis.netAdvantages.modes.join(", ")}`);
    if (results.analysis.netAdvantages.outliers.length > 0) {
      console.log(
        `  Outliers: ${results.analysis.netAdvantages.outliers.join(", ")}`,
      );
    }
    console.log("  Key Percentiles:");
    [25, 50, 75, 90].forEach((p) => {
      if (results.analysis.netAdvantages.percentiles[p] !== undefined) {
        console.log(
          `    ${p}th: ${results.analysis.netAdvantages.percentiles[p]}`,
        );
      }
    });

    if (pool.forceDice && pool.forceDice > 0) {
      console.log("\nForce Points Analysis:");
      console.log("Light Side:");
      console.log(
        `  Skewness: ${results.analysis.lightSide.skewness.toFixed(3)}`,
      );
      console.log(
        `  Kurtosis: ${results.analysis.lightSide.kurtosis.toFixed(3)}`,
      );
      console.log(`  Modes: ${results.analysis.lightSide.modes.join(", ")}`);
      if (results.analysis.lightSide.outliers.length > 0) {
        console.log(
          `  Outliers: ${results.analysis.lightSide.outliers.join(", ")}`,
        );
      }
      console.log("  Key Percentiles:");
      [25, 50, 75, 90].forEach((p) => {
        if (results.analysis.lightSide.percentiles[p] !== undefined) {
          console.log(
            `    ${p}th: ${results.analysis.lightSide.percentiles[p]}`,
          );
        }
      });

      console.log("\nDark Side:");
      console.log(
        `  Skewness: ${results.analysis.darkSide.skewness.toFixed(3)}`,
      );
      console.log(
        `  Kurtosis: ${results.analysis.darkSide.kurtosis.toFixed(3)}`,
      );
      console.log(`  Modes: ${results.analysis.darkSide.modes.join(", ")}`);
      if (results.analysis.darkSide.outliers.length > 0) {
        console.log(
          `  Outliers: ${results.analysis.darkSide.outliers.join(", ")}`,
        );
      }
      console.log("  Key Percentiles:");
      [25, 50, 75, 90].forEach((p) => {
        if (results.analysis.darkSide.percentiles[p] !== undefined) {
          console.log(
            `    ${p}th: ${results.analysis.darkSide.percentiles[p]}`,
          );
        }
      });
    }
  } catch (error) {
    console.error(
      `Error with ${name}:`,
      error instanceof Error ? error.message : error,
    );
  }
});
