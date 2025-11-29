import React from 'react';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { SimulationResult } from '../types/simulation';
import { formatBillionYen } from '../utils/financialCalculations';

interface SimulationDashboardProps {
    results: SimulationResult[];
}

const SimulationDashboard: React.FC<SimulationDashboardProps> = ({ results }) => {
    if (results.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
                シミュレーション結果がありません
            </div>
        );
    }

    const chartData = results.map(r => ({
        year: r.year,
        '売上(Base)': r.baseRevenue,
        '売上(Total)': r.totalRevenue,
        'EBIT(Base)': r.baseEbit,
        'EBIT(Total)': r.totalEbit,
        'FCF(Base)': r.baseFcf,
        'FCF(Total)': r.totalFcf
    }));

    // Generate a key based on the data to force re-render if needed
    const chartKey = JSON.stringify(chartData);

    return (
        <div className="space-y-6">
            {/* グラフ */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">10年間の財務予測グラフ</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData} key={chartKey}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: '年度', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: '億円', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        {/* Base Lines (Dashed, lighter) */}
                        <Line type="monotone" dataKey="売上(Base)" stroke="#8884d8" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="EBIT(Base)" stroke="#82ca9d" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="FCF(Base)" stroke="#ffc658" strokeDasharray="5 5" strokeWidth={1} dot={false} />

                        {/* Total Lines (Solid, bolder) */}
                        <Line type="monotone" dataKey="売上(Total)" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="EBIT(Total)" stroke="#82ca9d" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="FCF(Total)" stroke="#ffc658" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* テーブル */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">10年間の財務予測テーブル</h3>
                    <span className="text-sm text-gray-500">(単位: 億円)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="px-6 py-3 text-left sticky left-0 bg-gray-50">指標</th>
                                {results.map(r => (
                                    <th key={r.year} className="px-6 py-3 text-right">{r.year}年度</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <TableRow label="売上（ベース）" data={results.map(r => r.baseRevenue)} />
                            <TableRow label="売上（インパクト）" data={results.map(r => r.impactRevenue)} />
                            <TableRow label="売上（合計）" data={results.map(r => r.totalRevenue)} highlight />
                            <tr className="bg-gray-50">
                                <td className="px-6 py-2" colSpan={results.length + 1}></td>
                            </tr>
                            <TableRow label="EBIT（ベース）" data={results.map(r => r.baseEbit)} />
                            <TableRow label="EBIT（インパクト）" data={results.map(r => r.impactEbit)} />
                            <TableRow label="EBIT（合計）" data={results.map(r => r.totalEbit)} highlight />
                            <tr className="bg-gray-50">
                                <td className="px-6 py-2" colSpan={results.length + 1}></td>
                            </tr>
                            <TableRow label="FCF（ベース）" data={results.map(r => r.baseFcf)} />
                            <TableRow label="FCF（インパクト）" data={results.map(r => r.impactFcf)} />
                            <TableRow label="FCF（合計）" data={results.map(r => r.totalFcf)} highlight />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

interface TableRowProps {
    label: string;
    data: number[];
    highlight?: boolean;
}

const TableRow: React.FC<TableRowProps> = ({ label, data, highlight }) => (
    <tr className={highlight ? 'bg-indigo-50 font-medium' : ''}>
        <td className={`px-6 py-4 sticky left-0 ${highlight ? 'bg-indigo-50' : 'bg-white'}`}>{label}</td>
        {data.map((value, i) => (
            <td key={i} className="px-6 py-4 text-right">
                {formatBillionYen(value)}
            </td>
        ))}
    </tr>
);

export default SimulationDashboard;
