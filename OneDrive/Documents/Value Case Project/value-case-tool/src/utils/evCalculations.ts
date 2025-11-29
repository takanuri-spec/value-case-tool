import type { Company } from '../types/finance';

/**
 * Calculate current EV/EBITDA Multiple from company data
 */
export const calculateCurrentEVEBITDAMultiple = (company: Company): number => {
    const latest = company.financials[0];

    // Calculate current EV
    const currentEV = company.marketCap +
        latest.interestBearingDebt -
        latest.cashAndEquivalents;

    // Calculate current EBITDA
    const currentEBITDA = latest.operatingIncome + latest.depreciation;

    // Calculate multiple (return 0 if EBITDA is non-positive)
    return currentEBITDA > 0 ? currentEV / currentEBITDA : 0;
};

/**
 * Calculate EBITDA from operating income and depreciation
 */
export const calculateEBITDA = (operatingIncome: number, depreciation: number): number => {
    return operatingIncome + depreciation;
};

/**
 * DCF Approach: Calculate Enterprise Value using Discounted Cash Flow method
 * 
 * @param fcffArray - Array of Free Cash Flow to Firm for each year (10 years)
 * @param wacc - Weighted Average Cost of Capital (as percentage, e.g., 8 for 8%)
 * @param longTermGrowthRate - Perpetual growth rate (as percentage, e.g., 2 for 2%)
 * @param yearsFromNow - Calculate EV for future year (0 for current, 5 for Y5, 10 for Y10)
 */
export const calculateDCF_EV = (
    fcffArray: number[],
    wacc: number,
    longTermGrowthRate: number,
    yearsFromNow: number = 0
): number => {
    const r = wacc / 100;  // Convert percentage to decimal
    const g = longTermGrowthRate / 100;

    // Validate: g must be < wacc
    if (g >= r) {
        console.warn('Long-term growth rate must be less than WACC for valid terminal value calculation');
        return 0;
    }

    if (yearsFromNow === 0) {
        // Y0: Present value of all future cash flows + terminal value
        let pv = 0;

        // Discount each year's FCFF
        for (let t = 1; t <= fcffArray.length; t++) {
            pv += fcffArray[t - 1] / Math.pow(1 + r, t);
        }

        // Add terminal value (Gordon Growth Model)
        const fcff10 = fcffArray[fcffArray.length - 1];
        const terminalValue = (fcff10 * (1 + g)) / (r - g);
        pv += terminalValue / Math.pow(1 + r, fcffArray.length);

        return pv;
    } else {
        // Future year: Terminal value at that point
        // EV_Yn = FCFF_(n+1) / (r - g)
        const fcffIndex = Math.min(yearsFromNow, fcffArray.length - 1);
        const fcffAtYear = fcffArray[fcffIndex];
        return (fcffAtYear * (1 + g)) / (r - g);
    }
};

/**
 * Relative Valuation Approach: Calculate EV using EBITDA multiple
 * 
 * @param ebitda - EBITDA value
 * @param multiple - EV/EBITDA multiple
 */
export const calculateRelativeEV = (ebitda: number, multiple: number): number => {
    return ebitda * multiple;
};

/**
 * Market Value Approach: Calculate EV based on market capitalization
 * 
 * @param company - Company data
 * @param fcffArray - Array of FCFF for debt reduction calculation
 * @param shortTermGrowthRate - Growth rate for market cap (as percentage)
 * @param yearsFromNow - Calculate EV for future year (0 for current, 5 for Y5, 10 for Y10)
 */
export const calculateMarketEV = (
    company: Company,
    fcffArray: number[],
    shortTermGrowthRate: number,
    yearsFromNow: number = 0
): number => {
    const latest = company.financials[0];
    const g_st = shortTermGrowthRate / 100;

    if (yearsFromNow === 0) {
        // Y0: Current market-based EV
        return company.marketCap +
            latest.interestBearingDebt -
            latest.cashAndEquivalents;
    } else {
        // Future year: Project market cap and net debt
        const futureMarketCap = company.marketCap * Math.pow(1 + g_st, yearsFromNow);

        // Net debt reduction from cumulative FCFF
        let cumulativeFCFF = 0;
        for (let i = 0; i < Math.min(yearsFromNow, fcffArray.length); i++) {
            cumulativeFCFF += fcffArray[i];
        }

        const initialNetDebt = latest.interestBearingDebt - latest.cashAndEquivalents;
        const futureNetDebt = initialNetDebt - cumulativeFCFF;

        return futureMarketCap + futureNetDebt;
    }
};

/**
 * Calculate all 3 EV approaches for current and future years
 * Returns object with EV values for Y0, Y5, and Y10 for each approach
 */
export interface EVAnalysis {
    dcf: { y0: number; y5: number; y10: number };
    relative: { y0: number; y5: number; y10: number };
    market: { y0: number; y5: number; y10: number };
    evEbitdaMultiple: number;  // Current calculated multiple
}

export const calculateAllEVApproaches = (
    company: Company,
    fcffArray: number[],
    ebitdaArray: number[],
    wacc: number,
    taxRate: number,
    shortTermGrowthRate: number,
    longTermGrowthRate: number
): EVAnalysis => {
    const multiple = calculateCurrentEVEBITDAMultiple(company);

    return {
        dcf: {
            y0: calculateDCF_EV(fcffArray, wacc, longTermGrowthRate, 0),
            y5: calculateDCF_EV(fcffArray, wacc, longTermGrowthRate, 5),
            y10: calculateDCF_EV(fcffArray, wacc, longTermGrowthRate, 10)
        },
        relative: {
            y0: calculateRelativeEV(ebitdaArray[0] || 0, multiple),
            y5: calculateRelativeEV(ebitdaArray[Math.min(5, ebitdaArray.length - 1)] || 0, multiple),
            y10: calculateRelativeEV(ebitdaArray[Math.min(10, ebitdaArray.length - 1)] || 0, multiple)
        },
        market: {
            y0: calculateMarketEV(company, fcffArray, shortTermGrowthRate, 0),
            y5: calculateMarketEV(company, fcffArray, shortTermGrowthRate, 5),
            y10: calculateMarketEV(company, fcffArray, shortTermGrowthRate, 10)
        },
        evEbitdaMultiple: multiple
    };
};
