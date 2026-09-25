import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AddProjectModal from './AddProjectModal';
import DataLoader from './DataLoader';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { sidebarOpen, showAddProject } = useApp();

  return (
    <DataLoader>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-surface)' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar />
          <main style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            <Outlet />
          </main>
        </div>
      </div>
      {showAddProject && <AddProjectModal />}
    </DataLoader>
  );
}
