import * as XLSX from 'xlsx';
import type { InvestmentStrategy } from '../types/simulation';
import { calculateStrategyKPIs } from './simulationEngine';

interface RowData {
    StrategyName: string;
    BaselineCost: number;
    Type: string;
    [key: string]: any; // For Year columns
}

export const parseDealFile = (file: File): Promise<InvestmentStrategy[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<RowData>(sheet);

                const strategiesMap = new Map<string, Partial<InvestmentStrategy>>();

                jsonData.forEach((row) => {
                    const name = row['StrategyName'];
                    if (!name) return;

                    if (!strategiesMap.has(name)) {
                        strategiesMap.set(name, {
                            id: crypto.randomUUID(),
                            name: name,
                            baselineCost: row['BaselineCost'] || 0,
                            cashImpact: Array(10).fill(0),
                            plImpact: Array(10).fill(0),
                            revenueChange: Array(10).fill(0),
                            costChange: Array(10).fill(0),
                            cfChange: Array(10).fill(0),
                        });
                    }

                    const strategy = strategiesMap.get(name)!;
                    const type = row['Type'];

                    // Extract year values
                    const values: number[] = [];
                    for (let i = 1; i <= 10; i++) {
                        const key = `Year${i}`;
                        values.push(Number(row[key]) || 0);
                    }

                    switch (type) {
                        case 'Investment_Cash':
                            strategy.cashImpact = values;
                            break;
                        case 'Investment_PL':
                            strategy.plImpact = values;
                            break;
                        case 'Effect_Revenue':
                            strategy.revenueChange = values;
                            break;
                        case 'Effect_Cost':
                            strategy.costChange = values;
                            break;
                        case 'Effect_CF':
                            strategy.cfChange = values;
                            break;
                    }
                });

                const strategies: InvestmentStrategy[] = [];
                strategiesMap.forEach((partialStrategy) => {
                    // Calculate KPIs for each strategy
                    if (partialStrategy.name && partialStrategy.cashImpact) {
                        const fullStrategy = calculateStrategyKPIs(partialStrategy as InvestmentStrategy);
                        strategies.push(fullStrategy);
                    }
                });

                resolve(strategies);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

export const downloadTemplate = () => {
    const headers = ['StrategyName', 'BaselineCost', 'Type', 'Year1', 'Year2', 'Year3', 'Year4', 'Year5', 'Year6', 'Year7', 'Year8', 'Year9', 'Year10'];
    const sampleData = [
        {
            StrategyName: 'Sample Strategy',
            BaselineCost: 100,
            Type: 'Investment_Cash',
            Year1: 100, Year2: 0, Year3: 0, Year4: 0, Year5: 0, Year6: 0, Year7: 0, Year8: 0, Year9: 0, Year10: 0
        },
        {
            StrategyName: 'Sample Strategy',
            BaselineCost: 100,
            Type: 'Investment_PL',
            Year1: 20, Year2: 20, Year3: 20, Year4: 20, Year5: 20, Year6: 0, Year7: 0, Year8: 0, Year9: 0, Year10: 0
        },
        {
            StrategyName: 'Sample Strategy',
            BaselineCost: 100,
            Type: 'Effect_Revenue',
            Year1: 0, Year2: 50, Year3: 100, Year4: 150, Year5: 200, Year6: 200, Year7: 200, Year8: 200, Year9: 200, Year10: 200
        },
        {
            StrategyName: 'Sample Strategy',
            BaselineCost: 100,
            Type: 'Effect_Cost',
            Year1: 0, Year2: 10, Year3: 20, Year4: 30, Year5: 40, Year6: 40, Year7: 40, Year8: 40, Year9: 40, Year10: 40
        },
        {
            StrategyName: 'Sample Strategy',
            BaselineCost: 100,
            Type: 'Effect_CF',
            Year1: 0, Year2: 40, Year3: 80, Year4: 120, Year5: 160, Year6: 160, Year7: 160, Year8: 160, Year9: 160, Year10: 160
        }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "ValueCase_Deal_Template.xlsx");
};
