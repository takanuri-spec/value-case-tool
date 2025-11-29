import { saveDeal, loadDeals } from './storage';
import { MOCK_COMPANIES } from './mockData';
import type { InvestmentStrategy } from '../types/simulation';

export const initMockDeals = () => {
    const deals = loadDeals();
    const targetCompany = MOCK_COMPANIES[0]; // Use the first mock company (e.g., TechCorp)

    // EV parameters for evaluation
    const evParameters = {
        wacc: 8.0,                    // 8%
        taxRate: 30.0,                // 30%
        shortTermGrowthRate: 3.0,     // 3%
        longTermGrowthRate: 2.0       // 2%
    };

    // Check if mock deal already exists
    const mockDealId = `deal_${targetCompany.id}_mock`; // Assuming this ID format or we search by name
    // Actually, saveDeal generates a random ID. Let's search by name for the sample deal.
    const mockDealName = '中期経営計画2025 (Sample)';

    const existingMockDealIndex = deals.findIndex(d => d.name === mockDealName && d.companyId === targetCompany.id);

    if (existingMockDealIndex !== -1) {
        // Update existing mock deal with EV parameters if missing
        const deal = deals[existingMockDealIndex];
        if (!deal.evParameters) {
            deal.evParameters = evParameters;
            deals[existingMockDealIndex] = deal;
            localStorage.setItem('value_case_deals', JSON.stringify(deals));
            console.log('Updated existing mock deal with EV parameters');
        }
        return;
    }

    // If no deals exist at all, or just this specific mock deal is missing, create it
    if (deals.length > 0 && existingMockDealIndex === -1) {
        // User has other deals but not the mock one. We could create it, or just leave it. 
        // For now, let's only create if NO deals exist to avoid cluttering, 
        // BUT we must ensure if we create it, we add parameters.
        return;
    }

    if (deals.length > 0) return; // Fallback to original behavior: don't init if any deals exist

    const mockStrategies: InvestmentStrategy[] = [
        {
            id: 's1',
            name: 'AIカスタマーサポート導入',
            baselineCost: 50,
            cashImpact: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            plImpact: [2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
            revenueChange: [0, 5, 10, 15, 20, 20, 20, 20, 20, 20],
            costChange: [-5, -10, -15, -15, -15, -15, -15, -15, -15, -15],
            cfChange: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            roi: 150,
            irr: 25,
            paybackPeriod: 2.5,
            totalRevenueIncrease: 145,
            totalEbitIncrease: 280,
            totalCostReduction: 135,
            costReductionPercent: 10,
            fcf: 200
        },
        {
            id: 's2',
            name: '新規SaaSプラットフォーム開発',
            baselineCost: 0,
            cashImpact: [30, 20, 10, 0, 0, 0, 0, 0, 0, 0],
            plImpact: [0, 6, 10, 12, 12, 12, 8, 0, 0, 0],
            revenueChange: [0, 0, 20, 50, 80, 100, 120, 130, 140, 150],
            costChange: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
            cfChange: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            roi: 200,
            irr: 18,
            paybackPeriod: 4.2,
            totalRevenueIncrease: 790,
            totalEbitIncrease: 465,
            totalCostReduction: -275,
            costReductionPercent: 0,
            fcf: 350
        },
        {
            id: 's3',
            name: '物流センター自動化',
            baselineCost: 100,
            cashImpact: [50, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            plImpact: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
            revenueChange: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            costChange: [-10, -20, -20, -20, -20, -20, -20, -20, -20, -20],
            cfChange: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            roi: 80,
            irr: 12,
            paybackPeriod: 3.5,
            totalRevenueIncrease: 0,
            totalEbitIncrease: 140,
            totalCostReduction: 190,
            costReductionPercent: 20,
            fcf: 100
        }
    ];

    // Select first two strategies by default
    const selectedStrategyIds = ['s1', 's2'];

    const mockDeal = saveDeal(
        mockDealName,
        targetCompany.id,
        mockStrategies,
        selectedStrategyIds
    );

    // Update the deal with EV parameters
    mockDeal.evParameters = evParameters;

    // Re-load to ensure we have latest state and update
    const currentDeals = loadDeals();
    const dealIndex = currentDeals.findIndex(d => d.id === mockDeal.id);
    if (dealIndex !== -1) {
        currentDeals[dealIndex] = mockDeal;
        localStorage.setItem('value_case_deals', JSON.stringify(currentDeals));
    }

    console.log('Mock deal initialized with EV parameters');
};
