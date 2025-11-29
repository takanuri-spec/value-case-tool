export interface InvestmentStrategy {
    id: string;
    name: string;
    baselineCost: number; // ベースラインコスト

    // 10年分の投資入力 (億円)
    cashImpact: number[]; // CFインパクト（実際のキャッシュアウト）
    plImpact: number[]; // PLインパクト（償却費など）

    // 10年分の効果入力 (億円)
    revenueChange: number[]; // 売上変動
    costChange: number[]; // コスト変動
    cfChange: number[]; // CF変動

    // 計算されたKPI
    roi: number;
    irr: number;
    paybackPeriod: number;
    totalRevenueIncrease: number; // 売上増額合計
    totalEbitIncrease: number; // EBIT増額合計
    totalCostReduction: number; // コスト削減額合計
    costReductionPercent: number; // ベースラインコスト比%
    fcf: number; // FCF合計
}

export interface SimulationResult {
    year: number;

    // ベースライン
    baseRevenue: number;
    baseEbit: number;
    baseFcf: number;

    // 施策の影響
    impactRevenue: number;
    impactCost: number;
    impactPL: number; // PLインパクト（償却費など）
    impactCF: number; // CFインパクト（投資キャッシュアウト）
    impactEbit: number;
    impactFcf: number;

    // 合計
    totalRevenue: number;
    totalEbit: number;
    totalFcf: number;
}

export interface EVParameters {
    wacc: number;                  // WACC (%) - Default: 8.0
    taxRate: number;               // Tax Rate (%) - Default: 30.0
    shortTermGrowthRate: number;   // g_st (%) - Default: 3.0
    longTermGrowthRate: number;    // g_lt (%) - Default: 2.0
}

export interface SimulationDeal {
    id: string;
    name: string;
    companyId: string;
    strategies: InvestmentStrategy[];
    selectedStrategyIds: string[]; // 選択された施策ID（チェック状態の保存）
    evParameters?: EVParameters;   // EV calculation parameters (optional for backward compatibility)
    createdAt: string;
}
