import { DicePool } from "@swrpg-online/dice";
import { DiceResult } from "@swrpg-online/dice/dist/types";
export { DicePool };
export interface ModifierConfig {
    automaticSuccesses?: number;
    automaticFailures?: number;
    automaticAdvantages?: number;
    automaticThreats?: number;
    automaticTriumphs?: number;
    automaticDespairs?: number;
    upgradeAbility?: number;
    upgradeDifficulty?: number;
    downgradeProficiency?: number;
    downgradeChallenge?: number;
}
export interface SimulationConfig {
    dicePool: DicePool;
    iterations?: number;
    modifiers?: ModifierConfig;
    playerModifiers?: ModifierConfig;
    oppositionModifiers?: ModifierConfig;
}
export interface ModifierAnalysis {
    automaticSymbolContribution: {
        successes: number;
        failures: number;
        advantages: number;
        threats: number;
        triumphs: number;
        despairs: number;
    };
    rolledSymbolContribution: {
        successes: number;
        failures: number;
        advantages: number;
        threats: number;
        triumphs: number;
        despairs: number;
    };
    upgradeImpact: {
        abilityUpgrades: number;
        difficultyUpgrades: number;
        proficiencyDowngrades: number;
        challengeDowngrades: number;
    };
}
export declare class MonteCarloError extends Error {
    constructor(message: string);
}
export interface HistogramData {
    netSuccesses: {
        [key: number]: number;
    };
    netAdvantages: {
        [key: number]: number;
    };
    triumphs: {
        [key: number]: number;
    };
    despairs: {
        [key: number]: number;
    };
    lightSide: {
        [key: number]: number;
    };
    darkSide: {
        [key: number]: number;
    };
}
export interface DistributionAnalysis {
    skewness: number;
    kurtosis: number;
    outliers: number[];
    modes: number[];
    percentiles: {
        [key: number]: number;
    };
}
export interface MonteCarloResult {
    averages: DiceResult;
    medians: DiceResult;
    standardDeviations: DiceResult;
    successProbability: number;
    criticalSuccessProbability: number;
    criticalFailureProbability: number;
    netPositiveProbability: number;
    histogram: HistogramData;
    analysis: {
        netSuccesses: DistributionAnalysis;
        netAdvantages: DistributionAnalysis;
        triumphs: DistributionAnalysis;
        despairs: DistributionAnalysis;
        lightSide: DistributionAnalysis;
        darkSide: DistributionAnalysis;
    };
    modifierAnalysis?: ModifierAnalysis;
}
export declare class MonteCarlo {
    private readonly dicePool;
    private readonly iterations;
    private readonly modifiers?;
    private readonly config?;
    private histogram;
    private static readonly MIN_ITERATIONS;
    private static readonly MAX_ITERATIONS;
    private statsCache;
    private modifierStats;
    private runningStats;
    private results;
    constructor(dicePoolOrConfig: DicePool | SimulationConfig, iterations?: number, runSimulate?: boolean);
    private isSimulationConfig;
    private mergeModifiers;
    private applyModifiers;
    private validateDicePool;
    private validateIterations;
    private calculateHistogramStats;
    private calculateSkewness;
    private calculateKurtosis;
    private findOutliers;
    private analyzeDistribution;
    private average;
    private standardDeviation;
    private resetRunningStats;
    private resetModifierStats;
    private trackModifierContribution;
    private updateHistogram;
    simulate(): MonteCarloResult;
    private resetHistogram;
    private calculateMedianFromHistogram;
    private findModes;
    private calculatePercentiles;
    /**
     * Simulate a roll with Adversary talent applied
     * @param adversaryRating The Adversary rating (typically 1-3)
     * @returns MonteCarloResult with Adversary upgrades applied
     */
    simulateAdversary(adversaryRating: number): MonteCarloResult;
    /**
     * Simulate an aimed attack with ability upgrades
     * @param aimCount Number of Aim maneuvers taken (typically 1-2)
     * @returns MonteCarloResult with Aim upgrades applied
     */
    simulateAimedAttack(aimCount: number): MonteCarloResult;
    /**
     * Simulate a roll with Superior weapon quality
     * @param superiorRating The Superior rating (typically 1)
     * @returns MonteCarloResult with automatic advantages applied
     */
    simulateSuperiorWeapon(superiorRating?: number): MonteCarloResult;
    /**
     * Simulate a roll with multiple talents/equipment modifiers
     * @param modifiers Combined modifiers from talents and equipment
     * @returns MonteCarloResult with all modifiers applied
     */
    simulateWithModifiers(modifiers: ModifierConfig): MonteCarloResult;
    /**
     * Compare results with and without modifiers
     * @param modifiers Modifiers to test
     * @returns Object containing base and modified results for comparison
     */
    compareWithAndWithoutModifiers(modifiers: ModifierConfig): {
        base: MonteCarloResult;
        modified: MonteCarloResult;
        improvement: {
            successProbabilityDelta: number;
            averageSuccessesDelta: number;
            averageAdvantagesDelta: number;
            criticalSuccessProbabilityDelta: number;
        };
    };
    /**
     * Simulate a Sharpshooter with Superior weapon vs Adversary
     * Common scenario in Star Wars RPG
     * @param sharpshooterRanks Ranks in Sharpshooter talent (typically 1-2)
     * @param weaponSuperior Whether weapon has Superior quality
     * @param adversaryRating Adversary rating of target (typically 0-3)
     * @returns MonteCarloResult with all modifiers applied
     */
    simulateCombatScenario(sharpshooterRanks?: number, weaponSuperior?: boolean, adversaryRating?: number): MonteCarloResult;
}
