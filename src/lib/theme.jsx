import { useState, useEffect } from 'react';

const THEME_KEY = 'collectable-theme';

export const THEMES = [
  { id: 'light', label: 'Light', colors: ['#f4f4f7', '#4f46e5', '#0c1320'] },
  { id: 'dark', label: 'Charcoal', colors: ['#161b26', '#4f46e5', '#f1f2f4'] },
  { id: 'midnight', label: 'Midnight', colors: ['#0a0e1a', '#6366f1', '#e2e8f0'] },
  { id: 'emerald', label: 'Emerald', colors: ['#0a1a14', '#10b981', '#dcfce7'] },
  { id: 'royal-purple', label: 'Royal Purple', colors: ['#140a1e', '#a855f7', '#f3e8ff'] },
  { id: 'poke-red', label: 'Poké Red', colors: ['#1a0a0a', '#ef4444', '#fee2e2'] },
  { id: 'gold-vault', label: 'Gold Vault', colors: ['#1a1408', '#f59e0b', '#fef3c7'] },
];

const THEME_CLASSES = ['dark', 'theme-midnight', 'theme-emerald', 'theme-royal-purple', 'theme-poke-red', 'theme-gold-vault'];

export function applyTheme(themeId) {
  const root = document.documentElement;
  root.classList.remove(...THEME_CLASSES);
  if (themeId !== 'light') {
    root.classList.add('dark');
    if (themeId !== 'dark') {
      root.classList.add(`theme-${themeId}`);
    }
  }
  localStorage.setItem(THEME_KEY, themeId);
  window.dispatchEvent(new CustomEvent('theme-change', { detail: themeId }));
}

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(THEME_KEY) || 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    const handler = (e) => setThemeState(e.detail);
    window.addEventListener('theme-change', handler);
    return () => window.removeEventListener('theme-change', handler);
  }, [theme]);

  const setTheme = (id) => setThemeState(id);
  return { theme, setTheme };
}