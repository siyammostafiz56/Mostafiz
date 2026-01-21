
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Habit, AppConfig, AppStatus } from './types';
import { sheetApi, mockHabits } from './services/api';

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.LOADING);
  const [config, setConfig] = useState<AppConfig>({
    scriptUrl: localStorage.getItem('habit_script_url') || '',
    isConfigured: !!localStorage.getItem('habit_script_url')
  });
  
  // Modals state
  const [showSetup, setShowSetup] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // Form fields
  const [inputUrl, setInputUrl] = useState(config.scriptUrl);
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('');

  const today = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  }, []);

  const completedCount = habits.filter(h => h.completed).length;
  const progressPercent = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

  const loadData = useCallback(async () => {
    if (!config.isConfigured) {
      setHabits(mockHabits);
      setStatus(AppStatus.READY);
      return;
    }
    setStatus(AppStatus.LOADING);
    try {
      const data = await sheetApi.fetchHabits(config.scriptUrl);
      setHabits(data);
      setStatus(AppStatus.READY);
    } catch (error) {
      setStatus(AppStatus.ERROR);
    }
  }, [config.isConfigured, config.scriptUrl]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const newStatus = !habit.completed;
    
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: newStatus } : h));
    if (config.isConfigured) {
      const success = await sheetApi.updateHabitStatus(config.scriptUrl, habitId, newStatus);
      if (!success) {
        setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: !newStatus } : h));
      }
    }
  };

  const openEditor = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitName(habit.name);
      setHabitCategory(habit.category || '');
    } else {
      setEditingHabit(null);
      setHabitName('');
      setHabitCategory('');
    }
    setShowEditor(true);
  };

  const handleSaveHabit = async () => {
    if (!habitName.trim()) return;

    if (editingHabit) {
      // EDIT MODE
      const updated = { ...editingHabit, name: habitName, category: habitCategory };
      setHabits(prev => prev.map(h => h.id === editingHabit.id ? updated : h));
      if (config.isConfigured) {
        await sheetApi.editHabit(config.scriptUrl, editingHabit.id, habitName, habitCategory);
      }
    } else {
      // ADD MODE
      const newHabit: Habit = {
        id: 'h_' + Date.now(),
        name: habitName,
        category: habitCategory,
        completed: false
      };
      setHabits(prev => [...prev, newHabit]);
      if (config.isConfigured) {
        await sheetApi.addHabit(config.scriptUrl, newHabit);
      }
    }
    setShowEditor(false);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!confirm("Are you sure you want to delete this habit?")) return;
    setHabits(prev => prev.filter(h => h.id !== id));
    if (config.isConfigured) {
      await sheetApi.deleteHabit(config.scriptUrl, id);
    }
    setShowEditor(false);
  };

  const saveConfig = () => {
    localStorage.setItem('habit_script_url', inputUrl.trim());
    setConfig({ scriptUrl: inputUrl.trim(), isConfigured: !!inputUrl.trim() });
    setShowSetup(false);
    loadData();
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 flex flex-col relative overflow-hidden pb-20">
      <header className="p-6 pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Today</h1>
          <p className="text-gray-500 font-medium mt-1">{today}</p>
        </div>
        <button onClick={() => setShowSetup(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400">
          <SettingsIcon />
        </button>
      </header>

      <div className="px-6 mb-6">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Progress</span>
            <span className="text-2xl font-bold mt-1">{completedCount} of {habits.length} Done</span>
          </div>
          <div className="relative w-16 h-16 flex items-center justify-center font-bold text-xs">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-indigo-500 opacity-30" />
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={176} strokeDashoffset={176 * (1 - progressPercent / 100)} className="transition-all duration-700 ease-out" />
            </svg>
            {Math.round(progressPercent)}%
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 space-y-3 overflow-y-auto no-scrollbar">
        {status === AppStatus.LOADING && habits.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          habits.map((habit) => (
            <div 
              key={habit.id}
              className={`group flex items-center p-4 rounded-2xl transition-all ${habit.completed ? 'bg-white/60 opacity-60' : 'bg-white shadow-sm ring-1 ring-gray-100'}`}
            >
              <div onClick={() => toggleHabit(habit.id)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${habit.completed ? 'bg-indigo-50 text-indigo-500 scale-95' : 'bg-gray-50 text-gray-300'}`}>
                {habit.completed ? <CheckIcon /> : <div className="w-5 h-5 border-2 border-gray-200 rounded-md"></div>}
              </div>
              <div className="ml-4 flex-1 cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                <h3 className={`font-semibold text-gray-800 ${habit.completed ? 'line-through text-gray-400' : ''}`}>{habit.name}</h3>
                {habit.category && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{habit.category}</span>}
              </div>
              <button onClick={() => openEditor(habit)} className="p-2 text-gray-300 hover:text-indigo-500 transition-colors">
                <EditIcon />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => openEditor()}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <PlusIcon />
      </button>

      {/* Modal: Setup */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSetup(false)} />
          <div className="relative w-full bg-white rounded-3xl p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <label className="text-xs font-bold text-gray-400 uppercase">Apps Script Web App URL</label>
            <input 
              type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)}
              className="w-full mt-2 p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-500 mb-6 text-sm"
              placeholder="https://script.google.com/..."
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSetup(false)} className="flex-1 py-4 text-gray-400 font-bold">Cancel</button>
              <button onClick={saveConfig} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Habit Editor */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditor(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingHabit ? 'Edit Habit' : 'New Habit'}</h2>
              {editingHabit && (
                <button onClick={() => handleDeleteHabit(editingHabit.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                  <TrashIcon />
                </button>
              )}
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Habit Name</label>
                <input 
                  type="text" value={habitName} onChange={(e) => setHabitName(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Drink Water"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Category (Optional)</label>
                <input 
                  type="text" value={habitCategory} onChange={(e) => setHabitCategory(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Health"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowEditor(false)} className="flex-1 py-4 text-gray-400 font-bold">Cancel</button>
              <button onClick={handleSaveHabit} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100">
                {editingHabit ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
