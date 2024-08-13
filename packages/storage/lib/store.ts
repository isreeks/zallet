import { create } from 'zustand';

interface AppState {
  password: string;
  setPassword: (data: string) => void;
}

export const useAppStore = create<AppState>()(set => ({
  password: '',
  setPassword: data => set({ password: data }),
}));
