import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import type { InvestmentStrategy } from '../types/simulation';
import { createEmptyStrategy } from '../utils/simulationEngine';

interface SimulationInputProps {
    strategies: InvestmentStrategy[];
    onAddStrategy: (strategy: InvestmentStrategy) => void;
    onUpdateStrategy: (strategy: InvestmentStrategy) => void;
    onRemoveStrategy: (id: string) => void;
    editingStrategyId: string | null;
    setEditingStrategyId: (id: string | null) => void;
}

// Helper to convert number array to string array
const toStringArray = (arr: number[]) => arr.map(v => v.toString());

const SimulationInput: React.FC<SimulationInputProps> = ({
    strategies,
    onAddStrategy,
    onUpdateStrategy,
    editingStrategyId,
    setEditingStrategyId,
}) => {
    const [newName, setNewName] = useState('');
    const [newBaseline, setNewBaseline] = useState('');

    // Local state for editing to allow intermediate invalid values (like "-")
    const [tempStrategy, setTempStrategy] = useState<{
        id: string;
        name: string;
        baselineCost: string;
        cashImpact: string[];
        plImpact: string[];
        revenueChange: string[];
        costChange: string[];
        cfChange: string[];
    } | null>(null);

    // Sync tempStrategy when editingStrategyId changes or strategies update (from outside)
    useEffect(() => {
        if (!editingStrategyId) {
            setTempStrategy(null);
            return;
        }
        const strategy = strategies.find(s => s.id === editingStrategyId);
        if (strategy) {
            // Only update tempStrategy if it's a different strategy or if we are not currently editing it (to avoid overwriting user input while typing)
            // Actually, we need to be careful. If we only update on ID change, we miss external updates (e.g. if we had collaborative editing, but we don't).
            // But if we update on every strategy change, we might overwrite "0." with "0" if we parse back and forth.
            // So let's only load if ID changes.
            setTempStrategy(prev => {
                if (prev?.id === strategy.id) return prev; // Don't overwrite if already editing same ID
                return {
                    id: strategy.id,
                    name: strategy.name,
                    baselineCost: strategy.baselineCost.toString(),
                    cashImpact: toStringArray(strategy.cashImpact),
                    plImpact: toStringArray(strategy.plImpact),
                    revenueChange: toStringArray(strategy.revenueChange),
                    costChange: toStringArray(strategy.costChange),
                    cfChange: toStringArray(strategy.cfChange),
                };
            });
        }
    }, [editingStrategyId, strategies]);

    const handleAdd = () => {
        if (!newName.trim()) {
            alert('施策名を入力してください');
            return;
        }
        const baselineCost = parseFloat(newBaseline) || 0;
        const newStrategy = createEmptyStrategy(newName.trim(), baselineCost);
        onAddStrategy(newStrategy);
        setEditingStrategyId(newStrategy.id);
        setNewName('');
        setNewBaseline('');
    };

    const handleCellChange = (
        field: 'cashImpact' | 'plImpact' | 'revenueChange' | 'costChange' | 'cfChange',
        yearIndex: number,
        value: string
    ) => {
        if (!tempStrategy) return;

        // Update local state
        const newArray = [...tempStrategy[field]];
        newArray[yearIndex] = value;
        const updatedTemp = { ...tempStrategy, [field]: newArray };
        setTempStrategy(updatedTemp);

        // Try to update parent if valid number
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && value.trim() !== '' && value !== '-') {
            // Find original strategy to get other fields (KPIs etc are calculated by parent, but we need to pass the full object)
            const original = strategies.find(s => s.id === tempStrategy.id);
            if (original) {
                const updatedOriginal = { ...original };
                const updatedField = [...updatedOriginal[field]];
                updatedField[yearIndex] = numValue;
                // @ts-ignore
                updatedOriginal[field] = updatedField;
                onUpdateStrategy(updatedOriginal);
            }
        }
    };

    const handleNameChange = (value: string) => {
        if (!tempStrategy) return;
        setTempStrategy({ ...tempStrategy, name: value });
        const original = strategies.find(s => s.id === tempStrategy.id);
        if (original) {
            onUpdateStrategy({ ...original, name: value });
        }
    };

    const activeStrategy = strategies.find(s => s.id === editingStrategyId);

    return (
        <div className="space-y-6">
            {/* Add New Strategy Bar */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">投資施策入力</h3>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="施策名"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <input
                        type="number"
                        placeholder="ベースラインコスト (億円)"
                        value={newBaseline}
                        onChange={(e) => setNewBaseline(e.target.value)}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} />
                        施策を追加
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            {editingStrategyId && tempStrategy && activeStrategy && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-indigo-600">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={tempStrategy.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                className="text-xl font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none bg-transparent w-full"
                                placeholder="施策名"
                            />
                            <p className="text-sm text-gray-500 mt-1">ベースラインコスト: {activeStrategy.baselineCost.toLocaleString()} 億円</p>
                        </div>
                        <button
                            onClick={() => setEditingStrategyId(null)}
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 shadow-sm"
                        >
                            <Check size={16} />
                            完了
                        </button>
                    </div>

                    <div className="overflow-x-auto mb-6">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-3 py-2 text-left border min-w-[100px]">項目</th>
                                    {[...Array(10)].map((_, i) => (
                                        <th key={i} className="px-3 py-2 text-right border min-w-[60px]">Y{i + 1}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-blue-50">
                                    <td className="px-3 py-2 font-medium border" colSpan={11}>投資</td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-2 border">CFインパクト</td>
                                    {tempStrategy.cashImpact.map((val, i) => (
                                        <td key={i} className="px-1 py-1 border">
                                            <input
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleCellChange('cashImpact', i, e.target.value)}
                                                className="w-full px-2 py-1 text-right border-0 focus:ring-1 focus:ring-indigo-500 rounded bg-transparent"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-3 py-2 border">PLインパクト</td>
                                    {tempStrategy.plImpact.map((val, i) => (
                                        <td key={i} className="px-1 py-1 border">
                                            <input
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleCellChange('plImpact', i, e.target.value)}
                                                className="w-full px-2 py-1 text-right border-0 focus:ring-1 focus:ring-indigo-500 rounded bg-transparent"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr className="bg-green-50">
                                    <td className="px-3 py-2 font-medium border" colSpan={11}>効果</td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-2 border">売上変動</td>
                                    {tempStrategy.revenueChange.map((val, i) => (
                                        <td key={i} className="px-1 py-1 border">
                                            <input
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleCellChange('revenueChange', i, e.target.value)}
                                                className="w-full px-2 py-1 text-right border-0 focus:ring-1 focus:ring-indigo-500 rounded bg-transparent"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-3 py-2 border">コスト変動</td>
                                    {tempStrategy.costChange.map((val, i) => (
                                        <td key={i} className="px-1 py-1 border">
                                            <input
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleCellChange('costChange', i, e.target.value)}
                                                className="w-full px-2 py-1 text-right border-0 focus:ring-1 focus:ring-indigo-500 rounded bg-transparent"
                                            />
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="px-3 py-2 border">CF変動</td>
                                    {tempStrategy.cfChange.map((val, i) => (
                                        <td key={i} className="px-1 py-1 border">
                                            <input
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleCellChange('cfChange', i, e.target.value)}
                                                className="w-full px-2 py-1 text-right border-0 focus:ring-1 focus:ring-indigo-500 rounded bg-transparent"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* KPI display (using activeStrategy which has calculated values) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                        <KPICard label="ROI" value={`${activeStrategy.roi.toFixed(1)}%`} />
                        <KPICard label="IRR" value={`${activeStrategy.irr.toFixed(1)}%`} />
                        <KPICard label="回収期間" value={`${activeStrategy.paybackPeriod.toFixed(1)}年`} />
                        <KPICard label="売上増額" value={`${activeStrategy.totalRevenueIncrease.toFixed(0)}億円`} />
                        <KPICard label="EBIT増額" value={`${activeStrategy.totalEbitIncrease.toFixed(0)}億円`} />
                        <KPICard label="コスト削減額" value={`${activeStrategy.totalCostReduction.toFixed(0)}億円`} />
                        <KPICard label="コスト削減率" value={`${activeStrategy.costReductionPercent.toFixed(1)}%`} />
                        <KPICard label="FCF" value={`${activeStrategy.fcf.toFixed(0)}億円`} />
                    </div>
                </div>
            )}
        </div>
    );
};

const KPICard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
);

export default SimulationInput;
