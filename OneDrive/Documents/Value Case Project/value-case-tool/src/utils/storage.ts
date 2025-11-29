import type { SimulationDeal, InvestmentStrategy } from '../types/simulation';

const STORAGE_KEY = 'value_case_deals';

export const saveDeal = (name: string, companyId: string, strategies: InvestmentStrategy[], selectedStrategyIds: string[]): SimulationDeal => {
    const deals = loadDeals();

    // Check if deal with same name exists for this company
    const existingIndex = deals.findIndex(d => d.companyId === companyId && d.name === name);

    if (existingIndex !== -1) {
        // Update existing deal
        const updatedDeal = {
            ...deals[existingIndex],
            strategies,
            selectedStrategyIds,
            createdAt: new Date().toISOString() // Update timestamp
        };
        deals[existingIndex] = updatedDeal;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
        return updatedDeal;
    }

    // Create new deal
    const newDeal: SimulationDeal = {
        id: crypto.randomUUID(),
        name,
        companyId,
        strategies,
        selectedStrategyIds,
        createdAt: new Date().toISOString(),
    };

    deals.push(newDeal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    return newDeal;
};

export const loadDeals = (): SimulationDeal[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse deals', e);
        return [];
    }
};

export const deleteDeal = (id: string): void => {
    const deals = loadDeals();
    const filtered = deals.filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const updateDeal = (deal: SimulationDeal): void => {
    const deals = loadDeals();
    const index = deals.findIndex(d => d.id === deal.id);
    if (index !== -1) {
        deals[index] = deal;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
    }
};
