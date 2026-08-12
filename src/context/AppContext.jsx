import { createContext, useContext, useState } from 'react';
import { currentUser, projects as initProjects, hostingProjects as initHosting, clients as initClients, clientServices as initClientServices, SERVICE_TYPES as initServiceTypes, ROLES,
} from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) { const [user, setUser]                     = useState(currentUser);
  const [projects, setProjects]             = useState(initProjects);
  const [hostingProjects, setHosting]       = useState(initHosting);
  const [clients, setClients]               = useState(initClients);
  const [clientServices, setClientServices] = useState(initClientServices);
  const [serviceTypes, setServiceTypes]     = useState(initServiceTypes);
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);

  const isManagement = user.role === ROLES.MANAGEMENT;
  const isPM         = user.role === ROLES.PM  || user.role === ROLES.MANAGEMENT;
  const isBD         = user.role === ROLES.BD  || user.role === ROLES.MANAGEMENT;

  // ── CLIENT CRUD ──────────────────────────────────────────────
  const addClient = (data) => { const c = { ...data, id: `c${Date.now()}`, since: new Date().toISOString().split('T')[0] };
    setClients(prev => [c, ...prev]);
    return c;
  };
  const updateClient = (id, data) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteClient = (id)       => setClients(prev => prev.filter(c => c.id !== id));

  // ── SERVICE TYPE CRUD ─────────────────────────────────────────
  const addServiceType = (data) => { const s = { ...data, id: `sv${Date.now()}` };
    setServiceTypes(prev => [...prev, s]);
    return s;
  };
  const updateServiceType = (id, data) => setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteServiceType = (id)       => setServiceTypes(prev => prev.filter(s => s.id !== id));

  // ── CLIENT SERVICE CRUD ───────────────────────────────────────
  const addClientService = (data) => { const cs = { ...data, id: `cs${Date.now()}`, status: data.status || 'active' };
    setClientServices(prev => [cs, ...prev]);
    return cs;
  };
  const updateClientService = (id, data) => setClientServices(prev => prev.map(cs => cs.id === id ? { ...cs, ...data } : cs));
  const deleteClientService = (id)       => setClientServices(prev => prev.filter(cs => cs.id !== id));

  // ── PROJECT CRUD ──────────────────────────────────────────────
  const addProject = (data) => { const p = { ...data, id: `p${Date.now()}`, status: 'active', completion: 0, blockers: [], achievements: [], documents: [], payments:   (data.payments   || []).map((pay, i) => ({ ...pay, id: `pay_${Date.now()}_${i}`, status: pay.status || 'upcoming', amount: parseInt(pay.amount) })), milestones: (data.milestones || []).filter(m => m.name.trim()).map((m, i) => ({ ...m, id: `m${Date.now()}_${i}`, status: 'upcoming', completedDate: null, cycleTargeted: false, linkedPaymentId: null })), };
    setProjects(prev => [p, ...prev]);
    return p;
  };
  const updateProject = (id, data) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deleteProject = (id)       => setProjects(prev => prev.filter(p => p.id !== id));

  const toggleMilestoneCycleTarget = (pid, mid) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: p.milestones.map(m => m.id === mid ? { ...m, cycleTargeted: !m.cycleTargeted } : m) } : p));

  // ── MILESTONE CRUD ────────────────────────────────────────────
  const addMilestone = (pid, data) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: [...p.milestones, { ...data, id: `m${Date.now()}`, status: 'upcoming', completedDate: null, cycleTargeted: false, linkedPaymentId: null }] } : p));
  const updateMilestone = (pid, mid, data) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: p.milestones.map(m => m.id === mid ? { ...m, ...data } : m) } : p));
  const deleteMilestone = (pid, mid) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: p.milestones.filter(m => m.id !== mid) } : p));

  // ── PAYMENT CRUD ──────────────────────────────────────────────
  const addPayment = (pid, data) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, payments: [...p.payments, { ...data, id: `pay${Date.now()}`, amount: parseInt(data.amount) }] } : p));
  const updatePayment = (pid, payId, data) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, payments: p.payments.map(pay => pay.id === payId ? { ...pay, ...data, amount: parseInt(data.amount) || pay.amount } : pay) } : p));
  const deletePayment = (pid, payId) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, payments: p.payments.filter(pay => pay.id !== payId) } : p));

  // ── BLOCKERS / ACHIEVEMENTS ───────────────────────────────────
  const addBlocker    = (pid, b) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, blockers: [...p.blockers, { ...b, id: `b${Date.now()}`, addedAt: new Date().toISOString().split('T')[0], resolved: false }] } : p));
  const resolveBlocker= (pid, bid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, blockers: p.blockers.map(b => b.id === bid ? { ...b, resolved: true } : b) } : p));
  const deleteBlocker = (pid, bid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, blockers: p.blockers.filter(b => b.id !== bid) } : p));
  const addAchievement= (pid, a)   => setProjects(prev => prev.map(p => p.id === pid ? { ...p, achievements: [...p.achievements, { ...a, id: `a${Date.now()}`, addedAt: new Date().toISOString().split('T')[0] }] } : p));
  const deleteAchievement = (pid, aid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, achievements: p.achievements.filter(a => a.id !== aid) } : p));

  // ── HOSTING CRUD ──────────────────────────────────────────────
  const addHosting    = (data) => setHosting(prev => [{ ...data, id: `h${Date.now()}` }, ...prev]);
  const updateHosting = (id, data) => setHosting(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
  const deleteHosting = (id)       => setHosting(prev => prev.filter(h => h.id !== id));

  return (
    <AppContext.Provider value={{ user, setUser, projects, hostingProjects, clients, clientServices, serviceTypes, sidebarOpen, setSidebarOpen, showAddProject, setShowAddProject, isManagement, isPM, isBD, // clients
      addClient, updateClient, deleteClient, // service types
      addServiceType, updateServiceType, deleteServiceType, // client services
      addClientService, updateClientService, deleteClientService, // projects
      addProject, updateProject, deleteProject, toggleMilestoneCycleTarget, // milestones
      addMilestone, updateMilestone, deleteMilestone, // payments
      addPayment, updatePayment, deletePayment, // blockers / achievements
      addBlocker, resolveBlocker, deleteBlocker, addAchievement, deleteAchievement, // hosting
      addHosting, updateHosting, deleteHosting, }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
