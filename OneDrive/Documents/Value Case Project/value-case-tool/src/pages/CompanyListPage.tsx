import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllCompanies, fetchFinancialData, convertSnapshotToCompany, deleteCompany, type CompanySummary } from '../utils/api';
import { useCompany } from '../contexts/CompanyContext';
import { formatBillionYen } from '../utils/financialCalculations';
import { ArrowRight, RefreshCw, Search, Trash2 } from 'lucide-react';

const CompanyListPage: React.FC = () => {
    const [companies, setCompanies] = useState<CompanySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { setSelectedCompany } = useCompany();
    const navigate = useNavigate();

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const data = await fetchAllCompanies();
            setCompanies(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('企業リストの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCompany = async (ticker: string) => {
        try {
            // Fetch full data for the selected company
            // Note: In a real app, we might want to cache this or use the ID if the backend supported fetching by ID
            const snapshot = await fetchFinancialData(ticker);
            const company = convertSnapshotToCompany(snapshot);
            setSelectedCompany(company);
            navigate('/'); // Navigate to dashboard
        } catch (err) {
            console.error(err);
            alert('企業データの読み込みに失敗しました');
        }
    };

    const handleDeleteCompany = async (id: number, name: string) => {
        if (!confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) {
            return;
        }

        try {
            await deleteCompany(id);
            // Reload the list after deletion
            await loadCompanies();
        } catch (err) {
            console.error(err);
            alert('企業の削除に失敗しました');
        }
    };

    const filteredCompanies = companies.filter(c =>
        c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.ticker_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">取得済み企業リスト</h1>
                    <p className="text-gray-600">Yahoo Financeから取得した企業の履歴一覧です。</p>
                </div>
                <button
                    onClick={loadCompanies}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="リストを更新"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <input
                    type="text"
                    placeholder="企業名、コード、セクターで検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">読み込み中...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : companies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">取得済みの企業データはありません</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">コード</th>
                                    <th className="px-6 py-3">企業名</th>
                                    <th className="px-6 py-3">セクター</th>
                                    <th className="px-6 py-3 text-right">時価総額</th>
                                    <th className="px-6 py-3">最終更新日時</th>
                                    <th className="px-6 py-3 text-right">アクション</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{company.ticker_symbol}</td>
                                        <td className="px-6 py-4 text-gray-900">{company.company_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{company.sector || '-'}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">
                                            {company.market_cap ? formatBillionYen(company.market_cap / 100000000) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(company.data_fetched_at).toLocaleString('ja-JP')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleSelectCompany(company.ticker_symbol)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors font-medium text-xs mr-2"
                                            >
                                                表示
                                                <ArrowRight size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCompany(company.id, company.company_name || company.ticker_symbol)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors font-medium text-xs"
                                                title="削除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyListPage;
