import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AddProjectModal from './AddProjectModal';
import { useApp } from '../context/AppContext';

export default function Layout() { const { showAddProject } = useApp();
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <main style={{ flex: 1, overflow: 'auto', padding: '22px 24px' }}>
          <Outlet />
        </main>
      </div>
      {showAddProject && <AddProjectModal />}
    </div>
  );
}
