// Financial calculation helpers

export const calculateEV = (marketCap: number, interestBearingDebt: number, cashAndEquivalents: number): number => {
    return marketCap + interestBearingDebt - cashAndEquivalents;
};

export const calculateEBITDA = (operatingIncome: number, depreciation: number): number => {
    return operatingIncome + depreciation;
};

export const calculateROIC = (operatingIncome: number, taxRate: number, interestBearingDebt: number, netAssets: number): number => {
    const nopat = operatingIncome * (1 - taxRate / 100);
    const investedCapital = interestBearingDebt + netAssets;
    if (investedCapital === 0) return 0;
    return (nopat / investedCapital) * 100;
};

export const calculateROE = (netIncome: number, netAssets: number): number => {
    if (netAssets === 0) return 0;
    return (netIncome / netAssets) * 100;
};

export const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
    if (startValue <= 0 || years <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value * 100000000); // Convert 億円 to Yen
};

export const formatBillionYen = (value: number): string => {
    return new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(value);
};
