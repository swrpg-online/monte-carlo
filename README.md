# @swrpg-online/monte-carlo

![npm version](https://img.shields.io/npm/v/@swrpg-online/monte-carlo)
![build](https://github.com/swrpg-online/monte-carlo/actions/workflows/release.yaml/badge.svg)
[![codecov](https://codecov.io/gh/swrpg-online/monte-carlo/graph/badge.svg?token=smDjxPWvG9)](https://codecov.io/gh/swrpg-online/monte-carlo)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

A utility library for Star Wars RPG by [Fantasy Flight Games](https://www.fantasyflightgames.com/en/starwarsrpg/) and [Edge Studio](https://www.edge-studio.net/categories-games/starwarsrpg/). Provides statistical analysis for the [narrative dice system](https://star-wars-rpg-ffg.fandom.com/wiki/Narrative_Dice).

## Installation

```bash
npm install @swrpg-online/monte-carlo
```

## Features

### Monte Carlo Simulation

The `MonteCarlo` class provides statistical analysis of dice pools through simulation. It helps to understand the probabilities and distributions of different outcomes.

```typescript
import { MonteCarlo, DicePool } from "@swrpg-online/monte-carlo";

// Create a dice pool
const pool: DicePool = {
  abilityDice: 2, // 2 green (Ability) dice
  proficiencyDice: 1, // 1 yellow (Proficiency) die
};

// Create a Monte Carlo simulation with 10000 iterations (default)
const simulation = new MonteCarlo(pool);
const results = simulation.simulate();

console.log("Success Probability:", results.successProbability);
console.log("Average Successes:", results.averages.success);
console.log(
  "Standard Deviation of Successes:",
  results.standardDeviations.success,
);
```

### Results Include

- **Averages**: Mean values for success, advantage, triumph, failure, threat, and despair
- **Medians**: Median values for all symbols
- **Standard Deviations**: Standard deviation for all symbols
- **Probabilities**:
  - Success probability (net successes > 0)
  - Critical success probability (at least one triumph)
  - Critical failure probability (at least one despair)
  - Net positive probability (both net successes and net advantages > 0)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build
```

## Use Cases

### Basic Combat Check

```typescript
import { DicePool } from "@swrpg-online/dice";
import { MonteCarlo } from "@swrpg-online/monte-carlo";

// Combat check with 2 green (Ability) and 1 yellow (Proficiency)
const combatPool: DicePool = {
  abilityDice: 2,
  proficiencyDice: 2,
  difficultyDice: 2,
  challengeDice: 1,
};

const combatSim = new MonteCarlo(combatPool);
const combatResults = combatSim.simulate();

console.log("Combat Check Results:", JSON.stringify(combatResults, null, 2));
```

```JSON
{
  "averages": {
    "successes": 1.4205,
    "advantages": 2.5969,
    "triumphs": 0.1717,
    "failures": 0.3253,
    "threats": 2.1799,
    "despair": 0.0827,
    "lightSide": 0.0,
    "darkSide": 0.0
  },
  "medians": {
    "successes": 1,
    "advantages": 3,
    "triumphs": 0,
    "failures": 0,
    "threats": 2,
    "despair": 0,
    "lightSide": 0,
    "darkSide": 0
  },
  "standardDeviations": {
    "successes": 1.4573536804770009,
    "advantages": 1.4342978735255518,
    "triumphs": 0.396256369033995,
    "failures": 0.7638585667516965,
    "threats": 1.1950464384281536,
    "despair": 0.2754282302161655,
    "lightSide": 0.0,
    "darkSide": 0.0
  },
  "successProbability": 0.6273,
  "criticalSuccessProbability": 0.1643,
  "criticalFailureProbability": 0.0827,
  "netPositiveProbability": 0.219
}
```

### Statistical Analysis Features

The Monte Carlo simulation provides detailed statistical information:

1. **Basic Probabilities**

   - Success rate (net positive successes)
   - Triumph and Despair chances
   - Net positive results (both success and advantage)

2. **Detailed Statistics**
   - Mean values for all symbols
   - Median values for all symbols
   - Standard deviations

### How to Interpret Results

When analyzing your dice pool using the Monte Carlo simulation, here's how to interpret each result:

#### Probability Metrics

- **successProbability**: Represents the chance of achieving a net success (successes minus failures > 0). For example, a value of 0.65 means you have a 65% chance of succeeding at the task. In SWRPG terms, this is your chance of meeting or exceeding the difficulty of the check.

- **criticalSuccessProbability**: The chance of rolling at least one triumph (⊺). In SWRPG, triumphs can trigger powerful narrative effects or special abilities regardless of success/failure. A value of 0.167 means you have about a 1-in-6 chance of scoring a triumph.

- **criticalFailureProbability**: The chance of rolling at least one despair (⊝). Similar to triumphs, despairs can trigger significant negative narrative events. A probability of 0.083 indicates about a 1-in-12 chance of a despair occurring.

- **netPositiveProbability**: The likelihood of achieving both net successes and net advantages. This is particularly useful for social encounters or situations where both succeeding and gaining advantage are important. A value of 0.432 means you have a 43.2% chance of both succeeding and gaining advantage.

#### Statistical Measures

- **averages**: The expected number of each symbol you'll get on average:

  - A successes average of 1.5 means you typically get 1-2 successes
  - An advantages average of 0.8 means you usually get about 1 advantage
  - Triumphs/Despair averages are typically low (e.g., 0.083 = 1 triumph per 12 rolls)
  - Light/Dark side averages are typically 0 unless using Force dice

- **medians**: The middle value when all results are sorted. Useful for understanding the "typical" roll:

  - If different from the average, indicates skewed results
  - More resistant to extreme rolls than averages
  - Helps understand what a "normal" roll looks like

- **standardDeviations**: Measures how much variation exists from the average:
  - Lower values (e.g., 0.5) indicate consistent results
  - Higher values (e.g., 1.5) indicate more volatile/swingy rolls
  - About 68% of rolls fall within ±1 standard deviation of the average
  - About 95% of rolls fall within ±2 standard deviations

For example, if you have:

```typescript
{
  averages: { successes: 2.0, advantages: 1.5 },
  standardDeviations: { successes: 1.2, advantages: 1.1 }
}
```

This means:

- You typically get 2 successes, but about 68% of rolls will give you 0.8 to 3.2 successes
- You usually get 1-2 advantages, with 68% of rolls giving you 0.4 to 2.6 advantages
- The relatively high standard deviations suggest significant roll-to-roll variation

### Performance Considerations

- Default 10,000 iterations provide a good balance of accuracy and speed
- Increase iterations for more precise probability calculations:

  ```typescript
  const preciseSim = new MonteCarlo(pool, 100000);
  ```

### Available Statistics

The `simulate()` method returns a `MonteCarloResult` with the following information:

```typescript
interface MonteCarloResult {
  // Mean values for each symbol
  averages: {
    successes: number;
    advantages: number;
    triumphs: number;
    failures: number;
    threats: number;
    despair: number;
    lightSide: number;
    darkSide: number;
  };

  // Median values for each symbol
  medians: {
    successes: number;
    advantages: number;
    triumphs: number;
    failures: number;
    threats: number;
    despair: number;
    lightSide: number;
    darkSide: number;
  };

  // Standard deviations for each symbol
  standardDeviations: {
    successes: number;
    advantages: number;
    triumphs: number;
    failures: number;
    threats: number;
    despair: number;
    lightSide: number;
    darkSide: number;
  };

  // Probability of net successes > 0
  successProbability: number;

  // Probability of at least one triumph
  criticalSuccessProbability: number;

  // Probability of at least one despair
  criticalFailureProbability: number;

  // Probability of both net successes and net advantages > 0
  netPositiveProbability: number;

  // Histogram data for distribution analysis
  histogram: HistogramData;

  // Detailed analysis of distributions
  analysis: {
    netSuccesses: DistributionAnalysis;
    netAdvantages: DistributionAnalysis;
    triumphs: DistributionAnalysis;
    despairs: DistributionAnalysis;
    lightSide: DistributionAnalysis;
    darkSide: DistributionAnalysis;
  };
}
```

### Histogram Analysis

The Monte Carlo simulation now includes detailed distribution analysis through histograms. This feature helps you understand not just the averages and probabilities, but the entire shape and pattern of possible outcomes.

#### Histogram Data

The histogram data shows the frequency of each possible outcome:

```typescript
const simulation = new MonteCarlo(pool);
const results = simulation.simulate();

// Access histogram data
console.log("Net Successes Distribution:", results.histogram.netSuccesses);
console.log("Net Advantages Distribution:", results.histogram.netAdvantages);

// Example output:
// Net Successes Distribution: { "-1": 150, "0": 300, "1": 400, "2": 150 }
// This means:
// - 150 rolls had -1 net successes
// - 300 rolls had 0 net successes
// - 400 rolls had 1 net success
// - 150 rolls had 2 net successes
```

#### Distribution Analysis

Each distribution includes detailed statistical analysis:

```typescript
const successAnalysis = results.analysis.netSuccesses;

// Shape of the distribution
console.log("Skewness:", successAnalysis.skewness); // Positive = right-skewed, Negative = left-skewed
console.log("Kurtosis:", successAnalysis.kurtosis); // Positive = heavy tails, Negative = light tails

// Most common outcomes
console.log("Modes:", successAnalysis.modes); // Array of most frequent values

// Unusual results
console.log("Outliers:", successAnalysis.outliers); // Values > 2 standard deviations from mean

// Key percentiles
console.log("25th percentile:", successAnalysis.percentiles[25]); // 25% of rolls are below this
console.log("Median:", successAnalysis.percentiles[50]); // 50% of rolls are below this
console.log("75th percentile:", successAnalysis.percentiles[75]); // 75% of rolls are below this
console.log("90th percentile:", successAnalysis.percentiles[90]); // 90% of rolls are below this
```

#### How to Interpret Distribution Analysis

1. **Skewness**:

   - Positive: More extreme positive results than negative
   - Negative: More extreme negative results than positive
   - Near 0: Roughly symmetric distribution

2. **Kurtosis**:

   - Positive: More extreme results than a normal distribution
   - Negative: Fewer extreme results than a normal distribution
   - Near 0: Similar to a normal distribution

3. **Modes**:

   - Single mode: One clear "most common" result
   - Multiple modes: Several equally common results
   - Helps identify typical outcomes

4. **Outliers**:

   - Unusual or extreme results
   - More than 2 standard deviations from the mean
   - Useful for understanding rare outcomes

5. **Percentiles**:
   - 25th: "Worst quarter" threshold
   - 50th: Median result
   - 75th: "Best quarter" threshold
   - 90th: "Exceptional" threshold

#### Example Usage

```typescript
const pool: DicePool = {
  abilityDice: 2,
  proficiencyDice: 1,
  difficultyDice: 2,
};

const simulation = new MonteCarlo(pool);
const results = simulation.simulate();

// Analyze net successes distribution
const { netSuccesses } = results.analysis;

console.log("Distribution Shape:");
console.log(`- Skewness: ${netSuccesses.skewness.toFixed(2)}`);
console.log(`- Kurtosis: ${netSuccesses.kurtosis.toFixed(2)}`);

console.log("\nTypical Results:");
console.log(`- Most common outcomes: ${netSuccesses.modes.join(", ")}`);
console.log(
  `- Middle 50% range: ${netSuccesses.percentiles[25]} to ${netSuccesses.percentiles[75]}`,
);

console.log("\nUnusual Results:");
console.log(`- Outliers: ${netSuccesses.outliers.join(", ")}`);
console.log(
  `- 90th percentile (exceptional results): ${netSuccesses.percentiles[90]}`,
);

// Example output:
// Distribution Shape:
// - Skewness: 0.12 (slightly right-skewed)
// - Kurtosis: -0.20 (slightly lighter tails than normal)
//
// Typical Results:
// - Most common outcomes: 1
// - Middle 50% range: 0 to 2
//
// Unusual Results:
// - Outliers: -2, 4
// - 90th percentile (exceptional results): 3
```

### Error Handling

The `MonteCarlo` class includes built-in validation:

- Validates that the dice pool contains at least one die
- Ensures all die counts are non-negative integers
- Validates iteration count (minimum 100, maximum 1,000,000)

```typescript
try {
  const simulation = new MonteCarlo(pool);
  const results = simulation.simulate();
} catch (error) {
  if (error instanceof MonteCarloError) {
    console.error("Simulation error:", error.message);
  }
}
```

## License

MIT
