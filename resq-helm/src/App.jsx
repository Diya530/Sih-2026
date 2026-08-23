import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  Activity, AlertTriangle, Battery, Bell, CheckCircle2, ChevronRight, 
  Cpu, Crosshair, Flame, HardHat, Info, LayoutDashboard, 
  Map as MapIcon, Menu, Play, Power, Radio, Server, Settings, 
  ShieldAlert, ShieldCheck, Siren, Thermometer, User, Users, 
  Vibrate, Wifi, Wind, Sun, Moon
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceLine, PieChart, Pie, Cell 
} from 'recharts';
import Helmet3D from './Helmet3D';

const THEME = {
  bgBase: 'bg-[#F9FAFB] dark:bg-[#111820]', 
  bgCard: 'bg-[#FFFFFF] dark:bg-[#1A2332]',
  border: 'border-[#E5E7EB] dark:border-[#334155]',
  text: 'text-[#111827] dark:text-[#F1F5F9]',
  textMuted: 'text-[#6B7280] dark:text-[#94A3B8]',
  primaryBg: 'bg-[#1D4ED8] dark:bg-[#F1F5F9]',
  primaryText: 'text-[#FFFFFF] dark:text-[#111820]',
  safeText: 'text-[#22C55E]',
  safeBg: 'bg-[#22C55E]/10',
  safeBorder: 'border-[#22C55E]/30',
  safeFill: '#22C55E',
  warningText: 'text-[#FACC15]',
  warningBg: 'bg-[#FACC15]/10',
  warningBorder: 'border-[#FACC15]/30',
  warningFill: '#FACC15',
  highRiskText: 'text-[#F97316]',
  highRiskBg: 'bg-[#F97316]/10',
  highRiskBorder: 'border-[#F97316]/30',
  highRiskFill: '#F97316',
  criticalText: 'text-[#EF4444]',
  criticalBg: 'bg-[#EF4444]/10',
  criticalBorder: 'border-[#EF4444]/30',
  criticalFill: '#EF4444',
};

const RISK_THRESHOLDS = { WARNING: 50, HIGH: 75, CRITICAL: 90 };

const SECTORS = ['Sector A (North)', 'Sector B (Main Tunnel)', 'Sector C (Deep Shaft)', 'Surface Post'];
const WORKER_NAMES = ['Rahul M.', 'Aman K.', 'Priya S.', 'Vikram D.', 'Anita R.', 'Suresh P.', 'Kavita L.', 'Mohan T.'];

const generateInitialWorkers = () => {
  return Array.from({ length: 8 }, (_, i) => {
    const sector = SECTORS[i % SECTORS.length];
    let x = 25, y = 25;
    if (sector.includes('Sector A')) { x = 25; y = 25; }
    else if (sector.includes('Sector B')) { x = 75; y = 25; }
    else if (sector.includes('Sector C')) { x = 75; y = 75; }
    else { x = 25; y = 75; }

    return {
      id: `W-${(i + 1).toString().padStart(2, '0')}`,
      helmetId: `H-${(i + 1).toString().padStart(2, '0')}`,
      name: WORKER_NAMES[i],
      sector: sector,
      status: 'ONLINE', 
      x: x + (Math.random() * 10 - 5), 
      y: y + (Math.random() * 10 - 5),
      sensors: {
        ch4: 0.05 + Math.random() * 0.05,
        co: 2 + Math.random() * 5,       
        o2: 20.8 + Math.random() * 0.2,    
        h2s: 0.01,                       
        temp: 28 + Math.random() * 4,      
        humidity: 55 + Math.random() * 10, 
        battery: 85 + Math.random() * 15,
        motion: 'Normal', 
      },
      risk: { gas: 10, temp: 15, structural: 20, worker: 10, overall: 15 }
    };
  });
};

const AppContext = createContext();

