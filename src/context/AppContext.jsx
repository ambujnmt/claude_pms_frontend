import { createContext, useContext, useState, useCallback } from 'react';
import {
  projects as initProjects,
  hostingProjects as initHosting,
  clientServices as initClientServices,
  SERVICE_TYPES as initServiceTypes,
} from '../data/mockData';
import { useAuth } from './AuthContext';
import { formatAmount } from '../components/UI';

const AppContext = createContext(null);

/* Default INR currency (used before API loads) */
const DEFAULT_CURRENCY = {
  id: 1, name: 'Indian Rupee', code: 'INR', symbol: '₹',
  symbolPosition: 'prefix', decimalPlaces: 2,
  thousandsSeparator: ',', decimalSeparator: '.',
  useLakhSystem: true, isDefault: true, isActive: true,
};

export function AppProvider({ children }) {
  const { user, isManagement: authIsManagement, isPM: authIsPM, isBD: authIsBD, logout } = useAuth();

  // ── Data state ────────────────────────────────────────────────
  const [clients, setClients]               = useState([]);
  const [projects, setProjects]             = useState(initProjects);
  const [hostingProjects, setHosting]       = useState(initHosting);
  const [clientServices, setClientServices] = useState(initClientServices);
  const [serviceTypes, setServiceTypes]     = useState(initServiceTypes);
  const [currencies, setCurrencies]         = useState([DEFAULT_CURRENCY]);
  const [activeCurrency, setActiveCurrency] = useState(DEFAULT_CURRENCY);

  // ── UI state ──────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen]       = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);

  // ── Roles ─────────────────────────────────────────────────────
  const isManagement = authIsManagement;
  const isPM         = authIsPM;
  const isBD         = authIsBD;

  /* fmt — dynamic currency formatter, use this everywhere instead of formatCurrency */
  const fmt = useCallback(
    (value) => formatAmount(value, activeCurrency),
    [activeCurrency]
  );

  // ── Client CRUD ───────────────────────────────────────────────
  const addClient    = (c)        => setClients(prev => [c, ...prev]);
  const updateClient = (id, data) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteClient = (id)       => setClients(prev => prev.filter(c => c.id !== id));

  // ── Service Type CRUD ─────────────────────────────────────────
  const addServiceType    = (s)        => setServiceTypes(prev => [...prev, s]);
  const updateServiceType = (id, data) => setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteServiceType = (id)       => setServiceTypes(prev => prev.filter(s => s.id !== id));

  // ── Client Service CRUD ───────────────────────────────────────
  const addClientService    = (cs)       => setClientServices(prev => [cs, ...prev]);
  const updateClientService = (id, data) => setClientServices(prev => prev.map(cs => cs.id === id ? { ...cs, ...data } : cs));
  const deleteClientService = (id)       => setClientServices(prev => prev.filter(cs => cs.id !== id));

  // ── Currency CRUD ─────────────────────────────────────────────
  const addCurrency    = (c)        => setCurrencies(prev => [...prev, c]);
  const updateCurrency = (id, data) => {
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    if (activeCurrency.id === id) setActiveCurrency(prev => ({ ...prev, ...data }));
  };
  const deleteCurrency = (id)       => setCurrencies(prev => prev.filter(c => c.id !== id));
  const setDefaultCurrency = (currency) => {
    setCurrencies(prev => prev.map(c => ({ ...c, isDefault: c.id === currency.id })));
    setActiveCurrency(currency);
  };

  // ── Project CRUD ──────────────────────────────────────────────
  const addProject = (data) => {
    const p = { ...data, id: `p${Date.now()}`, status:'active', completion:0, blockers:[], achievements:[], documents:[], payments: data.payments||[], milestones: data.milestones||[] };
    setProjects(prev => [p, ...prev]);
    return p;
  };
  const updateProject = (id, data) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deleteProject = (id)       => setProjects(prev => prev.filter(p => p.id !== id));

  const toggleMilestoneCycleTarget = (pid, mid) =>
    setProjects(prev => prev.map(p => p.id === pid
      ? { ...p, milestones: p.milestones.map(m => m.id === mid ? { ...m, cycleTargeted: !m.cycleTargeted } : m) }
      : p));

  // Milestones
  const addMilestone    = (pid, data) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: [...p.milestones, { ...data, id:`m${Date.now()}`, status:'upcoming', completedDate:null, cycleTargeted:false, linkedPaymentId:null }] } : p));
  const updateMilestone = (pid, mid, data) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: p.milestones.map(m => m.id === mid ? { ...m, ...data } : m) } : p));
  const deleteMilestone = (pid, mid)       => setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: p.milestones.filter(m => m.id !== mid) } : p));

  // Payments
  const addPayment    = (pid, data)        => setProjects(prev => prev.map(p => p.id === pid ? { ...p, payments: [...p.payments, { ...data, id:`pay${Date.now()}`, amount:parseInt(data.amount) }] } : p));
  const updatePayment = (pid, payId, data) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, payments: p.payments.map(pay => pay.id === payId ? { ...pay, ...data, amount:parseInt(data.amount)||pay.amount } : pay) } : p));
  const deletePayment = (pid, payId)       => setProjects(prev => prev.map(p => p.id === pid ? { ...p, payments: p.payments.filter(pay => pay.id !== payId) } : p));

  // Blockers / Achievements
  const addBlocker      = (pid, b)   => setProjects(prev => prev.map(p => p.id === pid ? { ...p, blockers: [...p.blockers, { ...b, id:`b${Date.now()}`, addedAt:new Date().toISOString().split('T')[0], resolved:false }] } : p));
  const resolveBlocker  = (pid, bid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, blockers: p.blockers.map(b => b.id === bid ? { ...b, resolved:true } : b) } : p));
  const deleteBlocker   = (pid, bid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, blockers: p.blockers.filter(b => b.id !== bid) } : p));
  const addAchievement  = (pid, a)   => setProjects(prev => prev.map(p => p.id === pid ? { ...p, achievements: [...p.achievements, { ...a, id:`a${Date.now()}`, addedAt:new Date().toISOString().split('T')[0] }] } : p));
  const deleteAchievement = (pid, aid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, achievements: p.achievements.filter(a => a.id !== aid) } : p));

  // Hosting
  const addHosting    = (data) => setHosting(prev => [{ ...data, id:`h${Date.now()}` }, ...prev]);
  const updateHosting = (id, data) => setHosting(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
  const deleteHosting = (id)       => setHosting(prev => prev.filter(h => h.id !== id));

  return (
    <AppContext.Provider value={{
      user, logout,
      // data
      clients, setClients,
      projects, setProjects,
      hostingProjects, setHosting,
      clientServices, setClientServices,
      serviceTypes, setServiceTypes,
      currencies, setCurrencies,
      activeCurrency, setActiveCurrency,
      // ui
      sidebarOpen, setSidebarOpen,
      showAddProject, setShowAddProject,
      // roles
      isManagement, isPM, isBD,
      // currency
      fmt,
      addCurrency, updateCurrency, deleteCurrency, setDefaultCurrency,
      // client
      addClient, updateClient, deleteClient,
      // service types
      addServiceType, updateServiceType, deleteServiceType,
      // client services
      addClientService, updateClientService, deleteClientService,
      // projects
      addProject, updateProject, deleteProject, toggleMilestoneCycleTarget,
      // milestones
      addMilestone, updateMilestone, deleteMilestone,
      // payments
      addPayment, updatePayment, deletePayment,
      // blockers / achievements
      addBlocker, resolveBlocker, deleteBlocker,
      addAchievement, deleteAchievement,
      // hosting
      addHosting, updateHosting, deleteHosting,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
