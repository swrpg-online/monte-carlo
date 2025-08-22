// Test script to verify the bundled package works without dependencies
const { MonteCarlo } = require('./dist/index.js');

console.log('Testing bundled package...\n');

// Create a new MonteCarlo instance with correct property names
const mc = new MonteCarlo({
  abilityDice: 2,
  proficiencyDice: 1,
  difficultyDice: 2,
  challengeDice: 1
}, 1000);

// Run the simulation
const results = mc.simulate();

console.log('✅ MonteCarlo instance created successfully');
console.log('✅ Simulation ran successfully');
console.log('\nSample results:');
console.log('- Success Probability:', (results.successProbability * 100).toFixed(2) + '%');
console.log('- Average Success:', results.averages.successes.toFixed(2));
console.log('- Average Advantage:', results.averages.advantages.toFixed(2));
console.log('\nThe bundled package works correctly without requiring @swrpg-online/dice to be installed!');