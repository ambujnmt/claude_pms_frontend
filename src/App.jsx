import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider }     from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout              from './components/Layout';
import LoginPage           from './pages/LoginPage';
import Dashboard           from './pages/Dashboard';
import ClientsPage         from './pages/ClientsPage';
import ClientDetail        from './pages/ClientDetail';
import ProjectsPage        from './pages/ProjectsPage';
import ProjectDetail       from './pages/ProjectDetail';
import MilestonesPage      from './pages/MilestonesPage';
import ResourcesPage       from './pages/ResourcesPage';
import CategoryPage        from './pages/CategoryPage';
import HostingPage         from './pages/HostingPage';
import ServicesPage        from './pages/ServicesPage';
import MaintenancePage     from './pages/MaintenancePage';
import CurrenciesPage      from './pages/CurrenciesPage';
import TeamPage            from './pages/TeamPage';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#EDF2FA', fontSize:14, color:'#6B7A99', fontFamily:'Inter, sans-serif' }}>
      Loading…
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="clients"          element={<ClientsPage />} />
              <Route path="clients/:id"      element={<ClientDetail />} />
              <Route path="projects"         element={<ProjectsPage />} />
              <Route path="projects/:id"     element={<ProjectDetail />} />
              <Route path="milestones"       element={<MilestonesPage />} />
              <Route path="resources"        element={<ResourcesPage />} />
              <Route path="team"             element={<TeamPage />} />
              <Route path="categories"       element={<CategoryPage />} />
              <Route path="hosting"          element={<HostingPage />} />
              <Route path="services"         element={<ServicesPage />} />
              <Route path="maintenance"      element={<MaintenancePage />} />
              <Route path="currencies"       element={<CurrenciesPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
}
