import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { Company } from '../types/finance';
import { useCompany } from '../contexts/CompanyContext';
import { fetchFinancialData, convertSnapshotToCompany } from '../utils/api';

const CompanySearch: React.FC = () => {
    const { setSelectedCompany, allCompanies } = useCompany();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Company[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Removed useEffect that syncs query with selectedCompany

    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        if (value.length > 0) {
            const filtered = allCompanies.filter(c =>
                c.name.toLowerCase().includes(value.toLowerCase()) ||
                c.code.includes(value)
            );
            setResults(filtered);
            setIsOpen(true);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (company: Company) => {
        setSelectedCompany(company);
        setQuery(''); // Clear input after selection
        setIsOpen(false);
    };

    const handleImport = async () => {
        if (!query) return;

        setIsImporting(true);
        setImportError(null);

        try {
            // Determine ticker symbol
            let ticker = query.trim();

            // If user enters just 4 digits (Japanese stock code), append .T
            if (/^\d{4}$/.test(ticker)) {
                ticker += '.T';
            }

            const snapshot = await fetchFinancialData(ticker);
            const company = convertSnapshotToCompany(snapshot);

            setSelectedCompany(company);
            setQuery(''); // Clear input after success
            setIsOpen(false);
            alert(`財務データを取得しました: ${company.name}`);

        } catch (err: any) {
            console.error(err);
            setImportError(err.message || 'データの取得に失敗しました');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl relative">
            <div className="flex gap-2">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        placeholder="証券コード (例: 7203.T) または企業名で検索..."
                        value={query}
                        onChange={handleSearch}
                        onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                </div>
                <button
                    onClick={handleImport}
                    disabled={!query || isImporting}
                    className={`px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center gap-2 whitespace-nowrap
                        ${!query || isImporting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'}`}
                >
                    {isImporting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            取得中...
                        </>
                    ) : (
                        'Yahoo Financeから取得'
                    )}
                </button>
            </div>
            <div className="flex items-center justify-between mt-1 ml-1">
                <p className="text-xs text-gray-500">
                    ※ 任意の証券コード（例: 9984.T）または米国株ティッカー（例: AAPL）を入力して取得できます。
                </p>
                <a
                    href="https://finance.yahoo.co.jp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                >
                    コード検索はこちら (Yahoo!ファイナンス)
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>

            {importError && (
                <p className="text-red-500 text-sm mt-2 ml-1">{importError}</p>
            )}

            {isOpen && results.length > 0 && (
                <div className="absolute z-10 w-full max-w-md mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map(company => (
                        <button
                            key={company.id}
                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
                            onClick={() => handleSelect(company)}
                        >
                            <span className="font-medium text-gray-900">{company.name}</span>
                            <span className="text-sm text-gray-500">{company.code}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CompanySearch;
