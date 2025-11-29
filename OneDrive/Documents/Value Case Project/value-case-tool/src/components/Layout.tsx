import { Outlet, Link } from 'react-router-dom';
import { BarChart3, PieChart, Save } from 'lucide-react';
import type { ReactNode } from 'react';

const Layout = ({ children }: { children?: ReactNode }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-indigo-600">Value Case Tool</h1>
                </div>
                <nav className="p-4 space-y-2">
                    <Link to="/" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                        <BarChart3 size={20} />
                        <span>財務比較</span>
                    </Link>
                    <Link to="/simulation" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                        <PieChart size={20} />
                        <span>シミュレーション</span>
                    </Link>
                    <Link to="/programs" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                        <Save size={20} />
                        <span>保存済みディール</span>
                    </Link>
                    <Link to="/companies" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                        <BarChart3 size={20} />
                        <span>取得済み企業リスト</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">ダッシュボード</h2>
                </header>
                <div className="p-8">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default Layout;
