import type { Company, FinancialData } from '../types/finance';

export const calculateSectorAverage = (sector: string, companies: Company[]): Company | null => {
    const sectorCompanies = companies.filter(c => c.sector === sector);

    if (sectorCompanies.length === 0) return null;

    const count = sectorCompanies.length;

    // Calculate average for latest financials (index 0)
    // We assume all companies have the same financial years for simplicity in this MVP
    // In a real app, we would align by year.

    const avgFinancials: FinancialData[] = [];
    const years = sectorCompanies[0].financials.map(f => f.year);

    years.forEach((year, index) => {
        let totalRevenue = 0;
        let totalOperatingIncome = 0;
        let totalNetIncome = 0;
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalNetAssets = 0;
        let totalCash = 0;
        let totalDebt = 0;
        let totalDepreciation = 0;
        let totalCapEx = 0;

        sectorCompanies.forEach(c => {
            const f = c.financials[index]; // Assuming same index corresponds to same year
            if (f) {
                totalRevenue += f.revenue;
                totalOperatingIncome += f.operatingIncome;
                totalNetIncome += f.netIncome;
                totalAssets += f.totalAssets;
                totalLiabilities += f.totalLiabilities;
                totalNetAssets += f.netAssets;
                totalCash += f.cashAndEquivalents;
                totalDebt += f.interestBearingDebt;
                totalDepreciation += f.depreciation;
                totalCapEx += f.capitalExpenditure;
            }
        });

        avgFinancials.push({
            year,
            revenue: totalRevenue / count,
            operatingIncome: totalOperatingIncome / count,
            netIncome: totalNetIncome / count,
            totalAssets: totalAssets / count,
            totalLiabilities: totalLiabilities / count,
            netAssets: totalNetAssets / count,
            cashAndEquivalents: totalCash / count,
            interestBearingDebt: totalDebt / count,
            depreciation: totalDepreciation / count,
            capitalExpenditure: totalCapEx / count,
        });
    });

    const avgMarketCap = sectorCompanies.reduce((sum, c) => sum + c.marketCap, 0) / count;
    const avgStockPrice = sectorCompanies.reduce((sum, c) => sum + c.stockPrice, 0) / count;
    const avgShares = sectorCompanies.reduce((sum, c) => sum + c.sharesOutstanding, 0) / count;
    const avgBeta = sectorCompanies.reduce((sum, c) => sum + c.beta, 0) / count;
    const avgWacc = sectorCompanies.reduce((sum, c) => sum + c.wacc, 0) / count;
    const avgTaxRate = sectorCompanies.reduce((sum, c) => sum + c.taxRate, 0) / count;

    return {
        id: `avg-${sector}`,
        name: `${sector} (平均)`,
        code: '-',
        sector: sector,
        marketCap: avgMarketCap,
        stockPrice: avgStockPrice,
        sharesOutstanding: avgShares,
        beta: avgBeta,
        wacc: avgWacc,
        taxRate: avgTaxRate,
        financials: avgFinancials
    };
};
