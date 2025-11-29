import type { Company } from '../types/finance';

// 環境変数からバックエンドURLを取得（本番環境用）
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface ApiCompanySnapshot {
    id: number;
    ticker_symbol: string;
    company_name: string;
    sector: string;
    fiscal_year_start_month: number;
    market_cap: number;
    roe: number;
    pbr: number;
    financial_data: {
        fiscal_years: {
            year: string;
            revenue: number;
            revenue_growth: number | null;
            ebit: number;
            ebitda: number;
            fcf: number;
            total_assets: number;
            cash: number;
            debt: number;
        }[];
    };
    data_fetched_at: string;
}

export const fetchFinancialData = async (ticker: string): Promise<ApiCompanySnapshot> => {
    const response = await fetch(`${API_BASE_URL}/api/fetch-financial-data`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch financial data');
    }

    return response.json();
    return response.json();
};

export interface CompanySummary {
    id: number;
    ticker_symbol: string;
    company_name: string;
    sector: string;
    market_cap: number;
    data_fetched_at: string;
}

export const fetchAllCompanies = async (): Promise<CompanySummary[]> => {
    const response = await fetch(`${API_BASE_URL}/api/companies`);
    if (!response.ok) {
        throw new Error('Failed to fetch companies list');
    }
    return response.json();
};

export const deleteCompany = async (companyId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/companies/${companyId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete company');
    }
};

// Helper to convert API data to Company type
export const convertSnapshotToCompany = (snapshot: ApiCompanySnapshot): Company => {
    // Generate a consistent ID based on ticker
    const id = `y_${snapshot.ticker_symbol.replace('.', '_')}`;

    // Map financials
    const financials = snapshot.financial_data.fiscal_years.map(fy => ({
        year: parseInt(fy.year.split('-')[0]), // Extract year from YYYY-MM-DD
        revenue: fy.revenue / 100000000, // Convert to 億円
        operatingIncome: fy.ebit / 100000000,
        netIncome: 0, // Not fetched currently, placeholder
        totalAssets: fy.total_assets / 100000000,
        netAssets: (fy.total_assets - fy.debt) / 100000000, // Rough estimate: Assets - Debt
        cashAndEquivalents: fy.cash / 100000000,
        interestBearingDebt: fy.debt / 100000000,
        totalLiabilities: (fy.total_assets - (fy.total_assets - fy.debt)) / 100000000, // Rough estimate or just Assets - NetAssets
        capitalExpenditure: 0, // Not directly fetched, would need calculation from CF
        depreciation: (fy.ebitda - fy.ebit) / 100000000,
    }));

    return {
        id,
        name: snapshot.company_name || snapshot.ticker_symbol,
        code: snapshot.ticker_symbol,
        sector: snapshot.sector || 'Unknown',
        fiscalYearStartMonth: snapshot.fiscal_year_start_month || 4,
        marketCap: (snapshot.market_cap || 0) / 100000000,
        stockPrice: 0, // Placeholder
        sharesOutstanding: 0, // Placeholder
        beta: 1.0, // Placeholder
        taxRate: 30, // Default
        wacc: 8, // Default
        financials
    };
};
