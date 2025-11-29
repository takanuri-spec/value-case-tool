import type { Company } from '../types/finance';
import type { InvestmentStrategy, SimulationResult } from '../types/simulation';

const DEFAULT_TAX_RATE = 0.3; // デフォルト実効税率30%
const SIMULATION_YEARS = 10;

/**
 * 施策のKPIを計算
 * @param strategy - Investment strategy
 * @param taxRate - Tax rate as decimal (e.g., 0.3 for 30%), defaults to DEFAULT_TAX_RATE
 */
export const calculateStrategyKPIs = (strategy: InvestmentStrategy, taxRate: number = DEFAULT_TAX_RATE): InvestmentStrategy => {
    // 総投資額（CFインパクトの合計）
    const totalInvestment = strategy.cashImpact.reduce((sum, val) => sum + val, 0);

    // 各年の純効果（EBIT増加分）
    const yearlyEbitImpact = strategy.revenueChange.map((rev, i) =>
        rev - strategy.costChange[i] - strategy.plImpact[i]
    );

    // 各年のFCF増加分
    const yearlyFcfImpact = yearlyEbitImpact.map((ebit, i) =>
        ebit * (1 - taxRate) - strategy.cashImpact[i] + strategy.cfChange[i]
    );

    // 合計値
    const totalRevenueIncrease = strategy.revenueChange.reduce((sum, val) => sum + val, 0);
    const totalEbitIncrease = yearlyEbitImpact.reduce((sum, val) => sum + val, 0);
    const totalCostReduction = strategy.costChange.reduce((sum, val) => sum + val, 0);
    const fcf = yearlyFcfImpact.reduce((sum, val) => sum + val, 0);

    // ROI計算
    const roi = totalInvestment !== 0 ? (fcf / totalInvestment) * 100 : 0;

    // IRR計算（簡易版 - 正確なIRRは反復計算が必要）
    const irr = totalInvestment !== 0 ? (fcf / totalInvestment / SIMULATION_YEARS) * 100 : 0;

    // 回収期間（PBP）計算
    let cumulativeCashFlow = 0;
    let paybackPeriod = SIMULATION_YEARS;
    for (let i = 0; i < SIMULATION_YEARS; i++) {
        cumulativeCashFlow += yearlyFcfImpact[i];
        if (cumulativeCashFlow >= totalInvestment) {
            paybackPeriod = i + 1;
            break;
        }
    }

    // ベースラインコスト比%
    const costReductionPercent = strategy.baselineCost !== 0
        ? (totalCostReduction / strategy.baselineCost) * 100
        : 0;

    return {
        ...strategy,
        roi,
        irr,
        paybackPeriod,
        totalRevenueIncrease,
        totalEbitIncrease,
        totalCostReduction,
        costReductionPercent,
        fcf
    };
};

/**
 * 10年間のシミュレーション実行
 */
