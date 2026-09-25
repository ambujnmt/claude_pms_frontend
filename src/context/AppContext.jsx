import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { formatAmount } from '../components/UI';

import clientService      from '../services/clientService';
import projectService     from '../services/projectService';
import serviceTypeService from '../services/serviceTypeService';
import clientServiceApi   from '../services/clientServiceApi';
import hostingService     from '../services/hostingService';
import currencyService    from '../services/currencyService';
import categoryService    from '../services/categoryService';
import userService        from '../services/userService';

const AppContext = createContext(null);

const DEFAULT_CURRENCY = {
  id: 1, name:'Indian Rupee', code:'INR', symbol:'₹',
  symbolPosition:'prefix', decimalPlaces:2,
  thousandsSeparator:',', decimalSeparator:'.',
  useLakhSystem:true, isDefault:true, isActive:true,
};

export function AppProvider({ children }) {
  const { user, isManagement:authIsManagement, isPM:authIsPM, isBD:authIsBD, logout } = useAuth();

  const [clients,        setClients]        = useState([]);
  const [projects,       setProjects]       = useState([]);
  const [hostingProjects,setHosting]        = useState([]);
  const [clientServices, setClientServices] = useState([]);
  const [serviceTypes,   setServiceTypes]   = useState([]);
  const [categories,     setCategories]     = useState([]);
  const [users,          setUsers]          = useState([]);
  const [currencies,     setCurrencies]     = useState([DEFAULT_CURRENCY]);
  const [activeCurrency, setActiveCurrency] = useState(DEFAULT_CURRENCY);

  const [dataLoading, setDataLoading] = useState(false);
  const [dataError,   setDataError]   = useState(null);

  const [sidebarOpen,     setSidebarOpen]     = useState(true);
  const [showAddProject,  setShowAddProject]  = useState(false);

  const isManagement = authIsManagement;
  const isPM         = authIsPM;
  const isBD         = authIsBD;

  const fmt = useCallback((value) => formatAmount(value, activeCurrency), [activeCurrency]);

  const loadAllData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const [
        clientsData, projectsData, servicesData,
        clientServicesData, hostingData, currenciesData, categoriesData, usersData,
      ] = await Promise.all([
        clientService.getAll(),
        projectService.getAll(),
        serviceTypeService.getAll(),
        clientServiceApi.getAll(),
        hostingService.getAll(),
        currencyService.getAll(),
        categoryService.getAll(),
        userService.getAll(),
      ]);

      setClients(clientsData);
      setProjects(projectsData);
      setServiceTypes(servicesData);
      setClientServices(clientServicesData);
      setHosting(hostingData);
      setCurrencies(currenciesData.list);
      if (currenciesData.default) setActiveCurrency(currenciesData.default);
      setCategories(categoriesData);
      setUsers(usersData);

    } catch (err) {
      console.error('Failed to load app data:', err);
      setDataError('Failed to load data. Please refresh the page.');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setClients([]); setProjects([]); setHosting([]);
      setClientServices([]); setServiceTypes([]); setCategories([]); setUsers([]);
      setCurrencies([DEFAULT_CURRENCY]); setActiveCurrency(DEFAULT_CURRENCY);
    }
  }, [user]);

  /* Currency CRUD */
  const addCurrency    = (c)        => setCurrencies(prev => [...prev, c]);
  const updateCurrency = (id, data) => {
    setCurrencies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    if (activeCurrency.id === id) setActiveCurrency(prev => ({ ...prev, ...data }));
  };
  const deleteCurrency     = (id)       => setCurrencies(prev => prev.filter(c => c.id !== id));
  const setDefaultCurrency = (currency) => {
    setCurrencies(prev => prev.map(c => ({ ...c, isDefault: c.id === currency.id })));
    setActiveCurrency(currency);
  };

  /* Category CRUD */
  const addCategory    = (c)        => setCategories(prev => [...prev, c]);
  const updateCategory = (id, data) => setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteCategory = (id)       => setCategories(prev => prev.filter(c => c.id !== id));

  /* User / Team CRUD */
  const addUser    = (u)        => setUsers(prev => [...prev, u]);
  const updateUser = (id, data) => setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  const deleteUser = (id)       => setUsers(prev => prev.filter(u => u.id !== id));

  /* Client CRUD */
  const addClient    = (c)        => setClients(prev => [c, ...prev]);
  const updateClient = (id, data) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteClient = (id)       => setClients(prev => prev.filter(c => c.id !== id));

  /* Service Type CRUD */
  const addServiceType    = (s)        => setServiceTypes(prev => [...prev, s]);
  const updateServiceType = (id, data) => setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteServiceType = (id)       => setServiceTypes(prev => prev.filter(s => s.id !== id));

  /* Client Service CRUD */
  const addClientService    = (cs)       => setClientServices(prev => [cs, ...prev]);
  const updateClientService = (id, data) => setClientServices(prev => prev.map(cs => cs.id === id ? { ...cs, ...data } : cs));
  const deleteClientService = (id)       => setClientServices(prev => prev.filter(cs => cs.id !== id));

  /* Project CRUD */
  const addProject = (data) => {
    const p = { ...data, id:`p${Date.now()}`, status:'active', completion:0, blockers:[], achievements:[], documents:[], payments:data.payments||[], milestones:data.milestones||[], resources:data.resources||[] };
    setProjects(prev => [p, ...prev]);
    return p;
  };
  const updateProject = (id, data) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  const deleteProject = (id)       => setProjects(prev => prev.filter(p => p.id !== id));

  const toggleMilestoneCycleTarget = (pid, mid) =>
    setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones: p.milestones.map(m => m.id === mid ? { ...m, cycleTargeted: !m.cycleTargeted } : m) } : p));

  const addMilestone    = (pid, data) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones:[...p.milestones,{...data,id:`m${Date.now()}`,status:'upcoming',completedDate:null,cycleTargeted:false,linkedPaymentId:null}] } : p));
  const updateMilestone = (pid, mid, data) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones:p.milestones.map(m => m.id===mid?{...m,...data}:m) } : p));
  const deleteMilestone = (pid, mid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, milestones:p.milestones.filter(m => m.id!==mid) } : p));

  const addPayment    = (pid, data)        => setProjects(prev => prev.map(p => p.id===pid?{...p,payments:[...p.payments,{...data,id:`pay${Date.now()}`,amount:parseFloat(data.amount)}]}:p));
  const updatePayment = (pid, payId, data) => setProjects(prev => prev.map(p => p.id===pid?{...p,payments:p.payments.map(pay=>pay.id===payId?{...pay,...data,amount:parseFloat(data.amount)||pay.amount}:pay)}:p));
  const deletePayment = (pid, payId)       => setProjects(prev => prev.map(p => p.id===pid?{...p,payments:p.payments.filter(pay=>pay.id!==payId)}:p));

  const addBlocker      = (pid, b)   => setProjects(prev => prev.map(p => p.id===pid?{...p,blockers:[{...b,id:`b${Date.now()}`,addedAt:new Date().toISOString().split('T')[0],resolved:false},...p.blockers]}:p));
  const resolveBlocker  = (pid, bid) => setProjects(prev => prev.map(p => p.id===pid?{...p,blockers:p.blockers.map(b=>b.id===bid?{...b,resolved:true}:b)}:p));
  const deleteBlocker   = (pid, bid) => setProjects(prev => prev.map(p => p.id===pid?{...p,blockers:p.blockers.filter(b=>b.id!==bid)}:p));
  const addAchievement  = (pid, a)   => setProjects(prev => prev.map(p => p.id===pid?{...p,achievements:[{...a,id:`a${Date.now()}`,addedAt:new Date().toISOString().split('T')[0]},...p.achievements]}:p));
  const deleteAchievement=(pid,aid)  => setProjects(prev => prev.map(p => p.id===pid?{...p,achievements:p.achievements.filter(a=>a.id!==aid)}:p));

  const addHosting    = (data)     => setHosting(prev => [{...data,id:`h${Date.now()}`},...prev]);
  const updateHosting = (id, data) => setHosting(prev => prev.map(h => h.id===id?{...h,...data}:h));
  const deleteHosting = (id)       => setHosting(prev => prev.filter(h => h.id!==id));

  return (
    <AppContext.Provider value={{
      user, logout,
      isManagement, isPM, isBD,
      dataLoading, dataError, loadAllData,

      currencies, setCurrencies,
      activeCurrency, setActiveCurrency,
      fmt,
      addCurrency, updateCurrency, deleteCurrency, setDefaultCurrency,

      categories, setCategories,
      addCategory, updateCategory, deleteCategory,

      users, setUsers,
      addUser, updateUser, deleteUser,

      clients,        setClients,
      projects,       setProjects,
      hostingProjects,setHosting,
      clientServices, setClientServices,
      serviceTypes,   setServiceTypes,

      sidebarOpen, setSidebarOpen,
      showAddProject, setShowAddProject,

      addClient, updateClient, deleteClient,
      addServiceType, updateServiceType, deleteServiceType,
      addClientService, updateClientService, deleteClientService,
      addProject, updateProject, deleteProject, toggleMilestoneCycleTarget,
      addMilestone, updateMilestone, deleteMilestone,
      addPayment, updatePayment, deletePayment,
      addBlocker, resolveBlocker, deleteBlocker,
      addAchievement, deleteAchievement,
      addHosting, updateHosting, deleteHosting,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
