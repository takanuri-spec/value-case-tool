import { useCompany } from '../contexts/CompanyContext';
import FinancialDashboard from '../components/FinancialDashboard';

const FinancialComparisonPage = () => {
    const { selectedCompany } = useCompany();

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">企業財務比較</h1>
                    <p className="text-gray-600">企業の財務情報を横並びで比較し、成長性や収益性を分析します。</p>
                </div>

                {/* Content */}
                {selectedCompany ? (
                    <FinancialDashboard company={selectedCompany} />
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-500">企業を選択してください</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialComparisonPage;
