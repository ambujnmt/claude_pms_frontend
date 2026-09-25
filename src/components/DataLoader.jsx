import { useApp } from '../context/AppContext';

/* Shows a full-screen spinner while AppContext loads all data from API */
export default function DataLoader({ children }) {
  const { dataLoading, dataError, loadAllData } = useApp();

  if (dataLoading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: '#EDF2FA',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, fontFamily: 'Inter, sans-serif',
      }}>
        {/* Animated logo */}
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#1B2E6B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 26, fontWeight: 800 }}>N</span>
        </div>

        {/* Spinner */}
        <div style={{ width: 32, height: 32, border: '3px solid #C8D8EE', borderTopColor: '#2E6DB4', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }}/>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1B2E6B' }}>Loading Nexus PM</div>
          <div style={{ fontSize: 13, color: '#6B7A99', marginTop: 4 }}>Fetching your data…</div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (dataError) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, background: '#EDF2FA',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1B2E6B' }}>Failed to load data</div>
        <div style={{ fontSize: 13, color: '#6B7A99' }}>{dataError}</div>
        <button onClick={loadAllData} style={{ padding: '8px 20px', borderRadius: 8, background: '#2E6DB4', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  return children;
}
