import { useState, useEffect } from 'react';
import CompanySearch from '../components/CompanySearch';
import FinancialDashboard from '../components/FinancialDashboard';

import { useCompany } from '../contexts/CompanyContext';
import { loadDeals } from '../utils/storage';
import type { SimulationDeal } from '../types/simulation';
import { fetchFinancialData, convertSnapshotToCompany } from '../utils/api';

const FinancialComparisonPage = () => {
    const { selectedCompany, setSelectedCompany, allCompanies } = useCompany();
    const [availableDeals, setAvailableDeals] = useState<SimulationDeal[]>([]);
    const [selectedDeal, setSelectedDeal] = useState<SimulationDeal | null>(null);
    const [isLoadingDeal, setIsLoadingDeal] = useState(false);

    // Load all deals on mount
    useEffect(() => {
        const deals = loadDeals();
        setAvailableDeals(deals);
    }, []);

    // Handle deal selection
    const handleDealSelection = async (dealId: string) => {
        if (!dealId) {
            setSelectedDeal(null);
            return;
        }

        const deal = availableDeals.find(d => d.id === dealId);
        setSelectedDeal(deal || null);

        // When a deal is selected, update the selected company
        if (deal) {
            setIsLoadingDeal(true);
            try {
                let company = allCompanies.find(c => c.id === deal.companyId);

                // If company not found in allCompanies, try to fetch it
                if (!company) {
                    // Extract ticker from company ID (format: y_TICKER or just TICKER)
                    const ticker = deal.companyId.startsWith('y_')
                        ? deal.companyId.substring(2).replace(/_/g, '.')  // y_7203_T -> 7203.T
                        : deal.companyId;

                    try {
                        const snapshot = await fetchFinancialData(ticker);
                        const fullCompany = convertSnapshotToCompany(snapshot);
                        setSelectedCompany(fullCompany);
                        return;
                    } catch (err) {
                        console.error('Failed to fetch company by ticker:', ticker, err);
                        alert(`企業データの読み込みに失敗しました (Ticker: ${ticker})`);
                        return;
                    }
                }

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
            } catch (error) {
                console.error('Failed to load company data:', error);
                alert('企業データの読み込みに失敗しました');
            } finally {
                setIsLoadingDeal(false);
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">企業財務比較</h1>
                    <p className="text-gray-600">企業の財務情報を横並びで比較し、成長性や収益性を分析します。</p>
                </div>
                <CompanySearch />

                {/* Deal Selector - Always show if there are deals */}
                {availableDeals.length > 0 && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            保存済みディールを選択
                        </label>
                        <select
                            value={selectedDeal?.id || ''}
                            onChange={(e) => handleDealSelection(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">ディールなし</option>
                            {availableDeals.map(deal => {
                                const company = allCompanies.find(c => c.id === deal.companyId);
                                return (
                                    <option key={deal.id} value={deal.id}>
                                        {deal.name} - {company?.name || '不明な企業'} ({new Date(deal.createdAt).toLocaleDateString()})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}
            </div>

            {selectedCompany ? (
                <FinancialDashboard company={selectedCompany} selectedDeal={selectedDeal} />
            ) : isLoadingDeal ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">企業データを読み込み中...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">企業を選択して詳細を表示</p>
                </div>
            )}
        </div>
    );
};

export default FinancialComparisonPage;
