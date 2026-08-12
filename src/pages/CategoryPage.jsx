import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, StatusBadge, ProgressBar, Badge, formatCurrency } from '../components/UI';
import { CATEGORIES } from '../data/mockData';

const CAT_META = { [CATEGORIES.WEBSITE]: { emoji: '🌐', desc: 'Web portals, corporate sites & e-commerce platforms', color: 'var(--accent)' }, [CATEGORIES.MOBILE]:  { emoji: '📱', desc: 'iOS, Android & cross-platform mobile applications', color: 'var(--violet)' }, [CATEGORIES.AI_ML]:   { emoji: '🤖', desc: 'Machine learning, NLP & AI-driven products', color: 'var(--orange)' },
};

const catColor = { Website: 'var(--accent)', 'Mobile App': 'var(--violet)', 'AI/ML': 'var(--orange)' };

export default function CategoryPage() { const { projects } = useApp();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in">
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {Object.entries(CAT_META).map(([cat, meta]) => { const cProjects    = projects.filter(p => p.category === cat);
          const totalBudget  = cProjects.reduce((s, p) => s + p.budget, 0);
          const avgComp      = cProjects.length ? Math.round(cProjects.reduce((s, p) => s + p.completion, 0) / cProjects.length) : 0;
          return (
            <Card key={cat} style={{ borderTop: `3px solid ${meta.color}`, padding: '20px 22px' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{meta.emoji}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{cat}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.7 }}>{meta.desc}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Projects', val: cProjects.length }, { label: 'Budget', val: formatCurrency(totalBudget) }, { label: 'Avg Done', val: `${avgComp}%` }, ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 8, background: `${meta.color}08` }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, color: meta.color }}>{s.val}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700, marginTop: 1 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Per-category project lists */}
      {Object.entries(CAT_META).map(([cat, meta]) => { const cProjects = projects.filter(p => p.category === cat);
        if (!cProjects.length) return null;
        return (
          <div key={cat}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>{meta.emoji}</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: 22 }}>{cat}</h2>
              <div style={{ height: 1, flex: 1, background: `${meta.color}30`, marginLeft: 6 }} />
              <Badge label={`${cProjects.length} project${cProjects.length > 1 ? 's' : ''}`} color={meta.color} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
              {cProjects.map(p => (
                <Card key={p.id} hover onClick={() => navigate(`/projects/${p.id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ width: 3, height: 28, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 1 }}>{p.client}</div>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Completion</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: p.color, }}>{p.completion}%</span>
                    </div>
                    <ProgressBar value={p.completion} color={p.color} height={4} bg="var(--bg-elevated)" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-muted)' }}>
                    <span>{formatCurrency(p.budget)}</span>
                    <span>{p.milestones.filter(m => m.status === 'completed').length}/{p.milestones.length} milestones</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
