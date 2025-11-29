import { useState, useEffect } from 'react';
import { Trash2, FileSpreadsheet, Presentation } from 'lucide-react';
import { loadDeals, deleteDeal } from '../utils/storage';
import type { SimulationDeal } from '../types/simulation';
import { useCompany } from '../contexts/CompanyContext';
import { exportToExcel, exportToPPT } from '../utils/exportUtils';

const SavedProgramsPage = () => {
    const [deals, setDeals] = useState<SimulationDeal[]>([]);
    const { allCompanies } = useCompany();

    useEffect(() => {
        setDeals(loadDeals());
    }, []);

    const handleDelete = (id: string) => {
        if (confirm('本当にこのディールを削除しますか？')) {
            deleteDeal(id);
            setDeals(loadDeals());
        }
    };

    const getCompanyName = (id: string) => {
        return allCompanies.find(c => c.id === id)?.name || '不明な企業';
    };

    const handleExportExcel = (deal: SimulationDeal) => {
        const company = allCompanies.find(c => c.id === deal.companyId);
        if (company) {
            exportToExcel(deal, company);
        }
    };

    const handleExportPPT = (deal: SimulationDeal) => {
        const company = allCompanies.find(c => c.id === deal.companyId);
        if (company) {
            exportToPPT(deal, company);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-900">保存済みディール</h1>
                <p className="text-gray-600">保存したシミュレーションシナリオを管理します。</p>
            </div>

            <div className="grid gap-6">
                {deals.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">保存されたディールはありません。</p>
                    </div>
                ) : (
                    deals.map((deal) => (
                        <div key={deal.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{deal.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {getCompanyName(deal.companyId)} • {new Date(deal.createdAt).toLocaleDateString()}
                                </p>
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-600">
                                        {deal.strategies.length} 施策
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleExportExcel(deal)}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Excelへエクスポート"
                                >
                                    <FileSpreadsheet size={20} />
                                </button>
                                <button
                                    onClick={() => handleExportPPT(deal)}
                                    className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    title="PowerPointへエクスポート"
                                >
                                    <Presentation size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(deal.id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="削除"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SavedProgramsPage;
