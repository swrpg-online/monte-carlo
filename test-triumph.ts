import { DicePool, roll } from "@swrpg-online/dice";

console.log("Testing if automatic triumphs include implicit success:");
console.log("=".repeat(60));

// Test 1: Automatic triumph
const poolWithTriumph: DicePool = {
  setBackDice: 1, // Only threats/failures possible, no successes
  automaticTriumphs: 1,
};

console.log("\nPool: 1 setback die + 1 automatic triumph");
console.log("Expected: Should have at least 1 success (from triumph)");
console.log("\nActual results (5 rolls):");
for (let i = 0; i < 5; i++) {
  const result = roll(poolWithTriumph);
  console.log(
    `Roll ${i + 1}: Successes=${result.summary.successes}, Failures=${result.summary.failures}, Triumphs=${result.summary.triumphs}`,
  );
}

// Test 2: Automatic success vs automatic triumph
const poolWithSuccess: DicePool = {
  setBackDice: 1,
  automaticSuccesses: 1,
};

console.log("\n" + "=".repeat(60));
console.log("\nComparison Test:");
console.log("\nPool A: 1 setback die + 1 automatic success");
for (let i = 0; i < 3; i++) {
  const result = roll(poolWithSuccess);
  console.log(
    `Roll ${i + 1}: Successes=${result.summary.successes}, Triumphs=${result.summary.triumphs}`,
  );
}

console.log("\nPool B: 1 setback die + 1 automatic triumph");
console.log("(Should have same or MORE successes than Pool A)");
for (let i = 0; i < 3; i++) {
  const result = roll(poolWithTriumph);
  console.log(
    `Roll ${i + 1}: Successes=${result.summary.successes}, Triumphs=${result.summary.triumphs}`,
  );
}

// Test 3: Check face values on proficiency die
console.log("\n" + "=".repeat(60));
console.log("\nReference: Proficiency die face 12 (triumph face):");
console.log("According to rules, should have: triumph + success");
console.log("Let's check what rolling a proficiency die gives us...");

const poolProficiency: DicePool = {
  proficiencyDice: 1,
};

let triumphCount = 0;
let successOnTriumph = 0;
for (let i = 0; i < 1000; i++) {
  const result = roll(poolProficiency);
  if (result.summary.triumphs > 0) {
    triumphCount++;
    if (result.summary.successes > 0) {
      successOnTriumph++;
    }
  }
}

console.log(`\nOut of ${triumphCount} triumph rolls:`);
console.log(
  `- ${successOnTriumph} also had success (${((successOnTriumph / triumphCount) * 100).toFixed(1)}%)`,
);
console.log("(Should be 100% if triumph face includes success)");
