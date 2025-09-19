import { DicePool, roll } from "@swrpg-online/dice";

// Test what the dice library returns for automatic despairs
const poolWithDespair: DicePool = {
  abilityDice: 1,
  automaticDespairs: 1,
};

const poolWithFailure: DicePool = {
  abilityDice: 1,
  automaticFailures: 1,
};

console.log("Testing dice library behavior:");
console.log("\nPool with automatic despair:");
for (let i = 0; i < 5; i++) {
  const result = roll(poolWithDespair);
  console.log(`Roll ${i + 1}:`, result.summary);
}

console.log("\nPool with automatic failure:");
for (let i = 0; i < 5; i++) {
  const result = roll(poolWithFailure);
  console.log(`Roll ${i + 1}:`, result.summary);
}
