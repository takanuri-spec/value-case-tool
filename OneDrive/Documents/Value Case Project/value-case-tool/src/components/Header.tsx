import { useCompany } from '../contexts/CompanyContext';
import CompanySearch from './CompanySearch';

const Header = () => {
    const {
        selectedCompany,
        availableDeals,
        selectedDealId,
        selectDeal
    } = useCompany();

    const selectedDeal = availableDeals.find(d => d.id === selectedDealId);

    return (
        <header className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex flex-col gap-6">
                {/* Top Row: Search and Deal Selection */}
                <div className="flex items-center gap-4">
                    <div className="w-96">
                        <CompanySearch />
                    </div>

                    {/* Deal Selector - Show if deals exist */}
                    <div className="w-64">
                        <select
                            value={selectedDealId || ''}
                            onChange={(e) => selectDeal(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        >
                            <option value="">ディールを選択...</option>
                            {availableDeals.map(deal => {
                                // Find company name for this deal to display in dropdown if needed
                                // But usually deal name is enough if context is clear.
                                // Let's just show Deal Name
                                return (
                                    <option key={deal.id} value={deal.id}>
                                        {deal.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {/* Bottom Row: Large Titles */}
                <div className="flex items-baseline gap-4">
                    {selectedCompany ? (
                        <>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {selectedCompany.name}
                            </h1>
                            <span className="text-xl text-gray-500">
                                {selectedCompany.code}
                            </span>
                        </>
                    ) : (
                        <h1 className="text-3xl font-bold text-gray-400">
                            企業を選択してください
                        </h1>
                    )}

                    {selectedDeal && (
                        <>
                            <span className="text-2xl text-gray-300">/</span>
                            <h2 className="text-2xl font-semibold text-indigo-600">
                                {selectedDeal.name}
                            </h2>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
