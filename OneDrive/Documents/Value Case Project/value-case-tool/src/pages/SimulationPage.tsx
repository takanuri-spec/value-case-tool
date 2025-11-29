import { useState, useEffect, useMemo } from 'react';
import { Save } from 'lucide-react';
import CompanySearch from '../components/CompanySearch';
import SimulationInput from '../components/SimulationInput';
import SimulationDashboard from '../components/SimulationDashboard';
import { calculateStrategyKPIs, runSimulation } from '../utils/simulationEngine';
import { saveDeal, loadDeals } from '../utils/storage';
import { useCompany } from '../contexts/CompanyContext';
import type { SimulationDeal, InvestmentStrategy } from '../types/simulation';
import { fetchFinancialData, convertSnapshotToCompany } from '../utils/api';

const SimulationPage = () => {
    const { selectedCompany, setSelectedCompany, allCompanies } = useCompany();
    const [strategies, setStrategies] = useState<InvestmentStrategy[]>([]);
    const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([]);
    const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
    const [dealName, setDealName] = useState<string>('');
    const [availableDeals, setAvailableDeals] = useState<SimulationDeal[]>([]);
    const [selectedDealId, setSelectedDealId] = useState<string>('');

    // EV Parameters state (with defaults)
    const [evParameters, setEVParameters] = useState({
        wacc: 8.0,
        taxRate: 30.0,
        shortTermGrowthRate: 3.0,
        longTermGrowthRate: 2.0
    });

    // Load all available deals on mount
    useEffect(() => {
        const deals = loadDeals();
        setAvailableDeals(deals);
    }, []);

    // Reset strategies when company changes
    useEffect(() => {
        if (!selectedDealId) {
            setStrategies([]);
            setSelectedStrategyIds([]);
            setDealName('');
        }
    }, [selectedCompany, selectedDealId]);

    // Handle Deal Selection
    const handleSelectDeal = async (dealId: string) => {
        setSelectedDealId(dealId);
        if (!dealId) {
            setStrategies([]);
            setSelectedStrategyIds([]);
            setDealName('');
            return;
        }

        const deal = availableDeals.find(d => d.id === dealId);
        if (deal) {
            try {
                // Update the selected company when deal is selected
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
                    } catch (err) {
                        console.error('Failed to fetch company by ticker:', ticker, err);
                        alert(`企業データの読み込みに失敗しました (Ticker: ${ticker})`);
                        return;
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

                setStrategies(deal.strategies);
                setSelectedStrategyIds(deal.selectedStrategyIds || []); // Load saved selection state
                setDealName(deal.name);

                // Load EV parameters if available, otherwise use defaults
                if (deal.evParameters) {
                    setEVParameters(deal.evParameters);
                }
            } catch (error) {
                console.error('Failed to load company data:', error);
                alert('企業データの読み込みに失敗しました');
            }
        }
    };

    const handleAddStrategy = (strategy: InvestmentStrategy) => {
        setStrategies([...strategies, calculateStrategyKPIs(strategy)]);
        setSelectedStrategyIds(prev => [...prev, strategy.id]);
    };

    const handleUpdateStrategy = (updatedStrategy: InvestmentStrategy) => {
        console.log('Updating strategy:', updatedStrategy.id);
        setStrategies(strategies.map(s =>
            s.id === updatedStrategy.id ? calculateStrategyKPIs(updatedStrategy) : s
        ));
    };

    const handleRemoveStrategy = (id: string) => {
        setStrategies(strategies.filter(s => s.id !== id));
        setSelectedStrategyIds(selectedStrategyIds.filter(sid => sid !== id));
        if (editingStrategyId === id) setEditingStrategyId(null);
    };

    const handleToggleStrategy = (id: string) => {
        setSelectedStrategyIds(prev => {
            const next = prev.includes(id)
                ? prev.filter(sid => sid !== id)
                : [...prev, id];
            console.log('Toggling strategy:', id, 'Prev:', prev, 'Next:', next);
            return next;
        });
    };

    const handleSaveDeal = () => {
        if (!selectedCompany) return;
        const finalName = dealName.trim() || generateDefaultDealName();

        // Save deal with current strategies AND selected state
        const savedDeal = saveDeal(finalName, selectedCompany.id, strategies, selectedStrategyIds);

        // Update with EV parameters
        savedDeal.evParameters = evParameters;
        const deals = loadDeals();
        const dealIndex = deals.findIndex(d => d.id === savedDeal.id);
        if (dealIndex !== -1) {
            deals[dealIndex] = savedDeal;
            localStorage.setItem('value_case_deals', JSON.stringify(deals));
        }

        alert(`ディール「${finalName}」を保存しました！`);

        // Refresh available deals list
        const updatedDeals = loadDeals();
        setAvailableDeals(updatedDeals);

        // Select the saved deal
        setSelectedDealId(savedDeal.id);
        setDealName(savedDeal.name);
    };

    const generateDefaultDealName = (): string => {
        const existingDeals = loadDeals().filter(d => d.companyId === selectedCompany?.id);
        const defaultNames = existingDeals.filter(d => d.name.match(/^Deal\d+$/));
        const numbers = defaultNames.map(d => parseInt(d.name.replace('Deal', ''), 10));
        const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
        return `Deal${nextNumber}`;
    };

    const simulationResults = useMemo(() => {
        if (!selectedCompany) return [];

        const activeStrategies = strategies.filter(s => selectedStrategyIds.includes(s.id));
        console.log('Running simulation:', {
            strategiesCount: strategies.length,
            selectedCount: selectedStrategyIds.length,
            activeStrategies: activeStrategies.map(s => ({ id: s.id, name: s.name, totalEbit: s.totalEbitIncrease }))
        });

        return runSimulation(selectedCompany, strategies, selectedStrategyIds, evParameters.taxRate / 100);
    }, [selectedCompany, strategies, selectedStrategyIds, evParameters.taxRate]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">投資効果シミュレーション</h1>
                        <p className="text-gray-600">戦略的投資による企業価値への影響を10年間にわたってシミュレーションします。</p>
                    </div>

                    {/* Deal Controls */}
                    {selectedCompany && (
                        <div className="flex items-center gap-3">
                            {/* Deal Selector - Always show if there are deals */}
                            {availableDeals.length > 0 && (
                                <select
                                    value={selectedDealId}
                                    onChange={(e) => handleSelectDeal(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                >
                                    <option value="">新規作成 / ディール選択</option>
                                    {availableDeals.map(deal => {
                                        const company = allCompanies.find(c => c.id === deal.companyId);
                                        return (
                                            <option key={deal.id} value={deal.id}>
                                                {deal.name} - {company?.name || '不明な企業'}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}

                            {/* Deal Name Input & Save */}
                            {(strategies.length > 0 || selectedDealId) && (
                                <>
                                    <input
                                        type="text"
                                        value={dealName}
                                        onChange={(e) => setDealName(e.target.value)}
                                        placeholder={generateDefaultDealName()}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm w-40"
                                    />
                                    <button
                                        onClick={handleSaveDeal}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                                    >
                                        <Save size={18} />
                                        ディールを保存
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <CompanySearch />

                {/* EV Parameters Section */}
                {selectedCompany && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">EV評価パラメータ</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    WACC (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={evParameters.wacc}
                                    onChange={(e) => setEVParameters({ ...evParameters, wacc: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    税率 (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={evParameters.taxRate}
                                    onChange={(e) => setEVParameters({ ...evParameters, taxRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    短期成長率 (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={evParameters.shortTermGrowthRate}
                                    onChange={(e) => setEVParameters({ ...evParameters, shortTermGrowthRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    永久成長率 (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={evParameters.longTermGrowthRate}
                                    onChange={(e) => setEVParameters({ ...evParameters, longTermGrowthRate: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            ※ これらのパラメータは企業価値評価(EV)の計算に使用されます。変更はディール保存時に反映されます。
                        </p>
                    </div>
                )}
            </div>

            {selectedCompany ? (
                <div className="space-y-8">
                    {/* 施策入力 */}
                    <SimulationInput
                        strategies={strategies}
                        onAddStrategy={handleAddStrategy}
                        onUpdateStrategy={handleUpdateStrategy}
                        onRemoveStrategy={handleRemoveStrategy}
                        editingStrategyId={editingStrategyId}
                        setEditingStrategyId={setEditingStrategyId}
                    />

                    {/* 施策リスト（チェックボックス付き） */}
                    {strategies.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">保存済み施策リスト</h3>
                            <div className="space-y-3">
                                {strategies.map(strategy => (
                                    <label key={strategy.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedStrategyIds.includes(strategy.id)}
                                            onChange={() => handleToggleStrategy(strategy.id)}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 rounded"
                                        />
                                        <div className="flex-1">
                                            <span className="font-medium text-gray-900">{strategy.name}</span>
                                            <div className="text-xs text-gray-500 mt-1 flex gap-4">
                                                <span>ROI: {strategy.roi.toFixed(1)}%</span>
                                                <span>EBIT増: {strategy.totalEbitIncrease.toFixed(0)}億円</span>
                                                <span>PBP: {strategy.paybackPeriod.toFixed(1)}年</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setEditingStrategyId(strategy.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="編集"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleRemoveStrategy(strategy.id);
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="削除"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"></path>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 財務予測 */}
                    <SimulationDashboard results={simulationResults} />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">企業を選択してシミュレーションを開始</p>
                </div>
            )}
        </div>
    );
};

export default SimulationPage;
