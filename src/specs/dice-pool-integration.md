# Dice Pool Integration Specification

## Overview

Integration with the `@swrpg-online/dice` package for handling Star Wars RPG dice pools and roll results.

## Dependencies

- `@swrpg-online/dice`: Primary package for dice pool management and rolling
- Version: Latest stable release

## API Integration

### DicePool Interface

```typescript
interface DicePool {
  abilityDice?: number;
  proficiencyDice?: number;
  boostDice?: number;
  setbackDice?: number;
  difficultyDice?: number;
  challengeDice?: number;
  forceDice?: number;
}
```

### Roll Result Interface

```typescript
interface DiceResult {
  successes: number;
  failures: number;
  advantages: number;
  threats: number;
  triumphs: number;
  despair: number;
  lightSide: number;
  darkSide: number;
  hints?: string[];
}
```

## Integration Points

### Dice Pool Creation

1. Accept dice pool configuration from user
2. Validate dice counts are non-negative
3. Create DicePool object with specified dice

### Roll Execution

1. Use `roll` function from `@swrpg-online/dice`
2. Handle roll results and extract relevant data
3. Transform results into our internal format

### Result Mapping

```typescript
// Transform from @swrpg-online/dice format to our format
interface InternalDiceResult {
  success: number; // from successes
  advantage: number; // from advantages
  triumph: number; // from triumphs
  failure: number; // from failures
  threat: number; // from threats
  despair: number; // from despair
}
```

## Error Handling

### Input Validation

- Verify all dice counts are non-negative integers
- Ensure dice pool is not empty
- Validate total dice count is reasonable

### Runtime Errors

- Handle potential errors from dice rolling
- Provide meaningful error messages
- Maintain consistent state on error

## Testing Requirements

### Integration Tests

1. Test dice pool creation with various configurations
2. Verify roll results match expected format
3. Test error handling and edge cases

### Mock Testing

1. Create mock dice rolling function for deterministic tests
2. Test statistical calculations with known inputs
3. Verify result transformations

## Usage Examples

### Basic Usage

```typescript
import { DicePool, roll } from "@swrpg-online/dice";

// Create a dice pool
const pool: DicePool = {
  abilityDice: 2,
  proficiencyDice: 1,
};

// Roll the dice
const result = roll(pool);

// Transform result
const internalResult = {
  success: result.summary.successes,
  advantage: result.summary.advantages,
  triumph: result.summary.triumphs,
  failure: result.summary.failures,
  threat: result.summary.threats,
  despair: result.summary.despair,
};
```

### Error Handling Example

```typescript
try {
  const result = roll(pool);
  // Process result
} catch (error) {
  console.error("Error rolling dice:", error);
  // Handle error appropriately
}
```

## Future Considerations

### Version Updates

- Monitor for API changes in `@swrpg-online/dice`
- Update result mapping as needed
- Maintain backward compatibility

### Performance

- Consider caching roll results
- Optimize result transformations
- Handle large numbers of rolls efficiently

### Feature Requests

- Support for custom dice types
- Extended result analysis
- Batch rolling capabilities
