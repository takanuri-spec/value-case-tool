import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import FinancialComparisonPage from './pages/FinancialComparisonPage';
import SavedProgramsPage from './pages/SavedProgramsPage';
import SimulationPage from './pages/SimulationPage';
import CompanyListPage from './pages/CompanyListPage';
import { CompanyProvider } from './contexts/CompanyContext';

function App() {
  return (
    <CompanyProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<FinancialComparisonPage />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/programs" element={<SavedProgramsPage />} />
            <Route path="/companies" element={<CompanyListPage />} />
          </Routes>
        </Layout>
      </Router>
    </CompanyProvider>
  );
}

export default App;
