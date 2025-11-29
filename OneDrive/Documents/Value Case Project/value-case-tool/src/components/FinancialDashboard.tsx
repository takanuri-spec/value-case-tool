import React, { useState, useMemo } from 'react';
import type { Company } from '../types/finance';
import { calculateEV, calculateROIC, calculateROE, formatBillionYen, calculateEBITDA } from '../utils/financialCalculations';
import { MOCK_COMPANIES } from '../utils/mockData';
import { calculateSectorAverage } from '../utils/comparisonUtils';
import { calculateProgramImpact, runSimulation } from '../utils/simulationEngine';
import { calculateAllEVApproaches } from '../utils/evCalculations';
import type { SimulationDeal } from '../types/simulation';

interface FinancialDashboardProps {
    company: Company;
    selectedDeal?: SimulationDeal | null;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ company, selectedDeal }) => {
    const [comparisonTargetId, setComparisonTargetId] = useState<string>('avg');

    // Calculate Sector Average
    const sectorAverage = useMemo(() => {
        return calculateSectorAverage(company.sector, MOCK_COMPANIES);
    }, [company.sector]);

    // Determine Comparison Target
    const comparisonTarget = useMemo(() => {
        if (comparisonTargetId === 'avg') return sectorAverage;
        return MOCK_COMPANIES.find(c => c.id === comparisonTargetId) || null;
    }, [comparisonTargetId, sectorAverage]);

    // Calculate program impacts
    const deal5YearImpact = useMemo(() => {
        if (!selectedDeal) return null;
        return calculateProgramImpact(selectedDeal.strategies, 5, selectedDeal.evParameters?.taxRate ? selectedDeal.evParameters.taxRate / 100 : undefined);
    }, [selectedDeal]);

    const deal10YearImpact = useMemo(() => {
        if (!selectedDeal) return null;
        return calculateProgramImpact(selectedDeal.strategies, 10, selectedDeal.evParameters?.taxRate ? selectedDeal.evParameters.taxRate / 100 : undefined);
    }, [selectedDeal]);

    // Helper to calculate metrics for a company
    const getMetrics = (c: Company, programImpact: { revenueImpact: number; ebitImpact: number; fcfImpact: number } | null = null) => {
        if (!c.financials || c.financials.length === 0) {
            return {
                name: c.name,
                marketCap: c.marketCap,
                revenue: 0,
                growthRate: 0,
                ebit: 0,
                ebitda: 0,
                ebitMargin: 0,
                fcf: 0,
                roic: 0,
                ev: c.marketCap,
                roe: 0,
                wacc: c.wacc,
                pbr: 0
            };
        }

        const latest = c.financials[0];
        const previous = c.financials[1];

        const baseRevenue = latest.revenue;
        const baseEbit = latest.operatingIncome;
        // Use deal tax rate if available for FCF calculation, otherwise company default
        const taxRate = selectedDeal?.evParameters?.taxRate ? selectedDeal.evParameters.taxRate / 100 : c.taxRate;
        const baseFcf = latest.operatingIncome * (1 - taxRate) + latest.depreciation - latest.capitalExpenditure;

        // Apply program impact if provided
        const revenue = programImpact ? baseRevenue + programImpact.revenueImpact : baseRevenue;
        const ebit = programImpact ? baseEbit + programImpact.ebitImpact : baseEbit;
        const fcf = programImpact ? baseFcf + programImpact.fcfImpact : baseFcf;

        const ev = calculateEV(c.marketCap, latest.interestBearingDebt, latest.cashAndEquivalents);
        const roic = calculateROIC(ebit, c.taxRate, latest.interestBearingDebt, latest.netAssets);
        const roe = calculateROE(latest.netIncome, latest.netAssets);
        const pbr = latest.netAssets > 0 ? c.marketCap / latest.netAssets : 0;
        const ebitMargin = revenue > 0 ? (ebit / revenue) * 100 : 0;
        const ebitda = calculateEBITDA(ebit, latest.depreciation);

        // Growth rate (YoY)
        const growthRate = previous && previous.revenue > 0 ? ((latest.revenue - previous.revenue) / previous.revenue) * 100 : 0;

        return {
            name: c.name,
            marketCap: c.marketCap,
            revenue,
            growthRate,
            ebit,
            ebitda,
            ebitMargin,
            fcf,
            roic,
            ev,
            roe,
            wacc: c.wacc,
            pbr
        };
    };

    const targetMetrics = getMetrics(company);
    const comparisonMetrics = comparisonTarget ? getMetrics(comparisonTarget) : null;

    // Program impact metrics
    const target5YearMetrics = deal5YearImpact ? getMetrics(company, deal5YearImpact) : null;
    const target10YearMetrics = deal10YearImpact ? getMetrics(company, deal10YearImpact) : null;

    // Historical data for the last 4 years (2022-2025), reversed to show oldest -> newest
    const historicalData = company.financials ? company.financials.slice(0, 4).reverse() : [];
    const years = historicalData.map(f => f.year);
    const tableMetrics = [
        { label: '売上収益', key: 'revenue' as const },
        { label: '営業利益', key: 'operatingIncome' as const },
        { label: '当期利益', key: 'netIncome' as const },
        { label: '総資産', key: 'totalAssets' as const },
        { label: 'フリーキャッシュフロー', key: 'fcf' as const },
    ];

    return (
        <div className="space-y-8">
            {/* Section 1: Comparative Metrics Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">財務指標比較</h2>
                    <span className="text-sm text-gray-500">
                        比較対象: <span className="font-semibold text-indigo-600">{comparisonTarget?.name}</span>
                        {selectedDeal && <span className="ml-4">ディール: <span className="font-semibold text-green-600">{selectedDeal.name}</span></span>}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-3 text-left sticky left-0 bg-gray-50">指標</th>
                                <th className="px-6 py-3 text-right">{company.name}</th>
                                {comparisonMetrics && (
                                    <th className="px-6 py-3 text-right">{comparisonMetrics.name}</th>
                                )}
                                {target5YearMetrics && (
                                    <th className="px-6 py-3 text-right bg-green-50">+ディール (5年)</th>
                                )}
                                {target10YearMetrics && (
                                    <th className="px-6 py-3 text-right bg-green-50">+ディール (10年)</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <MetricRow label="企業名" value={targetMetrics.name} compValue={comparisonMetrics?.name} prog5Value={target5YearMetrics?.name} prog10Value={target10YearMetrics?.name} isText />
                            <MetricRow label="時価総額 (億円)" value={targetMetrics.marketCap} compValue={comparisonMetrics?.marketCap} />
                            <MetricRow label="売上額 (億円)" value={targetMetrics.revenue} compValue={comparisonMetrics?.revenue} prog5Value={target5YearMetrics?.revenue} prog10Value={target10YearMetrics?.revenue} />
                            <MetricRow label="成長率 (%)" value={targetMetrics.growthRate} compValue={comparisonMetrics?.growthRate} isPercentage />
                            <MetricRow label="EBIT額 (億円)" value={targetMetrics.ebit} compValue={comparisonMetrics?.ebit} prog5Value={target5YearMetrics?.ebit} prog10Value={target10YearMetrics?.ebit} />
                            <MetricRow label="EBITDA (億円)" value={targetMetrics.ebitda} compValue={comparisonMetrics?.ebitda} prog5Value={target5YearMetrics?.ebitda} prog10Value={target10YearMetrics?.ebitda} />
                            <MetricRow label="EBIT% (%)" value={targetMetrics.ebitMargin} compValue={comparisonMetrics?.ebitMargin} prog5Value={target5YearMetrics?.ebitMargin} prog10Value={target10YearMetrics?.ebitMargin} isPercentage />
                            <MetricRow label="FCF (億円)" value={targetMetrics.fcf} compValue={comparisonMetrics?.fcf} prog5Value={target5YearMetrics?.fcf} prog10Value={target10YearMetrics?.fcf} />
                            <MetricRow label="ROIC (%)" value={targetMetrics.roic} compValue={comparisonMetrics?.roic} prog5Value={target5YearMetrics?.roic} prog10Value={target10YearMetrics?.roic} isPercentage />
                            <MetricRow label="EV (億円)" value={targetMetrics.ev} compValue={comparisonMetrics?.ev} />
                            <MetricRow label="ROE (%)" value={targetMetrics.roe} compValue={comparisonMetrics?.roe} isPercentage />
                            <MetricRow label="WACC (%)" value={targetMetrics.wacc} compValue={comparisonMetrics?.wacc} isPercentage />
                            <MetricRow label="PBR (倍)" value={targetMetrics.pbr} compValue={comparisonMetrics?.pbr} isRatio />
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Comparison Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">比較対象の選択</h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                            type="radio"
                            name="comparison"
                            value="avg"
                            checked={comparisonTargetId === 'avg'}
                            onChange={(e) => setComparisonTargetId(e.target.value)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-900">{company.sector} (平均)</span>
                    </label>
                    {MOCK_COMPANIES.filter(c => c.sector === company.sector && c.id !== company.id).map(peer => (
                        <label key={peer.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                                type="radio"
                                name="comparison"
                                value={peer.id}
                                checked={comparisonTargetId === peer.id}
                                onChange={(e) => setComparisonTargetId(e.target.value)}
                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="font-medium text-gray-900">{peer.name}</span>
                            <span className="text-sm text-gray-500">({peer.code})</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Section 3: Historical Data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">業績推移 ({company.name})</h3>
                    <span className="text-sm text-gray-500">(単位: 億円)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-3 sticky left-0 bg-gray-50">指標</th>
                                {years.map(year => (
                                    <th key={year} className="px-6 py-3 text-right">
                                        {year}年度{year === years[years.length - 1] ? ' (見通し)' : ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {tableMetrics.map(metric => (
                                <tr key={metric.label} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium sticky left-0 bg-white">{metric.label}</td>
                                    {historicalData.map(f => {
                                        let value = 0;
                                        if (metric.key === 'fcf') {
                                            value = f.operatingIncome + f.depreciation - f.capitalExpenditure;
                                        } else {
                                            value = f[metric.key];
                                        }
                                        return (
                                            <td key={f.year} className="px-6 py-4 text-right">
                                                {formatBillionYen(value)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 4: EV Evaluation */}
            {selectedDeal?.evParameters && (() => {
                const evParams = selectedDeal.evParameters;
                const taxRate = evParams.taxRate / 100;

                const simResults = runSimulation(company, selectedDeal.strategies, selectedDeal.selectedStrategyIds, taxRate);
                const fcffArray = simResults.map(r => r.totalFcf);
                const ebitdaArray = simResults.map(r => calculateEBITDA(r.totalEbit, company.financials[0]?.depreciation || 0));

                const evAnalysis = calculateAllEVApproaches(
                    company,
                    fcffArray,
                    ebitdaArray,
                    evParams.wacc,
                    evParams.taxRate,
                    evParams.shortTermGrowthRate,
                    evParams.longTermGrowthRate
                );

                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">企業価値評価 (EV)</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                ディール「{selectedDeal.name}」のパラメータを使用
                            </p>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">評価パラメータ</h4>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">WACC</p>
                                    <p className="text-sm font-medium text-gray-900">{evParams.wacc.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">税率</p>
                                    <p className="text-sm font-medium text-gray-900">{evParams.taxRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">短期成長率</p>
                                    <p className="text-sm font-medium text-gray-900">{evParams.shortTermGrowthRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">永久成長率</p>
                                    <p className="text-sm font-medium text-gray-900">{evParams.longTermGrowthRate.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">EV/EBITDA</p>
                                    <p className="text-sm font-medium text-gray-900">{evAnalysis.evEbitdaMultiple.toFixed(2)}x</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 text-left">評価手法</th>
                                        <th className="px-6 py-3 text-right">Y0 (現在)</th>
                                        <th className="px-6 py-3 text-right">Y5 (5年後)</th>
                                        <th className="px-6 py-3 text-right">Y10 (10年後)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            DCF法 (本質的価値)
                                            <p className="text-xs text-gray-500 mt-1">割引キャッシュフロー</p>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.dcf.y0)}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.dcf.y5)}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.dcf.y10)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            相対評価法
                                            <p className="text-xs text-gray-500 mt-1">EBITDA × マルチプル</p>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.relative.y0)}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.relative.y5)}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.relative.y10)}</td>
                                    </tr>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            マーケット価値法
                                            <p className="text-xs text-gray-500 mt-1">時価総額ベース</p>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.market.y0)}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.market.y5)}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">{formatBillionYen(evAnalysis.market.y10)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {/* Section 5: Company Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">その他基礎情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="会計年度開始月" value={company.fiscalYearStartMonth ? `${company.fiscalYearStartMonth}月` : '-'} />
                    <InfoItem label="中期経営計画期間" value={company.midTermPlanPeriod || '-'} />
                </div>
                {company.narrative && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">決算短信ナラティブ</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{company.narrative}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface MetricRowProps {
    label: string;
    value: number | string;
    compValue?: number | string;
    prog5Value?: number | string;
    prog10Value?: number | string;
    isPercentage?: boolean;
    isRatio?: boolean;
    isText?: boolean;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, compValue, prog5Value, prog10Value, isPercentage, isRatio, isText }) => {
    const formatValue = (val: number | string | undefined) => {
        if (val === undefined) return undefined;

        if (isText) {
            return String(val);
        } else if (isPercentage) {
            return (val as number).toFixed(1);
        } else if (isRatio) {
            return (val as number).toFixed(2);
        } else {
            return formatBillionYen(val as number);
        }
    };

    const formattedValue = formatValue(value);
    const formattedComp = formatValue(compValue);
    const formattedProg5 = formatValue(prog5Value);
    const formattedProg10 = formatValue(prog10Value);

    return (
        <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 font-medium sticky left-0 bg-white">{label}</td>
            <td className="px-6 py-4 text-right text-gray-900">{formattedValue}</td>
            {compValue !== undefined && (
                <td className="px-6 py-4 text-right text-gray-600">{formattedComp || '-'}</td>
            )}
            {prog5Value !== undefined && (
                <td className="px-6 py-4 text-right text-green-700 font-medium bg-green-50">{formattedProg5 || '-'}</td>
            )}
            {prog10Value !== undefined && (
                <td className="px-6 py-4 text-right text-green-700 font-medium bg-green-50">{formattedProg10 || '-'}</td>
            )}
        </tr>
    );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-base font-medium text-gray-900">{value}</p>
    </div>
);

export default FinancialDashboard;
