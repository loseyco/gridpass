export const PRICING_CONSTANTS = {
    // Phase 1: "Micro-Entry" (Spots 1-25)
    // Goal: $2 -> $50
    PHASE_1_LIMIT: 25,
    PHASE_1_INCREMENT: 2,

    // Phase 2: "The Climb" (Spots 26-50)
    // Goal: $50 -> $500
    // Range: 25 spots. Delta: $450. Increment: $18
    PHASE_2_LIMIT: 50,
    PHASE_2_INCREMENT: 18,

    // Phase 3: "Scarcity" (Spots 51-100)
    // Goal: $500 -> $1500
    // Range: 50 spots. Delta: $1000. Increment: $20
    PHASE_3_LIMIT: 100,
    PHASE_3_INCREMENT: 20,

    TOTAL_SPOTS: 100,
    BASE_PRICE: 38 // Starting at $40 for Spot #1 (38 + 2)
};

export function calculateFounderPrice(soldCount: number): number {
    const currentSpotIndex = Math.min(Math.max(0, soldCount), PRICING_CONSTANTS.TOTAL_SPOTS - 1);
    const spotNumber = currentSpotIndex + 1;

    // Phase 1: 1-25
    if (spotNumber <= PRICING_CONSTANTS.PHASE_1_LIMIT) {
        return PRICING_CONSTANTS.BASE_PRICE + (spotNumber * PRICING_CONSTANTS.PHASE_1_INCREMENT);
    }

    // Phase 2: 26-50
    if (spotNumber <= PRICING_CONSTANTS.PHASE_2_LIMIT) {
        const phase1Max = PRICING_CONSTANTS.BASE_PRICE + (PRICING_CONSTANTS.PHASE_1_LIMIT * PRICING_CONSTANTS.PHASE_1_INCREMENT); // $88 (38 + 50)
        const spotsInPhase2 = spotNumber - PRICING_CONSTANTS.PHASE_1_LIMIT;
        return phase1Max + (spotsInPhase2 * PRICING_CONSTANTS.PHASE_2_INCREMENT);
    }

    // Phase 3: 51-100
    // Phase 3: 51-100
    const phase1Max = PRICING_CONSTANTS.BASE_PRICE + (PRICING_CONSTANTS.PHASE_1_LIMIT * PRICING_CONSTANTS.PHASE_1_INCREMENT); // $88
    const phase2Max = phase1Max + ((PRICING_CONSTANTS.PHASE_2_LIMIT - PRICING_CONSTANTS.PHASE_1_LIMIT) * PRICING_CONSTANTS.PHASE_2_INCREMENT); // $88 + 450 = $538

    const spotsInPhase3 = spotNumber - PRICING_CONSTANTS.PHASE_2_LIMIT;
    return phase2Max + (spotsInPhase3 * PRICING_CONSTANTS.PHASE_3_INCREMENT);
}

export function getNextPricePrediction(soldCount: number): number {
    return calculateFounderPrice(soldCount + 1);
}
