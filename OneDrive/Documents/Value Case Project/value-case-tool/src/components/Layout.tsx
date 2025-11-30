import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, PieChart, Save, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import Header from './Header';

const Layout = ({ children }: { children?: ReactNode }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const getLinkClass = (path: string) => {
        const baseClass = "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors whitespace-nowrap";
        return isActive(path)
            ? `${baseClass} bg-indigo-50 text-indigo-600 font-medium`
            : `${baseClass} text-gray-700 hover:bg-gray-100 hover:text-gray-900`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'w-64' : 'w-16'}
                `}
            >
                <div className="p-4 border-b border-gray-200 flex items-center justify-between h-16">
                    {isSidebarOpen ? (
                        <h1 className="text-xl font-bold text-indigo-600 truncate">Value Case Tool</h1>
                    ) : (
                        <span className="text-xl font-bold text-indigo-600 mx-auto">V</span>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                        title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
                    >
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
                    <Link to="/" className={getLinkClass('/')} title="財務比較">
                        <BarChart3 size={20} className="flex-shrink-0" />
                        {isSidebarOpen && <span>財務比較</span>}
                    </Link>
                    <Link to="/simulation" className={getLinkClass('/simulation')} title="シミュレーション">
                        <PieChart size={20} className="flex-shrink-0" />
                        {isSidebarOpen && <span>シミュレーション</span>}
                    </Link>
                    <Link to="/programs" className={getLinkClass('/programs')} title="保存済みディール">
                        <Save size={20} className="flex-shrink-0" />
                        {isSidebarOpen && <span>保存済みディール</span>}
                    </Link>
                    <Link to="/companies" className={getLinkClass('/companies')} title="取得済み企業リスト">
                        <Building2 size={20} className="flex-shrink-0" />
                        {isSidebarOpen && <span>取得済み企業リスト</span>}
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto flex flex-col h-screen">
                <Header />
                <div className="p-8 flex-1 overflow-y-auto">
                    {children || <Outlet />}
                </div>
            </main>
        </div>
    );
};

export default Layout;
