
import { Habit } from '../types';

export const sheetApi = {
  fetchHabits: async (scriptUrl: string): Promise<Habit[]> => {
    try {
      const response = await fetch(`${scriptUrl}?action=getHabits`);
      if (!response.ok) throw new Error('Failed to fetch habits');
      return await response.json();
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  },

  updateHabitStatus: async (scriptUrl: string, habitId: string, completed: boolean): Promise<boolean> => {
    try {
      const response = await fetch(`${scriptUrl}?action=updateHabit&id=${habitId}&completed=${completed}`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  },

  addHabit: async (scriptUrl: string, habit: Omit<Habit, 'completed'>): Promise<boolean> => {
    try {
      const url = `${scriptUrl}?action=addHabit&id=${habit.id}&name=${encodeURIComponent(habit.name)}&category=${encodeURIComponent(habit.category || '')}`;
      const response = await fetch(url);
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  },

  editHabit: async (scriptUrl: string, habitId: string, name: string, category: string): Promise<boolean> => {
    try {
      const url = `${scriptUrl}?action=editHabit&id=${habitId}&name=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}`;
      const response = await fetch(url);
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  },

  deleteHabit: async (scriptUrl: string, habitId: string): Promise<boolean> => {
    try {
      const url = `${scriptUrl}?action=deleteHabit&id=${habitId}`;
      const response = await fetch(url);
      const result = await response.json();
      return result.success;
    } catch (error) {
      return false;
    }
  }
};

export const mockHabits: Habit[] = [
  { id: 'm1', name: 'Morning Meditation', completed: true, category: 'Mindfulness' },
  { id: 'm2', name: 'Exercise 30 mins', completed: false, category: 'Health' },
  { id: 'm3', name: 'Read 10 pages', completed: false, category: 'Growth' },
];