const SimulationProvider = ({ children }) => {
  const [view, setView] = useState('landing');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('resqhelm-theme');
      if (savedTheme === 'light') return false;
      if (savedTheme === 'dark') return true;
      return true;
    } catch (e) {
      return true;
    }
  });

  const [workers, setWorkers] = useState(generateInitialWorkers());
  const [alerts, setAlerts] = useState([]);
  const [scenario, setScenario] = useState('NORMAL');
  const [activeHazards, setActiveHazards] = useState([]);
  const [criticalMode, setCriticalMode] = useState(false);
  const [pendingScroll, setPendingScroll] = useState(null);
  const [selectedId, setSelectedId] = useState('W-01');

  const [history, setHistory] = useState(() => {
    const initialWorkers = generateInitialWorkers();
    const initialHistory = {};
    initialWorkers.forEach(worker => {
      initialHistory[worker.id] = [];
      for (let i = 19; i >= 0; i--) {
        initialHistory[worker.id].push({
          time: new Date(Date.now() - i * 2000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          ch4: Number(worker.sensors.ch4.toFixed(2)),
          co: Number(worker.sensors.co.toFixed(0)),
          temp: Number(worker.sensors.temp.toFixed(1)),
          risk: worker.risk.overall
        });
      }
    });
    return initialHistory;
  });

  const stateRef = useRef({ workers, scenario, alerts, history });
  useEffect(() => { stateRef.current = { workers, scenario, alerts, history }; }, [workers, scenario, alerts, history]);

  const triggerAlert = (type, worker, message, severity = 'WARNING') => {
    const newAlert = {
      id: Date.now().toString() + Math.random(),
      time: new Date().toLocaleTimeString(),
      type,
      workerId: worker.id,
      workerName: worker.name,
      sector: worker.sector,
      message,
      severity,
      acknowledged: false
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 20)); 
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark'); 
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    try {
      localStorage.setItem('resqhelm-theme', isDarkMode ? 'dark' : 'light');
    } catch (e) {}
  }, [isDarkMode]);

  // Scenario Handlers (Immediate updates on scenario change)
  useEffect(() => {
    if (scenario === 'NORMAL') {
      setActiveHazards([]);
      setAlerts([]);
      setCriticalMode(false);
      setWorkers(prev => prev.map(w => ({
        ...w,
        status: 'ONLINE',
        sensors: { ...w.sensors, ch4: 0.05, co: 2, motion: 'Normal', temp: 28 },
        risk: { gas: 10, temp: 15, structural: 20, worker: 10, overall: 15 }
      })));
    } else if (scenario === 'GAS_LEAK') {
      setActiveHazards(['Sector B (Main Tunnel)']);
      setWorkers(prev => prev.map(w => {
        if (w.id === 'W-03') {
          const nw = { ...w, sensors: { ...w.sensors, ch4: 2.2, co: 45 } };
          nw.risk.gas = 90; nw.risk.overall = 85; nw.status = 'HIGH';
          triggerAlert('GAS', nw, 'Elevated gas concentration detected in Sector B.', 'HIGH');
          return nw;
        }
        return w;
      }));
    } else if (scenario === 'FALL') {
      setActiveHazards([]);
      setWorkers(prev => prev.map(w => {
        if (w.id === 'W-05') {
          const nw = { ...w, sensors: { ...w.sensors, motion: 'Impact' } };
          nw.risk.worker = 95; nw.risk.overall = 90; nw.status = 'EMERGENCY';
          triggerAlert('FALL', nw, 'Possible fall detected for Worker W-05. Immediate verification recommended.', 'CRITICAL');
          return nw;
        }
        return w;
      }));
    } else if (scenario === 'CRISIS') {
      setActiveHazards(['Sector B (Main Tunnel)', 'Sector C (Deep Shaft)']);
      setCriticalMode(true);
      setWorkers(prev => prev.map(w => {
        if (w.id === 'W-03') {
          const nw = { ...w, sensors: { ...w.sensors, ch4: 2.8, co: 65, temp: 45 } };
          nw.risk.gas = 98; nw.risk.overall = 95; nw.status = 'EMERGENCY';
          triggerAlert('GAS', nw, 'CRITICAL INCIDENT — SECTOR B GAS LEVELS TOXIC.', 'CRITICAL');
          return nw;
        }
        if (w.id === 'W-05') {
          const nw = { ...w, sensors: { ...w.sensors, motion: 'Impact' } };
          nw.risk.worker = 95; nw.risk.overall = 92; nw.status = 'EMERGENCY';
          triggerAlert('FALL', nw, 'FALL DETECTED — WORKER W-05 IN SECTOR C', 'CRITICAL');
          return nw;
        }
        return w;
      }));
    }
  }, [scenario]);

  useEffect(() => {
    if (view === 'landing') return; 
    const tickRate = 2000; 
    
    const interval = setInterval(() => {
      const { workers: currentWorkers, scenario: currentScenario, history: currentHistory } = stateRef.current;
      const updatedHistory = { ...currentHistory };
      const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' });

      const updatedWorkers = currentWorkers.map(w => {
        let nw = { ...w, sensors: { ...w.sensors }, risk: { ...w.risk } };
        
        nw.sensors.ch4 += (Math.random() - 0.5) * 0.02;
        nw.sensors.co += (Math.random() - 0.5) * 1.5;
        nw.sensors.temp += (Math.random() - 0.5) * 0.5;
        nw.sensors.o2 += (Math.random() - 0.5) * 0.05;
        nw.sensors.battery = Math.max(0, nw.sensors.battery - 0.01);
        
        if (currentScenario === 'NORMAL') nw.sensors.motion = 'Normal';

        nw.sensors.ch4 = Math.max(0, nw.sensors.ch4);
        nw.sensors.co = Math.max(0, nw.sensors.co);
        nw.sensors.o2 = Math.min(21, Math.max(0, nw.sensors.o2));
        
        nw.risk.gas = Math.min(100, (nw.sensors.ch4 * 30) + (nw.sensors.co * 1.5));
        nw.risk.temp = Math.min(100, Math.max(0, (nw.sensors.temp - 30) * 4));
        nw.risk.worker = nw.sensors.motion === 'Impact' ? 95 : 10;
        
        const maxRiskComponent = Math.max(nw.risk.gas, nw.risk.temp, nw.risk.structural, nw.risk.worker);
        const avgRisk = (nw.risk.gas + nw.risk.temp + nw.risk.structural + nw.risk.worker) / 4;
        nw.risk.overall = Math.round((maxRiskComponent * 0.7) + (avgRisk * 0.3));

        if (nw.risk.overall >= RISK_THRESHOLDS.CRITICAL) {
           nw.status = 'EMERGENCY';
        } else if (nw.risk.overall >= RISK_THRESHOLDS.HIGH) {
           nw.status = 'HIGH';
        } else if (nw.risk.overall >= RISK_THRESHOLDS.WARNING) {
           nw.status = 'WARNING';
        } else {
           nw.status = 'ONLINE';
        }

        if (!updatedHistory[w.id]) updatedHistory[w.id] = [];
        updatedHistory[w.id].push({
          time: timestamp,
          ch4: Number(nw.sensors.ch4.toFixed(2)),
          co: Number(nw.sensors.co.toFixed(0)),
          temp: Number(nw.sensors.temp.toFixed(1)),
          risk: nw.risk.overall
        });
        if (updatedHistory[w.id].length > 20) updatedHistory[w.id].shift();

        return nw;
      });

      setWorkers(updatedWorkers);
      setHistory(updatedHistory);
    }, tickRate);

    return () => clearInterval(interval);
  }, [view]);

  const value = {
    view, setView,
    isDarkMode, setIsDarkMode,
    workers,
    alerts, setAlerts,
    scenario, setScenario,
    activeHazards, setActiveHazards,
    criticalMode, setCriticalMode,
    history,
    triggerAlert,
    selectedId, setSelectedId,
    pendingScroll, setPendingScroll
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const Card = ({ children, className = '' }) => (
  <div className={`${THEME.bgCard} ${THEME.border} border rounded-xl shadow-sm ${className}`}>
    {children}
  </div>
);

const RiskBadge = ({ risk, className="" }) => {
  let color = `${THEME.safeText} ${THEME.safeBg} ${THEME.safeBorder}`;
  if (risk >= RISK_THRESHOLDS.CRITICAL) color = `${THEME.criticalText} ${THEME.criticalBg} border-[${THEME.criticalFill}]/50`;
  else if (risk >= RISK_THRESHOLDS.HIGH) color = `${THEME.highRiskText} ${THEME.highRiskBg} border-[${THEME.highRiskFill}]/50`;
  else if (risk >= RISK_THRESHOLDS.WARNING) color = `${THEME.warningText} ${THEME.warningBg} ${THEME.warningBorder}`;
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border tracking-wider ${color} ${className}`}>
      {risk} / 100
    </span>
  );
};

const ValueDisplay = ({ label, value, unit, icon: Icon, alertType=false }) => {
  let borderClass = `${THEME.border}`;
  let textClass = THEME.text;
  let iconClass = THEME.textMuted;

  if (alertType === 'CRITICAL') {
    borderClass = `${THEME.criticalBorder} ${THEME.criticalBg}`;
    textClass = THEME.criticalText;
    iconClass = THEME.criticalText;
  } else if (alertType === 'WARNING') {
    borderClass = `${THEME.warningBorder} ${THEME.warningBg}`;
    textClass = THEME.warningText;
    iconClass = THEME.warningText;
  }

  return (
    <Card className={`p-4 border ${borderClass}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`${THEME.textMuted} text-sm font-medium`}>{label}</span>
        {Icon && <Icon size={16} className={iconClass} />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${textClass}`}>{value}</span>
        <span className={`${THEME.textMuted} text-sm ml-1`}>{unit}</span>
      </div>
    </Card>
  );
};

const Sidebar = () => {
  const { view, setView } = useContext(AppContext);
  
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'monitoring', icon: Activity, label: 'Live Monitoring' },
    { id: 'workers', icon: Users, label: 'Personnel' },
    { id: 'intel', icon: Cpu, label: 'AI Intelligence' },
    { id: 'map', icon: MapIcon, label: 'Sector Map' }
  ];

  return (
    <aside className={`w-64 ${THEME.bgCard} border-r ${THEME.border} flex flex-col h-screen fixed left-0 top-0 z-40 transition-colors`}>
      <div className={`p-6 flex items-center gap-3 border-b ${THEME.border} cursor-pointer`} onClick={() => setView('landing')}>
        <div className={`w-10 h-10 rounded-lg bg-[#1D4ED8]/10 dark:bg-[#F1F5F9]/10 flex items-center justify-center`}>
          <HardHat className="text-[#1D4ED8] dark:text-[#F1F5F9]" size={24} />
        </div>
        <div>
          <h1 className={`text-lg font-bold ${THEME.text} leading-tight`}>ResQ Helm</h1>
          <p className={`text-[10px] ${THEME.textMuted} font-bold tracking-widest uppercase`}>Command Center</p>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        <div className={`text-xs font-semibold ${THEME.textMuted} uppercase tracking-wider mb-4 px-2`}>Main Menu</div>
        {navItems.map(item => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active 
                  ? `${THEME.primaryBg} ${THEME.primaryText}` 
                  : `${THEME.textMuted} hover:bg-slate-50 dark:hover:bg-[#111820] hover:${THEME.text}`
              }`}
            >
              <item.icon size={20} className={active ? THEME.primaryText : 'inherit'} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          )
        })}
      </div>

      <div className={`p-4 border-t ${THEME.border}`}>
        <div className={`bg-white dark:bg-[#111820] rounded-lg p-4 flex flex-col gap-2 border ${THEME.border} shadow-sm`}>
          <div className="flex items-center gap-3">
            <Radio size={20} className={THEME.safeText} />
            <div>
              <div className={`text-xs ${THEME.textMuted}`}>System Status</div>
              <div className={`text-sm font-semibold ${THEME.safeText}`}>All Nodes Online</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const TopNav = () => {
  const { alerts, scenario, setScenario, workers, isDarkMode, setIsDarkMode } = useContext(AppContext);
  const unreadAlerts = alerts.filter(a => !a.acknowledged).length;
  const avgRisk = workers.reduce((acc, w) => acc + w.risk.overall, 0) / workers.length;

  return (
    <header className={`h-20 ${THEME.bgCard} border-b ${THEME.border} flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-30 transition-colors shadow-sm`}>
      <div className="flex items-center gap-6">
        <div>
          <h2 className={`text-2xl font-bold ${THEME.text}`}>Operation Center</h2>
          <p className={`text-sm ${THEME.textMuted}`}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className={`flex items-center bg-slate-50 dark:bg-[#111820] rounded-lg p-1 border ${THEME.border}`}>
          <span className={`text-[10px] ${THEME.textMuted} uppercase px-3 font-bold tracking-widest`}>Demo Scenarios:</span>
          {['NORMAL', 'GAS LEAK', 'FALL', 'CRISIS'].map(s => {
            const scenarioValue = s.replace(' ', '_');
            return (
              <button
                key={s}
                onClick={() => setScenario(scenarioValue)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  scenario === scenarioValue 
                    ? `${THEME.primaryBg} ${THEME.primaryText} shadow-sm` 
                    : `${THEME.textMuted} hover:${THEME.text} hover:bg-white dark:hover:bg-[#1A2332]`
                }`}
              >
                {s}
              </button>
            )
          })}
        </div>

        <div className={`h-8 w-px ${THEME.border} border-l`}></div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full border ${THEME.border} hover:bg-slate-50 dark:hover:bg-[#111820] transition-colors`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} className="text-[#FACC15]" /> : <Sun size={18} className="text-slate-600" />}
          </button>

          <div className="text-right hidden sm:block flex flex-col items-end">
            <div className={`text-[10px] ${THEME.textMuted} uppercase tracking-wider font-bold`}>Facility Risk</div>
            <div className={`text-xl font-bold ${avgRisk > 50 ? THEME.warningText : THEME.safeText} leading-none mt-1`}>
              {Math.round(avgRisk)} <span className="text-sm font-medium text-slate-400">/ 100</span>
            </div>
          </div>
          
          <button className={`relative p-2 rounded-lg ${THEME.textMuted} hover:bg-slate-50 dark:hover:bg-[#111820] transition-colors`}>
            <Bell size={20} />
            {unreadAlerts > 0 && (
              <span className={`absolute top-1 right-1 w-2 h-2 bg-[${THEME.criticalFill}] rounded-full border-2 border-white dark:border-[#1A2332]`}></span>
            )}
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer">
            <div className={`w-9 h-9 rounded-full border ${THEME.border} overflow-hidden`}>
              <img src="https://i.pravatar.cc/150?u=resqhelm" alt="User" className="w-full h-full object-cover" />
            </div>
            <ChevronRight size={16} className={THEME.textMuted} />
          </div>
        </div>
      </div>
    </header>
  );
};

const CriticalOverlay = () => {
  const { criticalMode, setCriticalMode, workers, scenario, setScenario } = useContext(AppContext);
  
  if (!criticalMode) return null;

  const criticalWorkers = workers.filter(w => w.status === 'EMERGENCY');

  const handleAcknowledge = () => {
    setCriticalMode(false);
    if(scenario === 'CRISIS' || scenario === 'FALL') setScenario('NORMAL');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111820]/95 backdrop-blur-sm">
      <div className={`absolute inset-0 border-8 border-[${THEME.criticalFill}]/30 pointer-events-none`}></div>
      
      <div className="max-w-3xl w-full mx-4 relative z-10">
        <div className="text-center mb-8">
          <Siren size={80} className={`${THEME.criticalText} mx-auto mb-6`} />
          <h1 className="text-5xl font-black text-[#F1F5F9] tracking-tight mb-2">
            CRITICAL INCIDENT
          </h1>
          <p className={`text-xl ${THEME.criticalText} font-bold`}>MULTI-HAZARD EVENT DETECTED</p>
        </div>

        <div className={`bg-[#1A2332] border border-[${THEME.criticalFill}]/50 rounded-xl overflow-hidden shadow-2xl`}>
          <div className="p-8 grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-[#94A3B8] font-bold mb-4 text-xs uppercase tracking-wider">AI Assessment</h3>
              <p className="text-[#F1F5F9] text-base leading-relaxed">
                Compound failure detected in <span className={`font-bold ${THEME.criticalText}`}>Sector B (Main Tunnel)</span>. 
                Rapid increase in CH4 combined with structural stress indicators. Worker unresponsive.
              </p>
              
              <div className="mt-6">
                <div className="text-xs text-[#94A3B8] uppercase mb-2 font-bold">Affected Personnel:</div>
                {criticalWorkers.map(w => (
                  <div key={w.id} className={`flex items-center gap-3 bg-[#111820] p-3 rounded-lg border border-[#334155] mb-2`}>
                    <User className={THEME.criticalText} size={20} />
                    <div>
                      <div className="font-bold text-[#F1F5F9]">{w.name} ({w.id})</div>
                      <div className="text-sm text-[#94A3B8]">Risk: {w.risk.overall}/100 • Motion: {w.sensors.motion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                 <h3 className="text-[#94A3B8] font-bold mb-4 text-xs uppercase tracking-wider">System Recommendation</h3>
                 <div className={`bg-[#111820] p-5 rounded-xl border-l-4 border-[${THEME.criticalFill}]`}>
                    <div className="font-black text-xl text-[#F1F5F9] mb-2 tracking-wide">IMMEDIATE EVACUATION</div>
                    <div className="text-[#94A3B8] text-sm leading-relaxed">Initiate Protocol Alpha for Sector B. Dispatch Rescue Team 1 immediately.</div>
                 </div>
              </div>
              
              <div className="space-y-3 mt-8">
                <button 
                  onClick={handleAcknowledge}
                  className={`w-full py-3 bg-[${THEME.criticalFill}] hover:opacity-90 text-[#FFFFFF] font-bold text-sm rounded-lg transition-opacity flex items-center justify-center gap-2`}
                >
                  <CheckCircle2 size={18}/>
                  ACKNOWLEDGE & INITIATE RESPONSE
                </button>
                <button 
                  onClick={() => setCriticalMode(false)}
                  className={`w-full py-3 bg-transparent border border-[#334155] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155] font-bold text-sm rounded-lg transition-colors`}
                >
                  DISMISS ALARM (FALSE POSITIVE)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardView = () => {
  const { workers, alerts, isDarkMode } = useContext(AppContext);
  
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalCount = workers.filter(w => w.risk.overall >= RISK_THRESHOLDS.CRITICAL).length;
  const warningCount = workers.filter(w => w.risk.overall >= RISK_THRESHOLDS.WARNING && w.risk.overall < RISK_THRESHOLDS.CRITICAL).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        <Card className={`p-6 border-t-4 border-t-[#111820] dark:border-t-[#F1F5F9]`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${THEME.textMuted} font-medium`}>Active Personnel</h3>
            <Users className={THEME.text} size={20} />
          </div>
          <div className={`text-4xl font-bold ${THEME.text}`}>{workers.length}</div>
          <div className={`text-sm ${THEME.safeText} mt-2 flex items-center gap-1 font-medium`}><CheckCircle2 size={14}/> All helmets online</div>
        </Card>
        
        <Card className={`p-6 border-t-4 border-t-[#CBD5E1] dark:border-t-[#334155]`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${THEME.textMuted} font-medium`}>Active Alerts</h3>
            <Bell className={activeAlerts.length > 0 ? THEME.warningText : THEME.textMuted} size={20} />
          </div>
          <div className={`text-4xl font-bold ${THEME.text}`}>{activeAlerts.length}</div>
          <div className={`text-sm ${THEME.textMuted} mt-2`}>Last 24 hours: 12</div>
        </Card>

        <Card className={`p-6 border-t-4 ${criticalCount > 0 ? `border-t-[${THEME.criticalFill}] ${THEME.criticalBg}` : 'border-t-[#CBD5E1] dark:border-t-[#334155]'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${THEME.textMuted} font-medium`}>Critical Status</h3>
            <ShieldAlert className={criticalCount > 0 ? THEME.criticalText : THEME.textMuted} size={20} />
          </div>
          <div className={`text-4xl font-bold ${criticalCount > 0 ? THEME.criticalText : THEME.text}`}>{criticalCount}</div>
          <div className={`text-sm ${THEME.textMuted} mt-2`}>Personnel in danger</div>
        </Card>

        <Card className={`p-6 border-t-4 ${warningCount > 0 ? `border-t-[${THEME.warningFill}] ${THEME.warningBg}` : 'border-t-[#CBD5E1] dark:border-t-[#334155]'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${THEME.textMuted} font-medium`}>Warnings</h3>
            <AlertTriangle className={warningCount > 0 ? THEME.warningText : THEME.textMuted} size={20} />
          </div>
          <div className={`text-4xl font-bold ${warningCount > 0 ? THEME.warningText : THEME.text}`}>{warningCount}</div>
          <div className={`text-sm ${THEME.textMuted} mt-2`}>Caution recommended</div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6 h-125">
        {/* Radar Map Simulation */}
        <Card className="col-span-2 p-0 relative overflow-hidden flex flex-col">
          <div className={`p-4 border-b ${THEME.border} ${THEME.bgCard} flex justify-between items-center z-30 backdrop-blur-sm`}>
            <h3 className={`font-bold ${THEME.text} flex items-center gap-2`}><Crosshair size={18} className={THEME.text}/> Live Sector Radar</h3>
            <span className={`text-xs ${THEME.textMuted} font-mono flex items-center gap-2 bg-slate-50 dark:bg-[#111820] border ${THEME.border} px-3 py-1 rounded-md`}>
              <span className={`w-2 h-2 rounded-full bg-[${THEME.safeFill}]`}></span>
              SYNC ACTIVE
            </span>
          </div>
          <div className={`flex-1 relative ${THEME.bgBase} overflow-hidden`}>
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-10 dark:opacity-20" style={{
              backgroundImage: `linear-gradient(${isDarkMode ? '#94A3B8' : '#6B7280'} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? '#94A3B8' : '#6B7280'} 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}></div>
            <div className={`absolute top-1/2 left-1/2 w-[90%] h-[90%] -translate-x-1/2 -translate-y-1/2 border ${THEME.border} rounded-full z-0 pointer-events-none opacity-30`}></div>
            <div className={`absolute top-1/2 left-1/2 w-1/2 h-1/2 -translate-x-1/2 -translate-y-1/2 border ${THEME.border} rounded-full z-0 pointer-events-none opacity-30`}></div>
            <div className={`absolute top-1/2 left-0 w-full border-t ${THEME.border} z-0 pointer-events-none opacity-30`}></div>
            <div className={`absolute top-0 left-1/2 h-full border-l ${THEME.border} z-0 pointer-events-none opacity-30`}></div>
            
            {/* Sector Labels */}
            <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-widest z-10 pointer-events-none">Sector A (North)</div>
            <div className="absolute top-4 right-4 text-xs font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-widest z-10 pointer-events-none">Sector B (Main Tunnel)</div>
            <div className="absolute bottom-4 left-4 text-xs font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-widest z-10 pointer-events-none">Surface Post</div>
            <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-400 dark:text-[#94A3B8] uppercase tracking-widest z-10 pointer-events-none">Sector C (Deep Shaft)</div>
            
            {/* Worker Nodes */}
            {workers.map(w => {
              let dotColor = `bg-[${THEME.safeFill}]`;
              if (w.risk.overall >= RISK_THRESHOLDS.CRITICAL) dotColor = `bg-[${THEME.criticalFill}]`;
              else if (w.risk.overall >= RISK_THRESHOLDS.HIGH) dotColor = `bg-[${THEME.highRiskFill}]`;
              else if (w.risk.overall >= RISK_THRESHOLDS.WARNING) dotColor = `bg-[${THEME.warningFill}]`;

              return (
                <div 
                  key={w.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-500 ease-out z-20"
                  style={{ top: `${w.y}%`, left: `${w.x}%` }}
                >
                  <div className={`w-3.5 h-3.5 border-2 border-white dark:border-[#1A2332] rounded-full ${dotColor} shadow-md`}></div>
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max ${THEME.bgCard} ${THEME.text} text-xs p-3 rounded-lg border ${THEME.border} shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none`}>
                    <div className="font-bold text-sm mb-1">{w.name} <span className={THEME.textMuted}>({w.id})</span></div>
                    <div className={`${THEME.textMuted} mb-2`}>{w.sector}</div>
                    <div className="font-mono flex items-center justify-between gap-4">
                      <span>Risk Score</span>
                      <span className={`font-bold ${w.risk.overall > 50 ? THEME.warningText : THEME.safeText}`}>{w.risk.overall}/100</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Alert Feed */}
        <Card className="flex flex-col">
           <div className={`p-4 border-b ${THEME.border} ${THEME.bgCard} flex justify-between items-center backdrop-blur-sm`}>
            <h3 className={`font-bold ${THEME.text} flex items-center gap-2`}><Siren size={18} className={THEME.textMuted}/> Event Log</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {alerts.length === 0 ? (
              <div className={`text-center ${THEME.textMuted} mt-10 text-sm font-medium`}>No recent events.</div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.severity === 'CRITICAL' ? `${THEME.criticalBg} border-[${THEME.criticalFill}]/30` : 
                  alert.severity === 'HIGH' ? `${THEME.highRiskBg} border-[${THEME.highRiskFill}]/30` : 
                  `${THEME.warningBg} border-[${THEME.warningFill}]/30`
                }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold font-mono ${THEME.textMuted}`}>{alert.time}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      alert.severity === 'CRITICAL' ? `bg-[${THEME.criticalFill}] text-[#FFFFFF]` : 
                      alert.severity === 'HIGH' ? `bg-[${THEME.highRiskFill}] text-[#FFFFFF]` : 
                      `bg-[${THEME.warningFill}] text-[#111820]`
                    }`}>{alert.severity}</span>
                  </div>
                  <div className={`font-bold text-sm ${THEME.text} mb-1`}>{alert.workerName} ({alert.workerId})</div>
                  <div className={`text-xs ${THEME.textMuted} leading-snug`}>{alert.message}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const SectorMapView = () => {
  const { workers, activeHazards } = useContext(AppContext);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  const activeCount = workers.length;
  const safeCount = workers.filter(w => w.status === 'ONLINE').length;
  const criticalCount = workers.filter(w => w.status === 'EMERGENCY').length;
  const atRiskCount = workers.filter(w => ['WARNING', 'HIGH'].includes(w.status)).length;
  
  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-2xl font-bold ${THEME.text}`}>Live Sector Map</h2>
        <div className="flex items-center gap-4">
           <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase"><div className="w-2 h-2 bg-[#22C55E] rounded-full"></div> Safe</span>
           <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase"><div className="w-2 h-2 bg-[#F97316] rounded-full"></div> At Risk</span>
           <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase"><div className="w-2 h-2 bg-[#EF4444] rounded-full"></div> Emergency</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
         <Card className="p-4 flex flex-col items-center justify-center text-center">
           <span className={`text-sm ${THEME.textMuted} font-semibold mb-1`}>Active Personnel</span>
           <span className={`text-2xl font-bold ${THEME.text}`}>{activeCount}</span>
         </Card>
         <Card className="p-4 flex flex-col items-center justify-center text-center">
           <span className={`text-sm ${THEME.textMuted} font-semibold mb-1`}>Critical Alerts</span>
           <span className={`text-2xl font-bold ${criticalCount > 0 ? THEME.criticalText : THEME.text}`}>{criticalCount}</span>
         </Card>
         <Card className="p-4 flex flex-col items-center justify-center text-center border-b-4 border-b-[#22C55E]">
           <span className={`text-sm ${THEME.textMuted} font-semibold mb-1`}>Safe</span>
           <span className={`text-2xl font-bold ${THEME.text}`}>{safeCount}</span>
         </Card>
         <Card className={`p-4 flex flex-col items-center justify-center text-center border-b-4 ${atRiskCount > 0 ? 'border-b-[#F97316]' : 'border-b-transparent'}`}>
           <span className={`text-sm ${THEME.textMuted} font-semibold mb-1`}>At Risk</span>
           <span className={`text-2xl font-bold ${atRiskCount > 0 ? THEME.highRiskText : THEME.text}`}>{atRiskCount}</span>
         </Card>
         <Card className={`p-4 flex flex-col items-center justify-center text-center border-b-4 ${activeHazards.length > 0 ? 'border-b-[#EF4444]' : 'border-b-transparent'}`}>
           <span className={`text-sm ${THEME.textMuted} font-semibold mb-1`}>Active Hazards</span>
           <span className={`text-2xl font-bold ${activeHazards.length > 0 ? THEME.criticalText : THEME.text}`}>{activeHazards.length}</span>
         </Card>
      </div>

      <Card className="flex-1 min-h-137.5 relative overflow-hidden bg-slate-50 dark:bg-[#0F1115] border-[#E5E7EB] dark:border-[#334155]">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
          backgroundImage: `linear-gradient(#4B5563 1px, transparent 1px), linear-gradient(90deg, #4B5563 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300 dark:bg-slate-700 z-0"></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-slate-300 dark:bg-slate-700 z-0"></div>

        <div className="absolute top-6 left-6 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10 pointer-events-none">Sector A (North)</div>
        <div className="absolute top-6 right-6 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10 pointer-events-none">Sector B (Main Tunnel)</div>
        <div className="absolute bottom-6 left-6 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10 pointer-events-none">Surface Post</div>
        <div className="absolute bottom-6 right-6 text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest z-10 pointer-events-none">Sector C (Deep Shaft)</div>

        {activeHazards.includes('Sector B (Main Tunnel)') && (
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-500/10 border-2 border-red-500/50 animate-pulse z-0 pointer-events-none flex items-center justify-center">
            <div className="bg-red-50 dark:bg-red-950/80 px-4 py-2 rounded-lg border border-red-500 flex items-center gap-2 backdrop-blur-sm shadow-sm">
               <AlertTriangle className="text-red-500" size={20}/>
               <span className="text-red-600 dark:text-red-500 font-bold uppercase tracking-wider text-sm">Active Hazard Zone</span>
            </div>
          </div>
        )}

        <div className="absolute top-[48%] left-[48%] w-8 h-8 bg-blue-100 dark:bg-blue-900/80 border border-blue-500 rounded-lg flex items-center justify-center z-10 shadow-sm">
          <Radio size={16} className="text-blue-600 dark:text-blue-400" />
        </div>

        {workers.map(w => {
          let markerColor = 'bg-[#22C55E] border-green-200';
          let pulse = false;
          if (w.status === 'EMERGY' || w.status === 'EMERGENCY') {
            markerColor = 'bg-[#EF4444] border-red-200';
            pulse = true;
          } else if (w.status === 'HIGH' || w.status === 'WARNING') {
            markerColor = 'bg-[#F97316] border-orange-200';
          }

          const isSelected = selectedWorkerId === w.id;

          return (
            <button 
              key={w.id}
              onClick={() => setSelectedWorkerId(isSelected ? null : w.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group outline-none transition-all duration-300 ${isSelected ? 'scale-150 z-30' : 'hover:scale-125'}`}
              style={{ top: `${w.y}%`, left: `${w.x}%` }}
            >
              <div className={`w-4 h-4 border-2 rounded-full shadow-lg ${markerColor} ${pulse ? 'animate-pulse' : ''} ${isSelected ? 'ring-4 ring-black/10 dark:ring-white/30' : ''}`}></div>
              <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-slate-800/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {w.id}
              </div>
            </button>
          );
        })}

        {selectedWorker && (
          <div className="absolute top-6 right-6 z-40 w-72 bg-white/95 dark:bg-[#1A2332]/95 backdrop-blur-md border border-slate-200 dark:border-[#334155] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className={`px-4 py-3 border-b border-slate-200 dark:border-[#334155] flex items-center justify-between ${selectedWorker.status === 'EMERGENCY' ? 'bg-red-50 dark:bg-[#EF4444]/20' : ''}`}>
               <div className="flex items-center gap-2">
                 <User size={16} className={THEME.textMuted}/>
                 <span className="font-bold text-slate-900 dark:text-[#F1F5F9]">{selectedWorker.name}</span>
                 <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono ml-1">({selectedWorker.id})</span>
               </div>
               <button onClick={() => setSelectedWorkerId(null)} className="text-slate-400 hover:text-slate-600 dark:text-[#94A3B8] dark:hover:text-white"><Settings size={16}/></button>
            </div>
            <div className="p-4 space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500 dark:text-[#94A3B8]">Status</span>
                 <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                   selectedWorker.status === 'ONLINE' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-500' :
                   selectedWorker.status === 'EMERGENCY' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-500' :
                   'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-500'
                 }`}>{selectedWorker.status}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500 dark:text-[#94A3B8]">Location</span>
                 <span className="font-medium text-slate-900 dark:text-[#F1F5F9] text-xs">{selectedWorker.sector}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500 dark:text-[#94A3B8]">Motion State</span>
                 <span className={`font-bold text-xs ${selectedWorker.sensors.motion === 'Impact' ? 'text-red-500' : 'text-slate-900 dark:text-[#F1F5F9]'}`}>{selectedWorker.sensors.motion}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-500 dark:text-[#94A3B8]">Gas Level (CH4)</span>
                 <span className={`font-mono text-xs ${selectedWorker.sensors.ch4 > 1.5 ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-[#F1F5F9]'}`}>{selectedWorker.sensors.ch4.toFixed(2)} %</span>
               </div>
               <div className="pt-2 border-t border-slate-200 dark:border-[#334155]">
                 <div className="text-xs text-slate-500 dark:text-[#94A3B8] mb-1">AI Risk Score</div>
                 <div className="w-full bg-slate-100 dark:bg-[#111820] rounded-full h-2 overflow-hidden border border-slate-200 dark:border-[#334155]">
                   <div 
                     className={`h-full rounded-full ${selectedWorker.risk.overall > 75 ? 'bg-red-500' : selectedWorker.risk.overall > 50 ? 'bg-orange-500' : 'bg-green-500'}`}
                     style={{ width: `${selectedWorker.risk.overall}%` }}
                   ></div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const LiveMonitoringView = () => {
  const { workers, history, isDarkMode, selectedId, setSelectedId } = useContext(AppContext);
  const worker = workers.find(w => w.id === selectedId);
  const workerHistory = history[selectedId] || [];

  if (!worker) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${THEME.text}`}>Live Telemetry</h2>
        <select 
          className={`bg-white dark:bg-[#111820] border ${THEME.border} ${THEME.text} text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 font-medium`}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.name} ({w.id}) - {w.sector}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ValueDisplay label="Methane (CH4)" value={worker.sensors.ch4.toFixed(2)} unit="%" icon={Wind} alert={worker.sensors.ch4 > 1.0} />
        <ValueDisplay label="Carbon Monoxide" value={worker.sensors.co.toFixed(0)} unit="ppm" icon={Flame} alert={worker.sensors.co > 25} />
        <ValueDisplay label="Oxygen (O2)" value={worker.sensors.o2.toFixed(1)} unit="%" alert={worker.sensors.o2 < 19.5} />
        <ValueDisplay label="Temperature" value={worker.sensors.temp.toFixed(1)} unit="°C" icon={Thermometer} alert={worker.sensors.temp > 35} />
        <ValueDisplay label="Humidity" value={worker.sensors.humidity.toFixed(0)} unit="%" />
        <ValueDisplay label="Helmet Battery" value={worker.sensors.battery.toFixed(0)} unit="%" icon={Battery} color={THEME.safeText} />
        <Card className="col-span-2 p-4 flex items-center justify-between">
           <div>
             <div className={`${THEME.textMuted} text-sm font-medium mb-2`}>Worker State & Motion</div>
             <div className="flex items-center gap-3">
               <span className={`px-4 py-1.5 rounded-lg text-sm font-bold tracking-wide ${
                 worker.sensors.motion === 'Normal' ? `bg-[#22C55E]/20 text-[#22C55E]` :
                 worker.sensors.motion === 'Impact' ? `bg-[#EF4444]/20 text-[#EF4444] animate-pulse` :
                 `bg-[#FACC15]/20 text-[#FACC15]`
               }`}>
                 {worker.sensors.motion.toUpperCase()}
               </span>
               <span className={`${THEME.textMuted} text-sm font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded`}>IMU Active</span>
             </div>
           </div>
           <Activity size={40} className={worker.sensors.motion === 'Normal' ? THEME.safeText : THEME.criticalText} />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5 h-87.5">
          <h3 className={`text-sm font-semibold ${THEME.textMuted} mb-4`}>Gas Concentrations (Last 40s)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={workerHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="time" stroke="#94A3B8" tick={{fill: '#94A3B8', fontSize: 10}} />
              <YAxis yAxisId="left" stroke="#94A3B8" tick={{fill: '#94A3B8', fontSize: 10}} />
              <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" tick={{fill: '#94A3B8', fontSize: 10}} />
              <Tooltip contentStyle={{backgroundColor: isDarkMode ? '#111820' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#F1F5F9' : '#111820', borderRadius: '8px'}} />
              <Line yAxisId="left" type="monotone" dataKey="ch4" stroke="#06b6d4" strokeWidth={3} dot={false} name="CH4 (%)" />
              <Line yAxisId="right" type="monotone" dataKey="co" stroke="#F97316" strokeWidth={3} dot={false} name="CO (ppm)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 h-87.5">
          <h3 className={`text-sm font-semibold ${THEME.textMuted} mb-4`}>AI Overall Risk Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={workerHistory}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
              <XAxis dataKey="time" stroke="#94A3B8" tick={{fill: '#94A3B8', fontSize: 10}} />
              <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{fill: '#94A3B8', fontSize: 10}} />
              <Tooltip contentStyle={{backgroundColor: isDarkMode ? '#111820' : '#ffffff', borderColor: isDarkMode ? '#334155' : '#e2e8f0', borderRadius: '8px'}} />
              <ReferenceLine y={90} label={{ position: 'insideTopLeft', value: 'Critical', fill: '#EF4444', fontSize: 10 }} stroke="#EF4444" strokeDasharray="3 3" />
              <ReferenceLine y={75} label={{ position: 'insideTopLeft', value: 'Danger', fill: '#F97316', fontSize: 10 }} stroke="#F97316" strokeDasharray="3 3" />
              <ReferenceLine y={50} label={{ position: 'insideTopLeft', value: 'Warning', fill: '#FACC15', fontSize: 10 }} stroke="#FACC15" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="risk" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" name="Risk Score" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

const WorkersView = () => {
  const { workers } = useContext(AppContext);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${THEME.text}`}>Personnel Roster</h2>
        <div className={`${THEME.bgCard} border ${THEME.border} px-4 py-2 rounded-lg text-sm font-medium ${THEME.text} shadow-sm`}>
          Showing {workers.length} active helmets
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full text-sm text-left ${THEME.text}`}>
            <thead className={`text-xs ${THEME.textMuted} uppercase ${THEME.bgBase} border-b ${THEME.border}`}>
              <tr>
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Helmet</th>
                <th className="px-6 py-4 font-bold">Assigned Sector</th>
                <th className="px-6 py-4 font-bold">Motion State</th>
                <th className="px-6 py-4 font-bold">AI Risk Score</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w, idx) => (
                <tr key={w.id} className={`border-b ${THEME.border} hover:bg-slate-50 dark:hover:bg-[#111820] transition-colors ${idx % 2 === 0 ? THEME.bgCard : `${THEME.bgBase}`}`}>
                  <td className="px-6 py-4 font-mono font-medium">{w.id}</td>
                  <td className="px-6 py-4 font-bold flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-[#111820] flex items-center justify-center`}>
                       <User size={14} className={THEME.textMuted}/>
                    </div>
                    {w.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{w.helmetId}</td>
                  <td className="px-6 py-4">{w.sector}</td>
                  <td className="px-6 py-4">
                    {w.sensors.motion === 'Impact' ? (
                      <span className={`flex items-center gap-1 ${THEME.criticalText} font-bold px-2 py-1 rounded w-max`}><Vibrate size={14}/> Impact</span>
                    ) : (
                      w.sensors.motion
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge risk={w.risk.overall} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold border tracking-wider ${
                      w.status === 'ONLINE' ? `${THEME.safeBg} ${THEME.safeText} ${THEME.safeBorder}` :
                      w.status === 'WARNING' ? `${THEME.warningBg} ${THEME.warningText} ${THEME.warningBorder}` :
                      w.status === 'HIGH' ? `${THEME.highRiskBg} ${THEME.highRiskText} ${THEME.highRiskBorder}` :
                      w.status === 'EMERGENCY' ? `${THEME.criticalBg} ${THEME.criticalText} border-[${THEME.criticalFill}]/50` :
                      `${THEME.warningBg} ${THEME.warningText} ${THEME.warningBorder}`
                    }`}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const IntelligenceView = () => {
  const { workers, isDarkMode } = useContext(AppContext);
  const avgRisk = workers.reduce((acc, w) => acc + w.risk.overall, 0) / workers.length;
  const maxRiskWorker = workers.reduce((prev, current) => (prev.risk.overall > current.risk.overall) ? prev : current);

  const pieData = [
    { name: 'Gas Hazards', value: workers.reduce((a,w)=>a+w.risk.gas,0), color: THEME.highRiskFill },
    { name: 'Thermal', value: workers.reduce((a,w)=>a+w.risk.temp,0), color: THEME.warningFill },
    { name: 'Structural', value: workers.reduce((a,w)=>a+w.risk.structural,0), color: '#94A3B8' },
    { name: 'Worker Bio/Motion', value: workers.reduce((a,w)=>a+w.risk.worker,0), color: THEME.criticalFill },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className={`text-2xl font-bold ${THEME.text} mb-2`}>AI Multi-Hazard Risk Fusion</h2>
        <p className={`text-sm ${THEME.textMuted}`}>Real-time analysis combining environmental, structural, and biometric telemetry.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className={`p-6 col-span-1 ${THEME.bgBase} flex flex-col justify-center items-center relative overflow-hidden`}>
           <div className={`absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-[#111820]`}></div>
           <h3 className={`${THEME.textMuted} text-xs font-bold uppercase tracking-widest mb-6`}>Facility Base Risk</h3>
           <div className="relative flex items-center justify-center">
             <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
               <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-200 dark:text-[#334155]"/>
               <circle cx="100" cy="100" r="80" fill="none" stroke={avgRisk > 50 ? THEME.warningFill : THEME.safeFill} strokeWidth="12" strokeDasharray={`${(avgRisk/100) * 502} 502`} className="transition-all duration-1000" strokeLinecap="round" />
             </svg>
             <div className="absolute text-center flex flex-col items-center">
               <span className={`text-5xl font-black ${THEME.text}`}>{Math.round(avgRisk)}</span>
               <span className={`text-xs font-bold ${THEME.textMuted} mt-1`}>/ 100</span>
             </div>
           </div>
           <p className={`mt-6 text-sm text-center font-medium ${THEME.text}`}>
             Confidence Score: <span className={`${THEME.safeText} font-bold`}>98.4%</span>
           </p>
        </Card>

        <Card className="p-6 col-span-2">
          <h3 className={`${THEME.text} font-bold mb-6`}>Primary Risk Contributors</h3>
          <div className="flex items-center">
             <div className="w-1/2 h-62.5">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: isDarkMode ? '#1A2332' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E5E7EB', color: isDarkMode ? '#F1F5F9' : '#111827', borderRadius: '8px'}} itemStyle={{color: isDarkMode ? '#F1F5F9' : '#111827'}}/>
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="w-1/2 space-y-4">
                {pieData.map(d => (
                  <div key={d.name} className={`flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#111820] transition-colors border border-transparent hover:${THEME.border}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-sm" style={{backgroundColor: d.color}}></div>
                      <span className={`${THEME.text} font-medium text-sm`}>{d.name}</span>
                    </div>
                    <span className={`font-mono font-bold ${THEME.text} text-sm`}>{Math.round((d.value / pieData.reduce((a,b)=>a+b.value,0))*100)}%</span>
                  </div>
                ))}
             </div>
          </div>
        </Card>

        <Card className={`col-span-3 p-6 border-l-4 border-l-slate-200 dark:border-l-[#111820]`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 bg-slate-100 dark:bg-[#111820] rounded-lg`}><Info className={THEME.textMuted} size={24}/></div>
            <div>
              <h3 className={`${THEME.text} font-bold text-lg mb-2`}>AI Inference Engine Output</h3>
              <p className={`${THEME.textMuted} leading-relaxed text-sm mb-4 max-w-4xl`}>
                Current analysis indicates standard operational variance in most sectors. 
                However, highest individual risk factor is currently focused on 
                <span className={`font-bold ${THEME.text} px-1.5 py-0.5 bg-slate-50 dark:bg-[#111820] rounded border ${THEME.border} mx-1`}>{maxRiskWorker.name} ({maxRiskWorker.sector})</span> 
                with a localized risk score of <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${THEME.warningBg} ${THEME.warningText}`}>{maxRiskWorker.risk.overall}</span>.
                The primary driving factor is <span className={`${THEME.highRiskText} font-bold`}>Gas Concentrations (CH4)</span>.
              </p>
              <div className={`bg-slate-50 dark:bg-[#111820] p-3 rounded-md text-xs font-mono font-medium ${THEME.textMuted} inline-flex gap-4 border ${THEME.border}`}>
                <span>Model: ResQ-Fusion-v2.1</span>
                <span className="opacity-30">|</span>
                <span>Last Training: -48h</span>
                <span className="opacity-30">|</span>
                <span className={THEME.safeText}>Anomaly Detection: Active</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const scrollToPublicSection = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  const navEl = document.getElementById('resq-public-nav');
  const offset = navEl ? navEl.getBoundingClientRect().height : 0;
  const top = el.getBoundingClientRect().top + window.scrollY - offset - 16;
  window.scrollTo({ top, behavior: 'smooth' });
};

const PublicNavbar = ({ active }) => {
  const { view, setView, setPendingScroll } = useContext(AppContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const goHome = () => {
    setMobileOpen(false);
    if (view === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setView('landing');
    }
  };

  const goPlatform = () => {
    setMobileOpen(false);
    if (view === 'landing') {
      scrollToPublicSection('platform');
    } else {
      setPendingScroll('platform');
      setView('landing');
    }
  };

  const goTechnology = () => { setMobileOpen(false); setView('technology'); };
  const goUseCases = () => { setMobileOpen(false); setView('usecases'); };
  const goCommandCenter = () => { setMobileOpen(false); setView('dashboard'); };

  const links = [
    { label: 'Home', onClick: goHome, key: 'home' },
    { label: 'Platform', onClick: goPlatform, key: 'platform' },
    { label: 'Technology', onClick: goTechnology, key: 'technology' },
    { label: 'Use Cases', onClick: goUseCases, key: 'usecases' },
  ];

  return (
    <nav id="resq-public-nav" className="sticky top-0 z-50 bg-[#111820]/95 backdrop-blur-sm border-b border-[#292D35]">
      <div className="flex items-center justify-between px-6 md:px-8 py-5 max-w-7xl mx-auto relative">
        <button onClick={goHome} className="flex items-center gap-3 group cursor-pointer bg-transparent border-0" aria-label="ResQ Helm Home">
          <HardHat className="text-[#F1F5F9]" size={30} />
          <span className="text-xl md:text-2xl font-black tracking-tight text-[#F1F5F9]">ResQ Helm</span>
        </button>

        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#94A3B8]">
          {links.map(link => (
            <button
              key={link.key}
              onClick={link.onClick}
              className={`transition-colors bg-transparent border-0 cursor-pointer ${active === link.key ? 'text-[#F1F5F9]' : 'hover:text-[#F1F5F9]'}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <button
            onClick={goCommandCenter}
            className="bg-[#24527A] hover:bg-[#2C6293] text-[#F1F5F9] px-6 py-2.5 rounded-md font-bold text-sm transition-colors shadow-sm"
          >
            Command Center
          </button>
        </div>

        <button
          onClick={() => setMobileOpen(prev => !prev)}
          className="md:hidden p-2 text-[#F1F5F9] bg-transparent border-0"
          aria-label="Toggle menu"
        >
          <Menu size={26} />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#292D35] bg-[#111820] px-6 py-4 flex flex-col gap-1">
          {links.map(link => (
            <button
              key={link.key}
              onClick={link.onClick}
              className={`text-left py-3 text-sm font-bold border-b border-[#292D35]/60 bg-transparent ${active === link.key ? 'text-[#F1F5F9]' : 'text-[#94A3B8]'}`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={goCommandCenter}
            className="mt-4 bg-[#24527A] hover:bg-[#2C6293] text-[#F1F5F9] px-6 py-3 rounded-md font-bold text-sm transition-colors shadow-sm"
          >
            Command Center
          </button>
        </div>
      )}
    </nav>
  );
};

const PublicFooter = () => (
  <footer className="border-t border-[#334155] bg-[#111820] py-8 text-center text-[#94A3B8] text-sm font-bold">
    ResQ Helm © 2026 • AI-Powered Multi-Hazard Response System Prototype
  </footer>
);

const LandingPage = () => { 
  const { setView, pendingScroll, setPendingScroll } = useContext(AppContext); 
  const [showDemo, setShowDemo] = useState(false); 
  
  // If the user navigated here from Technology/Use Cases via the Platform 
  // link, scroll to the Platform section once this page has mounted. 
  useEffect(() => { 
    if (pendingScroll === 'platform') { 
      const timer = setTimeout(() => { 
        scrollToPublicSection('platform'); 
        setPendingScroll(null); 
      }, 50); 
      return () => clearTimeout(timer); 
    } 
  }, [pendingScroll, setPendingScroll]); 
  
  return ( 
    <div className={`min-h-screen bg-[#111820] text-[#F1F5F9] overflow-x-hidden font-sans`}> 
      <PublicNavbar active="home" /> 
  
      <main className="relative max-w-7xl mx-auto px-8 pt-20 pb-32 grid md:grid-cols-2 gap-12 items-center"> 
        <div className="relative z-10 space-y-8"> 
           
          <h1 className="text-5xl md:text-7xl font-black text-[#F1F5F9] leading-[1.1] tracking-tight"> 
            Sense. <br/><span className="text-[#94A3B8]">Analyse.</span> <br/>Alert. Protect. 
          </h1> 

          <p className="text-lg text-[#94A3B8] leading-relaxed max-w-md"> 
            AI-powered multi-hazard response system. Protecting the people who protect us through real-time environmental sensing and structural intelligence. 
          </p> 

          <div className="flex gap-4 flex-wrap"> 
            <button 
              onClick={() => setView('dashboard')} 
              className="bg-[#24527A] hover:bg-[#2C6293] text-white px-8 py-4 rounded-md font-bold transition-colors flex items-center gap-2 shadow-sm" 
            > 
              <Power size={20} /> 
              Initialize System 
            </button> 
 
            <button 
              onClick={() => setShowDemo(true)} 
              className="border border-[#475569] hover:border-[#24527A] text-[#F1F5F9] px-8 py-4 rounded-md font-bold transition-colors flex items-center gap-2" 
            > 
              ▶ Watch Demo 
            </button> 
          </div>
        </div>
  
        <div className="relative z-10 h-125 flex justify-center items-center"> 
           <div className="relative w-full max-w-md aspect-square"> 
             <div className="absolute inset-0 border border-[#334155] rounded-full"></div> 
             <div className="absolute inset-8 border border-[#334155]/50 rounded-full"></div> 
              
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A2332] rounded-2xl border border-[#334155] shadow-xl p-8 z-10"> 
                <div> 
                   <Helmet3D /> 
                </div> 
             </div> 
           </div> 
        </div> 
      </main> 
  
      <section id="platform" className="border-t border-[#334155] bg-[#1A2332] relative z-10 scroll-mt-20"> 
        <div className="max-w-7xl mx-auto px-8 py-24"> 
          <div className="text-center mb-16"> 
            <h2 className="text-3xl font-black text-[#F1F5F9] mb-4">Core Architecture</h2> 
            <p className="text-[#94A3B8] max-w-2xl mx-auto text-lg">
              A modular system combining IoT hardware with machine learning to detect escalating danger before it becomes critical.
            </p> 
          </div> 

          <div className="grid md:grid-cols-4 gap-8"> 
            {[ 
              { icon: Wind, title: 'Hazard Detection', desc: 'Continuous monitoring of CH4, CO, O2, H2S, and ambient temperature.' }, 
              { icon: Activity, title: 'Worker Safety', desc: '6-axis IMU for fall, impact, and inactivity detection with GPS tracking.' }, 
              { icon: Server, title: 'Structural Intel', desc: 'Integration with separate nodes for strain and vibration monitoring.' }, 
              { icon: Cpu, title: 'AI Risk Engine', desc: 'Multi-sensor risk fusion and anomaly detection for predictive alerts.' } 
            ].map((pillar, i) => ( 
              <div key={i} className="bg-[#111820] p-8 rounded-xl border border-[#334155] hover:border-[#94A3B8] transition-colors shadow-sm"> 
                <pillar.icon size={36} className="text-[#F1F5F9] mb-6" /> 
                <h3 className="text-lg font-bold text-[#F1F5F9] mb-3">{pillar.title}</h3> 
                <p className="text-sm text-[#94A3B8] leading-relaxed">{pillar.desc}</p> 
              </div> 
            ))} 
          </div> 
        </div> 
      </section> 


      {/* DEMO VIDEO MODAL */}
      {showDemo && (
        <div
          className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowDemo(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-[#111820] rounded-xl border border-[#334155] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center transition-colors"
              aria-label="Close demo video"
            >
              ✕
            </button>

            {/* Video */}
            <video
              className="w-full aspect-video object-contain bg-black"
              src="/ResQ%20Helm%20Demo.mp4"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
  
      <PublicFooter /> 
       
    </div> 
  ); 
};



const TECH_COMPONENTS = [
  {
  icon: HardHat,
  title: 'Helmet Sensors',
  summary: 'The core sensing unit worn by each worker, combining environmental hazard detection, worker-safety monitoring, and location tracking in a single helmet-mounted node.',
  details: 'Proposed node: ESP32-S3 with gas, temperature, humidity, motion, and GPS sensors. The node performs local filtering, timestamping, and safety checks before transmitting telemetry.'
},
{
  icon: Wind,
  title: 'Environmental Sensors',
  summary: 'Continuous monitoring of CH₄, CO, O₂, H₂S, temperature, and humidity around each worker.',
  details: 'Proposed sensing layer includes dedicated gas sensors for methane, carbon monoxide, oxygen, and hydrogen sulfide, along with a temperature and humidity sensor. Readings are evaluated by the AI Risk Engine for real-time hazard scoring.'
},
{
  icon: Activity,
  title: 'Worker / Vital Monitoring',
  summary: '6-axis IMU for fall, impact, and inactivity detection, paired with GPS-based location tracking.',
  details: 'An accelerometer and gyroscope detect falls, impacts, sudden motion, and prolonged inactivity. GPS provides the worker’s location so emergencies can be associated with a specific worker and zone.'
},
{
  icon: Radio,
  title: 'LoRa Communication',
  summary: 'Long-range, low-power wireless link connecting each helmet node back to the site infrastructure.',
  details: 'LoRa provides low-power, long-range communication between helmet nodes and the site gateway, allowing telemetry and emergency events to be transmitted across large work areas.'
},
{
  icon: Wifi,
  title: 'LoRa Gateway',
  summary: 'Central receiver that aggregates telemetry from all active helmet nodes on site.',
  details: 'The gateway receives telemetry from multiple helmet nodes and forwards aggregated data to the backend, creating the communication bridge between field workers and the Command Center.'
},
{
  icon: Server,
  title: 'Data Transmission',
  summary: 'Sensor data is relayed from the gateway to the Command Center for processing and storage.',
  details: 'Telemetry follows the pipeline: Sensors → ESP32-S3 → LoRa → Gateway → MQTT → FastAPI → AI Risk Engine → Command Center.'
},
{
  icon: ShieldAlert,
  title: 'Emergency / Hazard Detection',
  summary: 'Multi-sensor risk fusion identifies escalating danger before it becomes critical, triggering alerts.',
  details: 'Gas concentrations, temperature, worker motion, location, and historical trends are combined into a worker-specific risk score. Critical conditions trigger alerts for both the worker and Command Center.'
},
{
  icon: LayoutDashboard,
  title: 'Command Center',
  summary: 'Central dashboard for live monitoring, personnel tracking, alerts, and AI-driven intelligence.',
  details: 'Operators get real-time visibility across workers and zones, including sensor telemetry, worker locations, risk scores, emergency alerts, and AI-driven response recommendations.'
}
];

const TechnologyPage = () => {
  return (
    <div className="min-h-screen bg-[#111820] text-[#F1F5F9] overflow-x-hidden font-sans">
      <PublicNavbar active="technology" />

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-24">
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#24527A]/15 border border-[#24527A]/40 text-[#7FA8C9] text-xs font-bold uppercase tracking-widest mb-6">
            <Cpu size={14} /> Technology
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#F1F5F9] leading-tight tracking-tight mb-6">
            How ResQ Helm works
          </h1>
          <p className="text-lg text-[#94A3B8] leading-relaxed">
            A modular system connecting helmet-mounted sensors, wireless communication, and the Command Center into a single hazard-response pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {TECH_COMPONENTS.map((item, i) => (
            <div key={i} className="bg-[#1A2332] p-8 rounded-xl border border-[#334155] hover:border-[#24527A] transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-[#24527A]/15 flex items-center justify-center mb-6">
                <item.icon size={24} className="text-[#7FA8C9]" />
              </div>
              <h3 className="text-lg font-bold text-[#F1F5F9] mb-3">{item.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-3">{item.summary}</p>
              <p className="text-xs text-[#64748B] leading-relaxed italic">{item.details}</p>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

const USE_CASES = [
  {
    icon: AlertTriangle,
    title: 'Disaster & Rescue Operations',
    description: 'Search-and-rescue teams operating in unstable or hazardous environments after a disaster.',
    help: 'Real-time worker location, fall/impact detection, and hazard alerts help coordinators track rescuers and respond to emergencies faster.'
  },
  {
    icon: Flame,
    title: 'Fire & Emergency Response',
    description: 'Firefighters and emergency crews working in low-visibility, high-risk conditions.',
    help: 'Continuous environmental sensing and instant alerts give command staff visibility into crew safety even when direct contact is limited.'
  },
  {
    icon: HardHat,
    title: 'Industrial Safety',
    description: 'Factory floors, construction sites, and other industrial settings with ongoing exposure risks.',
    help: 'Ongoing gas, temperature, and worker-vital monitoring supports proactive safety management and faster incident response.'
  },
  {
    icon: Wind,
    title: 'Mining / Confined Spaces',
    description: 'Underground mining and confined-space work where gas buildup and structural risk are ongoing concerns.',
    help: 'CH4, CO, O2, and H2S monitoring combined with sector-level risk tracking helps flag dangerous conditions early.'
  },
  {
    icon: ShieldAlert,
    title: 'Natural Disaster Operations',
    description: 'Teams responding to earthquakes, floods, and other large-scale natural disaster sites.',
    help: 'Centralized Command Center visibility across sectors helps coordinate multi-team responses in changing conditions.'
  },
];

const UseCasesPage = () => {
  return (
    <div className="min-h-screen bg-[#111820] text-[#F1F5F9] overflow-x-hidden font-sans">
      <PublicNavbar active="usecases" />

      <main className="max-w-7xl mx-auto px-8 pt-20 pb-24">
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#24527A]/15 border border-[#24527A]/40 text-[#7FA8C9] text-xs font-bold uppercase tracking-widest mb-6">
            <ShieldCheck size={14} /> Use Cases
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#F1F5F9] leading-tight tracking-tight mb-6">
            Where ResQ Helm deploys
          </h1>
          <p className="text-lg text-[#94A3B8] leading-relaxed">
            Environments where hazard sensing and real-time worker monitoring matter most.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {USE_CASES.map((useCase, i) => (
            <div key={i} className="bg-[#1A2332] p-8 rounded-xl border border-[#334155] hover:border-[#24527A] transition-colors shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-[#24527A]/15 flex items-center justify-center mb-6">
                <useCase.icon size={24} className="text-[#7FA8C9]" />
              </div>
              <h3 className="text-lg font-bold text-[#F1F5F9] mb-3">{useCase.title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">{useCase.description}</p>
              <div className="pt-4 border-t border-[#334155]">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7FA8C9] mb-2">How ResQ Helm helps</p>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{useCase.help}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

const MainApp = () => {
  const { view, pendingScroll } = useContext(AppContext);

  useEffect(() => {
    if (view === 'landing' && pendingScroll === 'platform') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [view]);

  if (view === 'landing') return <LandingPage />;
  if (view === 'technology') return <TechnologyPage />;
  if (view === 'usecases') return <UseCasesPage />;

  return (
    <div className={`flex min-h-screen ${THEME.bgBase} font-sans transition-colors duration-300`}>
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <TopNav />
        <main className="flex-1 mt-20 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-350 mx-auto">
            {view === 'dashboard' && <DashboardView />}
            {view === 'monitoring' && <LiveMonitoringView />}
            {view === 'workers' && <WorkersView />}
            {view === 'intel' && <IntelligenceView />}
            {view === 'map' && <SectorMapView />}
            
            {view === 'settings' && (
              <div className={`flex flex-col items-center justify-center h-[60vh] ${THEME.textMuted}`}>
                <Settings size={64} className="mb-6 opacity-30" />
                <h2 className="text-2xl font-bold mb-2">Module in Development</h2>
                <p className="text-sm font-medium">This feature is simulated for the prototype presentation.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <CriticalOverlay />
    </div>
  );
};

export default function ResQHelmApp() {
  return (
    <SimulationProvider>
      <MainApp />
    </SimulationProvider>
  );
}