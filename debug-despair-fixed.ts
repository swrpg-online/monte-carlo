import { DicePool, roll } from "@swrpg-online/dice";

// Test what happens after our fix
const poolWithDespairFixed: DicePool = {
  abilityDice: 1,
  automaticDespairs: 1,
  automaticFailures: 1, // Our fix adds this
};

const poolWithFailure: DicePool = {
  abilityDice: 1,
  automaticFailures: 1,
};

console.log("Testing dice library behavior with our fix:");
console.log("\nPool with automatic despair (and added failure):");
for (let i = 0; i < 5; i++) {
  const result = roll(poolWithDespairFixed);
  console.log(`Roll ${i + 1}:`, result.summary);
}

console.log("\nPool with automatic failure:");
for (let i = 0; i < 5; i++) {
  const result = roll(poolWithFailure);
  console.log(`Roll ${i + 1}:`, result.summary);
}
