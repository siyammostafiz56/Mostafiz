
export interface Habit {
  id: string;
  name: string;
  completed: boolean;
  category?: string;
}

export interface AppConfig {
  scriptUrl: string;
  isConfigured: boolean;
}

export enum AppStatus {
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
  SETUP = 'SETUP'
}

export type HabitAction = 'getHabits' | 'updateHabit' | 'addHabit' | 'editHabit' | 'deleteHabit';
