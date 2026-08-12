import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, error } = useAuth();
  const navigate         = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#EDF2FA',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
        boxShadow: '0 12px 40px rgba(27,46,107,0.14)',
        border: '1px solid #C8D8EE', overflow: 'hidden',
        margin: 20,
      }}>

        {/* Header bar — matches Nexus PM nav style */}
        <div style={{
          background: '#1B2E6B', padding: '28px 32px 24px',
          borderBottom: '3px solid #2E6DB4',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#4A90D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>N</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Nexus PM</div>
              <div style={{ fontSize: 12, color: 'rgba(168,206,236,0.7)' }}>Project Management System</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '28px 32px' }}>

          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #9B1C1C28',
              borderRadius: 8, padding: '10px 14px', marginBottom: 18,
              fontSize: 14, color: '#9B1C1C',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@nexuspm.in"
              style={{
                width: '100%', padding: '10px 13px', fontSize: 14,
                border: '1px solid #C8D8EE', borderRadius: 8,
                background: '#F4F7FC', color: '#111827', outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#2E6DB4'}
              onBlur={e  => e.target.style.borderColor = '#C8D8EE'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 13px', fontSize: 14,
                border: '1px solid #C8D8EE', borderRadius: 8,
                background: '#F4F7FC', color: '#111827', outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#2E6DB4'}
              onBlur={e  => e.target.style.borderColor = '#C8D8EE'}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px', fontSize: 14, fontWeight: 700,
              background: loading ? '#6B9DC7' : '#2E6DB4', color: '#fff',
              border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s', fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#1B5FA8'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#2E6DB4'; }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

        </form>
      </div>
    </div>
  );
}
