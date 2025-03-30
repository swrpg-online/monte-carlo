# Histogram Analysis Specification

## Overview

The histogram analysis feature extends the Monte Carlo simulation to provide detailed distribution data for visualization purposes. This is particularly useful for understanding the shape of the distribution and identifying patterns that may not be apparent from summary statistics alone.

## Core Features

### Input Parameters

- Uses existing Monte Carlo simulation parameters
- No additional input parameters required
- Optional `runSimulate` parameter in constructor to control automatic simulation

### Output Results

```typescript
interface HistogramData {
  netSuccesses: {
    [key: number]: number; // key: net successes, value: count
  };
  netAdvantages: {
    [key: number]: number; // key: net advantages, value: count
  };
  triumphs: {
    [key: number]: number; // key: number of triumphs, value: count
  };
  despairs: {
    [key: number]: number; // key: number of despairs, value: count
  };
  lightSide: {
    [key: number]: number; // key: number of light side, value: count
  };
  darkSide: {
    [key: number]: number; // key: number of dark side, value: count
  };
}

interface DistributionAnalysis {
  skewness: number; // Measures distribution asymmetry
  kurtosis: number; // Measures distribution "tailedness"
  outliers: number[]; // Values more than 2 standard deviations from mean
  modes: number[]; // Most common values
  percentiles: {
    // Value thresholds for different percentiles
    [key: number]: number; // key: percentile (0-100), value: threshold
  };
}

interface MonteCarloResult {
  // ... existing fields ...
  histogram: HistogramData;
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

## Implementation Details

### Data Collection

1. During simulation:

   - Track each roll's results in the histogram data structure
   - Calculate net values (successes - failures, advantages - threats)
   - Count occurrences of each value
   - Maintain running statistics for efficient calculation
   - Update histograms with direct array access
   - Use selector-based caching for statistical calculations

2. Memory Considerations:
   - Use sparse object storage for efficiency
   - Only store non-zero counts
   - Clear intermediate data after final calculations
   - Implement caching for frequently accessed calculations
   - Use running statistics to avoid storing all results
   - Cache selector-based calculations with prefixed keys

### Performance Optimization

1. Single-pass Collection:

   - Collect histogram data during simulation
   - Calculate probabilities during the main simulation loop
   - Avoid post-processing of results
   - Maintain running counts for all metrics
   - Use running statistics for averages and standard deviations
   - Cache selector-based calculations for reuse

2. Memory Management:

   - Use efficient histogram-based calculations instead of expanding to arrays
   - Cache statistical calculations to avoid redundant computations
   - Clear cache between simulations
   - Minimize temporary array allocations
   - Avoid storing individual roll results
   - Use direct array access for histogram updates
   - Implement prefixed cache keys for better organization

3. Statistical Optimizations:
   - Calculate mean and variance in a single pass using running statistics
   - Work directly with frequency data for higher moments
   - Cache selector-based calculations (averages, standard deviations)
   - Optimize histogram-based calculations for large datasets
   - Use running sums for efficient standard deviation calculation
   - Implement selector-based caching for improved performance

### Distribution Analysis

1. Histogram Statistics:

   - Single-pass calculation of basic statistics (mean, variance)
   - Direct computation from frequency data
   - Efficient handling of large datasets
   - Prevention of floating-point errors
   - Use running statistics for improved accuracy
   - Cache selector-based calculations

2. Skewness Calculation:

   - Direct calculation from histogram frequencies
   - Optimized for sparse data
   - Handles zero standard deviation cases
   - Uses frequency-weighted calculations
   - Caches results for reuse

3. Kurtosis Calculation:

   - Efficient computation using histogram data
   - Frequency-weighted fourth moment calculation
   - Handles zero standard deviation cases
   - Returns excess kurtosis (normal distribution = 0)
   - Caches results for reuse

4. Outlier Detection:

   - Uses 2 standard deviations threshold
   - Direct calculation from histogram entries
   - Memory-efficient implementation
   - No array expansion required
   - Caches results for reuse

5. Mode Calculation:

   - Efficient maximum frequency detection
   - Handles multiple modes
   - Works directly with histogram data
   - Memory-efficient implementation
   - Caches results for reuse

6. Percentile Calculation:
   - Sorted entry processing
   - Efficient running count maintenance
   - Handles specific target percentiles (25th, 50th, 75th, 90th)
   - Memory-efficient implementation
   - Caches results for reuse

## Usage Examples

```typescript
const simulation = new MonteCarlo(dicePool, 10000, false); // Optional: disable automatic simulation
const result = simulation.simulate();

// Access histogram data
const netSuccesses = result.histogram.netSuccesses;
const netAdvantages = result.histogram.netAdvantages;

// Access distribution analysis
const successAnalysis = result.analysis.netSuccesses;
console.log(`Distribution skewness: ${successAnalysis.skewness}`);
console.log(`Distribution kurtosis: ${successAnalysis.kurtosis}`);
console.log(`Most common values: ${successAnalysis.modes.join(", ")}`);
console.log(`Outliers: ${successAnalysis.outliers.join(", ")}`);

// Access percentiles
const median = successAnalysis.percentiles[50];
const upperQuartile = successAnalysis.percentiles[75];
```

## Testing Requirements

1. **Unit Tests**

   - Verify correct counting of occurrences
   - Test edge cases (all zeros, all maximums)
   - Validate histogram structure
   - Check memory cleanup
   - Verify distribution analysis calculations
   - Test outlier detection accuracy
   - Validate percentile calculations
   - Test caching mechanism
   - Verify statistical optimizations
   - Test running statistics accuracy
   - Validate memory efficiency
   - Test selector-based caching
   - Verify cache key prefixes
   - Test cache misses and hits

2. **Integration Tests**

   - Verify histogram data with simulation results
   - Test with various dice pool combinations
   - Validate performance with large iterations
   - Check analysis consistency across different pools
   - Verify analysis matches expected distributions
   - Test memory usage with large datasets
   - Validate cache behavior
   - Test running statistics consistency
   - Verify selector-based caching
   - Test cache key prefixes

3. **Edge Cases**

   - Empty dice pools
   - Single die rolls
   - Maximum possible values
   - Negative net results
   - Zero standard deviation
   - Single value distributions
   - Bimodal distributions
   - Large iteration counts
   - Complex dice pools
   - Memory pressure scenarios
   - Cache misses with valid selectors
   - Unknown selector types
   - Empty histograms
   - Incomplete percentile data

4. **Performance Tests**
   - Measure execution time for different pool sizes
   - Monitor memory usage patterns
   - Validate cache hit rates
   - Test scaling with iteration count
   - Compare optimized vs. unoptimized paths
   - Test memory efficiency with large datasets
   - Validate running statistics performance
   - Measure histogram update efficiency
   - Test selector-based caching performance
   - Verify cache key prefix efficiency

## Future Enhancements

1. **Visualization Helpers**

   - Built-in plotting functions
   - Export to common formats
   - Interactive visualization options
   - Real-time histogram updates

2. **Performance Optimizations**

   - WebWorker support for parallel processing
   - Streaming results for large simulations
   - Progressive updates for long-running simulations
   - SIMD operations for statistical calculations
   - WebAssembly implementation for core calculations
   - Further memory optimizations
   - Enhanced caching strategies
   - Improved selector-based caching
   - Dynamic cache key prefixing

3. **Additional Analysis Features**
   - Confidence intervals
   - Distribution fitting
   - Trend analysis
   - Comparative analysis between pools
   - Advanced statistical measures
   - Custom percentile configurations
   - Distribution shape classification
   - Enhanced selector support
   - Custom cache key formats
