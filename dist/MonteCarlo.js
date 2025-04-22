"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonteCarlo = exports.MonteCarloError = void 0;
const dice_1 = require("@swrpg-online/dice");
class MonteCarloError extends Error {
    constructor(message) {
        super(message);
        this.name = "MonteCarloError";
    }
}
exports.MonteCarloError = MonteCarloError;
class MonteCarlo {
    constructor(dicePool, iterations = 10000, runSimulate = true) {
        this.histogram = {
            netSuccesses: {},
            netAdvantages: {},
            triumphs: {},
            despairs: {},
            lightSide: {},
            darkSide: {},
        };
        this.statsCache = new Map();
        this.runningStats = {
            successCount: 0,
            criticalSuccessCount: 0,
            criticalFailureCount: 0,
            netPositiveCount: 0,
            sumSuccesses: 0,
            sumAdvantages: 0,
            sumTriumphs: 0,
            sumFailures: 0,
            sumThreats: 0,
            sumDespair: 0,
            sumLightSide: 0,
            sumDarkSide: 0,
            sumSquaredSuccesses: 0,
            sumSquaredAdvantages: 0,
            sumSquaredThreats: 0,
            sumSquaredFailures: 0,
            sumSquaredDespair: 0,
            sumSquaredLightSide: 0,
            sumSquaredDarkSide: 0,
            sumSquaredTriumphs: 0,
        };
        this.results = [];
        this.validateDicePool(dicePool);
        this.validateIterations(iterations);
        this.dicePool = dicePool;
        this.iterations = iterations;
        this.resetRunningStats();
        if (runSimulate) {
            this.simulate();
        }
    }
    validateDicePool(dicePool) {
        if (!dicePool || typeof dicePool !== "object") {
            throw new MonteCarloError("Invalid dice pool: must be a valid DicePool object");
        }
        const diceTypes = [
            "abilityDice",
            "proficiencyDice",
            "boostDice",
            "setBackDice",
            "difficultyDice",
            "challengeDice",
            "forceDice",
        ];
        // Check if at least one die type is present
        const hasAnyDice = diceTypes.some((type) => dicePool[type] &&
            dicePool[type] > 0);
        if (!hasAnyDice) {
            throw new MonteCarloError("Invalid dice pool: must contain at least one die");
        }
        // Validate each die count is non-negative
        diceTypes.forEach((type) => {
            const count = dicePool[type];
            if (count !== undefined && (count < 0 || !Number.isInteger(count))) {
                throw new MonteCarloError(`Invalid ${type}: must be a non-negative integer`);
            }
        });
    }
    validateIterations(iterations) {
        if (!Number.isInteger(iterations)) {
            throw new MonteCarloError("Iterations must be an integer");
        }
        if (iterations < MonteCarlo.MIN_ITERATIONS) {
            throw new MonteCarloError(`Iterations must be at least ${MonteCarlo.MIN_ITERATIONS}`);
        }
        if (iterations > MonteCarlo.MAX_ITERATIONS) {
            throw new MonteCarloError(`Iterations must not exceed ${MonteCarlo.MAX_ITERATIONS}`);
        }
    }
    calculateHistogramStats(histogram, totalCount) {
        let sum = 0;
        let sumSquares = 0;
        let count = 0;
        // Single pass to calculate sum and sum of squares
        for (const [value, freq] of Object.entries(histogram)) {
            const val = parseInt(value);
            sum += val * freq;
            sumSquares += val * val * freq;
            count += freq;
        }
        const mean = sum / count;
        const variance = sumSquares / count - mean * mean;
        const stdDev = Math.sqrt(Math.max(0, variance)); // Avoid negative values due to floating point errors
        return { mean, stdDev, sum, sumSquares };
    }
    calculateSkewness(histogram, stats) {
        if (stats.stdDev === 0)
            return 0;
        let sumCubedDeviations = 0;
        let totalCount = 0;
        for (const [value, freq] of Object.entries(histogram)) {
            const deviation = (parseInt(value) - stats.mean) / stats.stdDev;
            sumCubedDeviations += Math.pow(deviation, 3) * freq;
            totalCount += freq;
        }
        return sumCubedDeviations / totalCount;
    }
    calculateKurtosis(histogram, stats) {
        if (stats.stdDev === 0)
            return 0;
        let sumFourthPowerDeviations = 0;
        let totalCount = 0;
        for (const [value, freq] of Object.entries(histogram)) {
            const deviation = (parseInt(value) - stats.mean) / stats.stdDev;
            sumFourthPowerDeviations += Math.pow(deviation, 4) * freq;
            totalCount += freq;
        }
        return sumFourthPowerDeviations / totalCount - 3;
    }
    findOutliers(histogram, stats) {
        if (stats.stdDev === 0)
            return [];
        const threshold = 2;
        return Object.entries(histogram)
            .filter(([value]) => Math.abs(parseInt(value) - stats.mean) > threshold * stats.stdDev)
            .map(([value]) => parseInt(value));
    }
    analyzeDistribution(histogram, totalCount) {
        // Calculate basic statistics in a single pass
        const stats = this.calculateHistogramStats(histogram, totalCount);
        return {
            skewness: this.calculateSkewness(histogram, stats),
            kurtosis: this.calculateKurtosis(histogram, stats),
            outliers: this.findOutliers(histogram, stats),
            modes: this.findModes(histogram),
            percentiles: this.calculatePercentiles(histogram, totalCount),
        };
    }
    average(selector) {
        const selectorName = typeof selector === "function"
            ? selector.name || "custom"
            : selector.name;
        const cacheKey = `avg_${selectorName}`;
        if (this.statsCache.has(cacheKey)) {
            return this.statsCache.get(cacheKey);
        }
        let sum = 0;
        if (typeof selector === "function") {
            // For function selectors, calculate sum directly
            sum = this.results.reduce((acc, roll) => {
                const value = selector(roll);
                if (typeof value !== "number" || isNaN(value)) {
                    throw new MonteCarloError(`Invalid selector result: ${value}`);
                }
                return acc + value;
            }, 0);
        }
        else {
            // For named selectors, use running stats
            switch (selector.name) {
                case "successes":
                    sum = this.runningStats.sumSuccesses;
                    break;
                case "advantages":
                    sum = this.runningStats.sumAdvantages;
                    break;
                case "triumphs":
                    sum = this.runningStats.sumTriumphs;
                    break;
                case "failures":
                    sum = this.runningStats.sumFailures;
                    break;
                case "threats":
                    sum = this.runningStats.sumThreats;
                    break;
                case "despair":
                    sum = this.runningStats.sumDespair;
                    break;
                case "lightSide":
                    sum = this.runningStats.sumLightSide;
                    break;
                case "darkSide":
                    sum = this.runningStats.sumDarkSide;
                    break;
                default:
                    throw new MonteCarloError(`Unknown selector: ${selector.name}`);
            }
        }
        const avg = sum / this.iterations;
        this.statsCache.set(cacheKey, avg);
        return avg;
    }
    standardDeviation(selector) {
        const selectorName = typeof selector === "function"
            ? selector.name || "custom"
            : selector.name;
        const cacheKey = `std_${selectorName}`;
        if (this.statsCache.has(cacheKey)) {
            return this.statsCache.get(cacheKey);
        }
        const avg = this.average(selector);
        let squareSum = 0;
        if (typeof selector === "function") {
            // For function selectors, calculate square sum directly
            squareSum = this.results.reduce((acc, roll) => {
                const value = selector(roll);
                if (typeof value !== "number" || isNaN(value)) {
                    throw new MonteCarloError(`Invalid selector result: ${value}`);
                }
                return acc + value * value;
            }, 0);
        }
        else {
            // For named selectors, use running stats
            switch (selector.name) {
                case "successes":
                    squareSum = this.runningStats.sumSquaredSuccesses;
                    break;
                case "advantages":
                    squareSum = this.runningStats.sumSquaredAdvantages;
                    break;
                case "threats":
                    squareSum = this.runningStats.sumSquaredThreats;
                    break;
                case "triumphs":
                    squareSum = this.runningStats.sumSquaredTriumphs;
                    break;
                case "failures":
                    squareSum = this.runningStats.sumSquaredFailures;
                    break;
                case "despair":
                    squareSum = this.runningStats.sumSquaredDespair;
                    break;
                case "lightSide":
                    squareSum = this.runningStats.sumSquaredLightSide;
                    break;
                case "darkSide":
                    squareSum = this.runningStats.sumSquaredDarkSide;
                    break;
                default:
                    throw new MonteCarloError(`Unknown selector: ${selector.name}`);
            }
        }
        const stdDev = Math.sqrt(Math.abs(squareSum / this.iterations - avg * avg));
        this.statsCache.set(cacheKey, stdDev);
        return stdDev;
    }
    resetRunningStats() {
        this.runningStats = {
            successCount: 0,
            criticalSuccessCount: 0,
            criticalFailureCount: 0,
            netPositiveCount: 0,
            sumSuccesses: 0,
            sumAdvantages: 0,
            sumTriumphs: 0,
            sumFailures: 0,
            sumThreats: 0,
            sumDespair: 0,
            sumLightSide: 0,
            sumDarkSide: 0,
            sumSquaredSuccesses: 0,
            sumSquaredAdvantages: 0,
            sumSquaredThreats: 0,
            sumSquaredFailures: 0,
            sumSquaredDespair: 0,
            sumSquaredLightSide: 0,
            sumSquaredDarkSide: 0,
            sumSquaredTriumphs: 0,
        };
    }
    updateHistogram(result) {
        // Update net successes with direct array access
        const netSuccesses = result.successes - result.failures;
        this.histogram.netSuccesses[netSuccesses] =
            (this.histogram.netSuccesses[netSuccesses] || 0) + 1;
        // Update net advantages with direct array access
        const netAdvantages = result.advantages - result.threats;
        this.histogram.netAdvantages[netAdvantages] =
            (this.histogram.netAdvantages[netAdvantages] || 0) + 1;
        // Update other histograms with direct array access
        this.histogram.triumphs[result.triumphs] =
            (this.histogram.triumphs[result.triumphs] || 0) + 1;
        this.histogram.despairs[result.despair] =
            (this.histogram.despairs[result.despair] || 0) + 1;
        this.histogram.lightSide[result.lightSide] =
            (this.histogram.lightSide[result.lightSide] || 0) + 1;
        this.histogram.darkSide[result.darkSide] =
            (this.histogram.darkSide[result.darkSide] || 0) + 1;
        // Update running statistics
        this.runningStats.sumSuccesses += result.successes;
        this.runningStats.sumAdvantages += result.advantages;
        this.runningStats.sumTriumphs += result.triumphs;
        this.runningStats.sumFailures += result.failures;
        this.runningStats.sumThreats += result.threats;
        this.runningStats.sumDespair += result.despair;
        this.runningStats.sumLightSide += result.lightSide;
        this.runningStats.sumDarkSide += result.darkSide;
        this.runningStats.sumSquaredSuccesses +=
            result.successes * result.successes;
        this.runningStats.sumSquaredAdvantages +=
            result.advantages * result.advantages;
        this.runningStats.sumSquaredThreats += result.threats * result.threats;
        this.runningStats.sumSquaredFailures += result.failures * result.failures;
        this.runningStats.sumSquaredDespair += result.despair * result.despair;
        this.runningStats.sumSquaredLightSide +=
            result.lightSide * result.lightSide;
        this.runningStats.sumSquaredDarkSide += result.darkSide * result.darkSide;
        this.runningStats.sumSquaredTriumphs += result.triumphs * result.triumphs;
        if (netSuccesses > 0) {
            this.runningStats.successCount++;
            if (netAdvantages > 0) {
                this.runningStats.netPositiveCount++;
            }
        }
        if (result.triumphs > 0)
            this.runningStats.criticalSuccessCount++;
        if (result.despair > 0)
            this.runningStats.criticalFailureCount++;
    }
    simulate() {
        try {
            this.resetHistogram();
            this.resetRunningStats();
            this.statsCache.clear();
            this.results = [];
            // Run simulations and update histograms in a single pass
            for (let i = 0; i < this.iterations; i++) {
                const rollResult = (0, dice_1.roll)(this.dicePool);
                this.results.push(rollResult.summary);
                this.updateHistogram(rollResult.summary);
            }
            // Calculate probabilities using running statistics
            const successProbability = this.runningStats.successCount / this.iterations;
            const criticalSuccessProbability = this.runningStats.criticalSuccessCount / this.iterations;
            const criticalFailureProbability = this.runningStats.criticalFailureCount / this.iterations;
            const netPositiveProbability = this.runningStats.netPositiveCount / this.iterations;
            // Calculate averages using running statistics
            const averages = {
                successes: this.runningStats.sumSuccesses / this.iterations,
                advantages: this.runningStats.sumAdvantages / this.iterations,
                triumphs: this.runningStats.sumTriumphs / this.iterations,
                failures: this.runningStats.sumFailures / this.iterations,
                threats: this.runningStats.sumThreats / this.iterations,
                despair: this.runningStats.sumDespair / this.iterations,
                lightSide: this.runningStats.sumLightSide / this.iterations,
                darkSide: this.runningStats.sumDarkSide / this.iterations,
            };
            // Calculate standard deviations using running statistics
            const standardDeviations = {
                successes: Math.sqrt(this.runningStats.sumSquaredSuccesses / this.iterations -
                    averages.successes * averages.successes),
                advantages: Math.sqrt(this.runningStats.sumSquaredAdvantages / this.iterations -
                    averages.advantages * averages.advantages),
                triumphs: Math.sqrt(this.runningStats.sumSquaredTriumphs / this.iterations -
                    averages.triumphs * averages.triumphs),
                failures: Math.sqrt(this.runningStats.sumSquaredFailures / this.iterations -
                    averages.failures * averages.failures),
                threats: Math.sqrt(this.runningStats.sumSquaredThreats / this.iterations -
                    averages.threats * averages.threats),
                despair: Math.sqrt(this.runningStats.sumSquaredDespair / this.iterations -
                    averages.despair * averages.despair),
                lightSide: Math.sqrt(this.runningStats.sumSquaredLightSide / this.iterations -
                    averages.lightSide * averages.lightSide),
                darkSide: Math.sqrt(this.runningStats.sumSquaredDarkSide / this.iterations -
                    averages.darkSide * averages.darkSide),
            };
            // Calculate medians using histogram data
            const medians = {
                successes: this.calculateMedianFromHistogram(this.histogram.netSuccesses),
                advantages: this.calculateMedianFromHistogram(this.histogram.netAdvantages),
                triumphs: this.calculateMedianFromHistogram(this.histogram.triumphs),
                failures: this.calculateMedianFromHistogram(this.histogram.despairs),
                threats: this.calculateMedianFromHistogram(this.histogram.netAdvantages),
                despair: this.calculateMedianFromHistogram(this.histogram.despairs),
                lightSide: this.calculateMedianFromHistogram(this.histogram.lightSide),
                darkSide: this.calculateMedianFromHistogram(this.histogram.darkSide),
            };
            // Calculate analysis for each histogram category
            const analysis = {
                netSuccesses: this.analyzeDistribution(this.histogram.netSuccesses, this.iterations),
                netAdvantages: this.analyzeDistribution(this.histogram.netAdvantages, this.iterations),
                triumphs: this.analyzeDistribution(this.histogram.triumphs, this.iterations),
                despairs: this.analyzeDistribution(this.histogram.despairs, this.iterations),
                lightSide: this.analyzeDistribution(this.histogram.lightSide, this.iterations),
                darkSide: this.analyzeDistribution(this.histogram.darkSide, this.iterations),
            };
            return {
                averages,
                medians,
                standardDeviations,
                successProbability,
                criticalSuccessProbability,
                criticalFailureProbability,
                netPositiveProbability,
                histogram: this.histogram,
                analysis,
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new MonteCarloError(`Simulation failed: ${error.message}`);
            }
            throw new MonteCarloError("Simulation failed with unknown error");
        }
    }
    resetHistogram() {
        this.histogram = {
            netSuccesses: {},
            netAdvantages: {},
            triumphs: {},
            despairs: {},
            lightSide: {},
            darkSide: {},
        };
    }
    calculateMedianFromHistogram(histogram) {
        const entries = Object.entries(histogram)
            .map(([value, count]) => ({ value: parseInt(value), count }))
            .sort((a, b) => a.value - b.value);
        if (entries.length === 0) {
            return 0;
        }
        let runningCount = 0;
        const targetCount = this.iterations / 2;
        for (const { value, count } of entries) {
            runningCount += count;
            if (runningCount >= targetCount) {
                return value;
            }
        }
        return entries[entries.length - 1].value;
    }
    findModes(histogram) {
        const entries = Object.entries(histogram);
        if (entries.length === 0)
            return [];
        const maxCount = Math.max(...entries.map(([, count]) => count));
        return entries
            .filter(([, count]) => count === maxCount)
            .map(([value]) => parseInt(value));
    }
    calculatePercentiles(histogram, totalCount) {
        const sortedEntries = Object.entries(histogram)
            .map(([value, count]) => ({ value: parseInt(value), count }))
            .sort((a, b) => a.value - b.value);
        if (sortedEntries.length === 0) {
            return {};
        }
        const percentiles = {};
        let runningCount = 0;
        // Calculate percentiles at specific points
        const targetPercentiles = [25, 50, 75, 90];
        let currentTargetIndex = 0;
        // Find the value for each percentile
        for (const { value, count } of sortedEntries) {
            runningCount += count;
            const currentPercentile = (runningCount / totalCount) * 100;
            // Check if we've passed any target percentiles
            while (currentTargetIndex < targetPercentiles.length &&
                currentPercentile >= targetPercentiles[currentTargetIndex]) {
                percentiles[targetPercentiles[currentTargetIndex]] = value;
                currentTargetIndex++;
            }
        }
        // If we haven't reached all target percentiles, use the maximum value
        const maxValue = sortedEntries[sortedEntries.length - 1].value;
        while (currentTargetIndex < targetPercentiles.length) {
            percentiles[targetPercentiles[currentTargetIndex]] = maxValue;
            currentTargetIndex++;
        }
        return percentiles;
    }
}
exports.MonteCarlo = MonteCarlo;
MonteCarlo.MIN_ITERATIONS = 100;
MonteCarlo.MAX_ITERATIONS = 1000000;
