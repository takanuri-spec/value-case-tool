import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Company } from '../types/finance';
import { MOCK_COMPANIES } from '../utils/mockData';
import { fetchAllCompanies } from '../utils/api';

interface CompanyContextType {
    selectedCompany: Company | null;
    setSelectedCompany: (company: Company | null) => void;
    allCompanies: Company[];
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [allCompanies, setAllCompanies] = useState<Company[]>(MOCK_COMPANIES);

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
                // Filter out any imported companies that might conflict with mock IDs (unlikely but safe)
                const uniqueImported = importedCompanies.filter(
                    imp => !MOCK_COMPANIES.some(mock => mock.id === imp.id)
                );

                setAllCompanies([...MOCK_COMPANIES, ...uniqueImported]);
            } catch (error) {
                console.error('Failed to load imported companies:', error);
                // Fallback to just mock companies if fetch fails
                setAllCompanies(MOCK_COMPANIES);
            }
        };

        loadImportedCompanies();
    }, []);

    return (
        <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany, allCompanies }}>
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
