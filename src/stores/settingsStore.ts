import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    primaryColor: string;
    colorScheme: 'light' | 'dark' | 'auto';
    defaultRadius: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

interface SettingsActions {
    setPrimaryColor: (color: string) => void;
    setColorScheme: (scheme: 'light' | 'dark' | 'auto') => void;
    setDefaultRadius: (radius: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            primaryColor: 'blue',
            colorScheme: 'dark',
            defaultRadius: 'md',

            setPrimaryColor: (primaryColor) => set({ primaryColor }),
            setColorScheme: (colorScheme) => set({ colorScheme }),
            setDefaultRadius: (defaultRadius) => set({ defaultRadius }),
        }),
        {
            name: 'bloat-sql-settings',
        }
    )
);

export const usePrimaryColor = () => useSettingsStore((s) => s.primaryColor);
export const useColorScheme = () => useSettingsStore((s) => s.colorScheme);
export const useDefaultRadius = () => useSettingsStore((s) => s.defaultRadius);
export const useSetPrimaryColor = () => useSettingsStore((s) => s.setPrimaryColor);
export const useSetColorScheme = () => useSettingsStore((s) => s.setColorScheme);
export const useSetDefaultRadius = () => useSettingsStore((s) => s.setDefaultRadius);