export const runSimulation = (
    company: Company,
    strategies: InvestmentStrategy[],
    selectedStrategyIds: string[] = [],
    taxRate: number = DEFAULT_TAX_RATE
): SimulationResult[] => {
    const results: SimulationResult[] = [];

    // Check if financials exist and have data
    if (!company.financials || company.financials.length === 0) {
        // Return empty results or handle gracefully
        // For now, we'll return empty results which is safe
        return results;
    }

    const latestFinancial = company.financials[0];

    // 選択された施策のみをフィルタ
    const activeStrategies = strategies.filter(s => selectedStrategyIds.includes(s.id));

    for (let yearOffset = 0; yearOffset < SIMULATION_YEARS; yearOffset++) {
        const year = latestFinancial.year + yearOffset + 1;

        // ベースライン（簡易的に直近年度の数値を使用）
        const baseRevenue = latestFinancial.revenue;
        const baseEbit = latestFinancial.operatingIncome;
        const baseFcf = latestFinancial.operatingIncome * (1 - taxRate) +
            latestFinancial.depreciation -
            latestFinancial.capitalExpenditure;

        // 施策の影響を集計
        let impactRevenue = 0;
        let impactCost = 0;
        let impactPL = 0;
        let impactCF = 0;
        let impactCFChange = 0;

        activeStrategies.forEach(strategy => {
            impactRevenue += strategy.revenueChange[yearOffset] || 0;
            impactCost += strategy.costChange[yearOffset] || 0;
            impactPL += strategy.plImpact[yearOffset] || 0;
            impactCF += strategy.cashImpact[yearOffset] || 0;
            impactCFChange += strategy.cfChange[yearOffset] || 0;
        });

        // EBIT = ベースEBIT + 売上変動 - コスト変動 - PLインパクト
        const impactEbit = impactRevenue - impactCost - impactPL;
        const totalEbit = baseEbit + impactEbit;

        // FCF = EBIT × (1 - 税率) - CFインパクト + CF変動
        const impactFcf = impactEbit * (1 - taxRate) - impactCF + impactCFChange;
        const totalFcf = baseFcf + impactFcf;

        results.push({
            year,
            baseRevenue,
            baseEbit,
            baseFcf,
            impactRevenue,
            impactCost,
            impactPL,
            impactCF,
            impactEbit,
            impactFcf,
            totalRevenue: baseRevenue + impactRevenue,
            totalEbit,
            totalFcf
        });
    }

    return results;
};

/**
 * 空の施策を作成
 */
export const createEmptyStrategy = (name: string, baselineCost: number): InvestmentStrategy => {
    return {
        id: crypto.randomUUID(),
        name,
        baselineCost,
        cashImpact: new Array(SIMULATION_YEARS).fill(0),
        plImpact: new Array(SIMULATION_YEARS).fill(0),
        revenueChange: new Array(SIMULATION_YEARS).fill(0),
        costChange: new Array(SIMULATION_YEARS).fill(0),
        cfChange: new Array(SIMULATION_YEARS).fill(0),
        roi: 0,
        irr: 0,
        paybackPeriod: 0,
        totalRevenueIncrease: 0,
        totalEbitIncrease: 0,
        totalCostReduction: 0,
        costReductionPercent: 0,
        fcf: 0
    };
};

/**
 * プログラムの財務影響を計算（指定年数分）
 */
export const calculateProgramImpact = (
    strategies: InvestmentStrategy[],
    years: number, // 5 or 10
    taxRate: number = DEFAULT_TAX_RATE
): {
    revenueImpact: number;
    ebitImpact: number;
    fcfImpact: number;
} => {
    let totalRevenueImpact = 0;
    let totalEbitImpact = 0;
    let totalFcfImpact = 0;

    const actualYears = Math.min(years, SIMULATION_YEARS);

    for (let yearIdx = 0; yearIdx < actualYears; yearIdx++) {
        let yearRevenue = 0;
        let yearCost = 0;
        let yearPL = 0;
        let yearCF = 0;
        let yearCFChange = 0;

        strategies.forEach(strategy => {
            yearRevenue += strategy.revenueChange[yearIdx] || 0;
            yearCost += strategy.costChange[yearIdx] || 0;
            yearPL += strategy.plImpact[yearIdx] || 0;
            yearCF += strategy.cashImpact[yearIdx] || 0;
            yearCFChange += strategy.cfChange[yearIdx] || 0;
        });

        totalRevenueImpact += yearRevenue;

        // EBIT impact for this year
        const yearEbitImpact = yearRevenue - yearCost - yearPL;
        totalEbitImpact += yearEbitImpact;

        // FCF impact for this year
        const yearFcfImpact = yearEbitImpact * (1 - taxRate) - yearCF + yearCFChange;
        totalFcfImpact += yearFcfImpact;
    }

    return {
        revenueImpact: totalRevenueImpact,
        ebitImpact: totalEbitImpact,
        fcfImpact: totalFcfImpact
    };
};
