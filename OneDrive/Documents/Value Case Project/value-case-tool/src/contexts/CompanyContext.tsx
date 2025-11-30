import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Company } from '../types/finance';
import type { SimulationDeal } from '../types/simulation';
import { MOCK_COMPANIES } from '../utils/mockData';
import { fetchAllCompanies, fetchFinancialData, convertSnapshotToCompany } from '../utils/api';
import { loadDeals } from '../utils/storage';

interface CompanyContextType {
    selectedCompany: Company | null;
    setSelectedCompany: (company: Company | null) => void;
    allCompanies: Company[];
    // Deal related state
    availableDeals: SimulationDeal[];
    selectedDealId: string | null;
    selectDeal: (dealId: string) => Promise<void>;
    refreshDeals: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [allCompanies, setAllCompanies] = useState<Company[]>(MOCK_COMPANIES);

    // Deal state
    const [availableDeals, setAvailableDeals] = useState<SimulationDeal[]>([]);
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

    // Load imported companies on mount
    useEffect(() => {
        const loadImportedCompanies = async () => {
            try {
                const summaries = await fetchAllCompanies();
                const importedCompanies: Company[] = summaries.map(s => ({
                    id: `y_${s.ticker_symbol.replace('.', '_')}`,
                    name: s.company_name || s.ticker_symbol,
                    code: s.ticker_symbol,
                    sector: s.sector || 'Unknown',
                    marketCap: (s.market_cap || 0) / 100000000,
                    stockPrice: 0,
                    sharesOutstanding: 0,
                    beta: 1.0,
                    financials: [], // Empty for list view
                    wacc: 8.0,
                    taxRate: 30.0
                }));

                // Merge mock and imported companies
                const uniqueImported = importedCompanies.filter(
                    imp => !MOCK_COMPANIES.some(mock => mock.id === imp.id)
                );

                setAllCompanies([...MOCK_COMPANIES, ...uniqueImported]);
            } catch (error) {
                console.error('Failed to load imported companies:', error);
                setAllCompanies(MOCK_COMPANIES);
            }
        };

        loadImportedCompanies();
    }, []);

    // Load deals on mount
    useEffect(() => {
        setAvailableDeals(loadDeals());
    }, []);

    const refreshDeals = () => {
        setAvailableDeals(loadDeals());
    };

    // Centralized deal selection logic
    const selectDeal = async (dealId: string) => {
        setSelectedDealId(dealId);

        if (!dealId) {
            // If clearing deal, we might want to keep the company or clear it?
            // For now, let's keep the company selected if manually selected, 
            // but usually deal selection implies switching context.
            return;
        }

        const deal = availableDeals.find(d => d.id === dealId);
        if (!deal) return;

        try {
            // Logic to find/load company
            let company = allCompanies.find(c => c.id === deal.companyId);

            // If company not found in allCompanies, try to fetch it
            if (!company) {
                // Extract ticker from company ID (format: y_TICKER or just TICKER)
                const ticker = deal.companyId.startsWith('y_')
                    ? deal.companyId.substring(2).replace(/_/g, '.')
                    : deal.companyId;

                try {
                    const snapshot = await fetchFinancialData(ticker);
                    const fullCompany = convertSnapshotToCompany(snapshot);
                    setSelectedCompany(fullCompany);
                } catch (err) {
                    console.error('Failed to fetch company by ticker:', ticker, err);
                    alert(`企業データの読み込みに失敗しました (Ticker: ${ticker})`);
                }
            } else {
                // Company found in allCompanies
                if (company.id.startsWith('y_')) {
                    // Fetch full financial data for imported companies
                    const snapshot = await fetchFinancialData(company.code);
                    const fullCompany = convertSnapshotToCompany(snapshot);
                    setSelectedCompany(fullCompany);
                } else {
                    // Mock companies already have full data
                    setSelectedCompany(company);
                }
            }
        } catch (error) {
            console.error('Failed to load company data for deal:', error);
            alert('企業データの読み込みに失敗しました');
        }
    };

    return (
        <CompanyContext.Provider value={{
            selectedCompany,
            setSelectedCompany,
            allCompanies,
            availableDeals,
            selectedDealId,
            selectDeal,
            refreshDeals
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (context === undefined) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};
