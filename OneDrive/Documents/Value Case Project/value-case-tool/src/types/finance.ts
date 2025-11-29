export interface FinancialData {
    year: number;
    revenue: number; // 億円
    operatingIncome: number; // EBIT
    netIncome: number;
    totalAssets: number;
    totalLiabilities: number;
    netAssets: number;
    cashAndEquivalents: number;
    interestBearingDebt: number;
    depreciation: number;
    capitalExpenditure: number;
}

export interface Company {
    id: string;
    name: string;
    code: string;
    sector: string;
    marketCap: number; // 億円
    stockPrice: number; // 円
    sharesOutstanding: number; // Million shares
    beta: number;
    financials: FinancialData[]; // Historical data (e.g., last 3-5 years)
    wacc: number; // %
    taxRate: number; // %
    fiscalYearStartMonth?: number; // 1-12 (e.g., 4 for April)
    narrative?: string; // 決算短信のナラティブ
    midTermPlanPeriod?: string; // 中期経営計画の期間 (e.g., "2024-2026")
}

export type Sector = 'Technology' | 'Automotive' | 'Retail' | 'Healthcare' | 'Finance';
