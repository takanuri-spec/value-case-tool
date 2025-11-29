import * as XLSX from 'xlsx';
import PptxGenJS from 'pptxgenjs';
import type { SimulationDeal } from '../types/simulation';
import type { Company } from '../types/finance';
import { runSimulation } from './simulationEngine';
import { formatBillionYen } from './financialCalculations';

export const exportToExcel = (deal: SimulationDeal, company: Company) => {
    const allStrategyIds = deal.strategies.map(s => s.id);
    const results = runSimulation(company, deal.strategies, allStrategyIds);

    // Prepare data for Excel
    const data = results.map(r => ({
        '年度': r.year,
        'ベース売上': r.baseRevenue,
        '売上インパクト': r.impactRevenue,
        '合計売上': r.totalRevenue,
        'ベースEBIT': r.baseEbit,
        'EBITインパクト': r.impactEbit,
        '合計EBIT': r.totalEbit,
        'ベースFCF': r.baseFcf,
        'FCFインパクト': r.impactFcf,
        '合計FCF': r.totalFcf
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "財務予測");

    // Strategies Sheet
    const strategiesData = deal.strategies.map(s => ({
        '施策名': s.name,
        'ベースラインコスト': s.baselineCost,
        'ROI (%)': s.roi,
        'IRR (%)': s.irr,
        '回収期間 (年)': s.paybackPeriod,
        '売上増額': s.totalRevenueIncrease,
        'EBIT増額': s.totalEbitIncrease,
        'FCF': s.fcf
    }));
    const wsStrategies = XLSX.utils.json_to_sheet(strategiesData);
    XLSX.utils.book_append_sheet(wb, wsStrategies, "投資施策");

    XLSX.writeFile(wb, `${deal.name}_${company.name}_Projection.xlsx`);
};

export const exportToPPT = (deal: SimulationDeal, company: Company) => {
    const pptx = new PptxGenJS();
    const allStrategyIds = deal.strategies.map(s => s.id);
    const results = runSimulation(company, deal.strategies, allStrategyIds);

    // Slide 1: Title
    let slide = pptx.addSlide();
    slide.addText(`Value Case Simulation: ${deal.name}`, { x: 1, y: 1, w: 8, h: 1, fontSize: 24, bold: true });
    slide.addText(`企業名: ${company.name}`, { x: 1, y: 2, w: 8, h: 0.5, fontSize: 18 });
    slide.addText(`作成日: ${new Date().toLocaleDateString()}`, { x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 14, color: '888888' });

    // Slide 2: Strategies Summary
    slide = pptx.addSlide();
    slide.addText("投資施策一覧", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 18, bold: true, color: '363636' });

    const strategyRows = [
        ['施策名', 'ROI', 'EBIT増額', '回収期間'],
        ...deal.strategies.map(s => [
            s.name,
            `${s.roi.toFixed(1)}%`,
            formatBillionYen(s.totalEbitIncrease),
            `${s.paybackPeriod.toFixed(1)} 年`
        ])
    ] as any[];

    slide.addTable(strategyRows, { x: 0.5, y: 1.5, w: 9, colW: [4, 2, 2, 1], border: { pt: 1, color: 'C0C0C0' } });

    // Slide 3: Financial Projection Table
    slide = pptx.addSlide();
    slide.addText("10年間の財務予測 (単位: 億円)", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 18, bold: true, color: '363636' });

    const projectionRows = [
        ['年度', '合計売上', '合計EBIT', '合計FCF'],
        ...results.map(r => [
            r.year.toString(),
            formatBillionYen(r.totalRevenue),
            formatBillionYen(r.totalEbit),
            formatBillionYen(r.totalFcf)
        ])
    ] as any[];

    slide.addTable(projectionRows, { x: 0.5, y: 1.5, w: 9, fontSize: 10 });

    pptx.writeFile({ fileName: `${deal.name}_Presentation.pptx` });
};
