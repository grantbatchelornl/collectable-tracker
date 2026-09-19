import { useEffect, useState } from 'react';

const THEME_KEY = 'collectable-theme';

export const THEMES = [
  { id: 'system', label: 'System', colors: ['#ffffff', '#94a3b8', '#0f172a'] },
  { id: 'light', label: 'Light', colors: ['#F0FDF4', '#059669', '#064E3B'] },
  { id: 'dark', label: 'Dark', colors: ['#064E3B', '#10B981', '#F0FDF4'] },
  { id: 'midnight', label: 'Midnight', colors: ['#0a0e1a', '#6366f1', '#e2e8f0'] },
  { id: 'emerald', label: 'Emerald', colors: ['#0a1a14', '#10b981', '#dcfce7'] },
  { id: 'royal-purple', label: 'Royal Purple', colors: ['#140a1e', '#a855f7', '#f3e8ff'] },
  { id: 'poke-red', label: 'Poké Red', colors: ['#1a0a0a', '#ef4444', '#fee2e2'] },
  { id: 'gold-vault', label: 'Gold Vault', colors: ['#1a1408', '#f59e0b', '#fef3c7'] },
];

const THEME_CLASSES = [
  'dark',
  'theme-midnight',
  'theme-emerald',
  'theme-royal-purple',
  'theme-poke-red',
  'theme-gold-vault',
];

export function applyTheme(themeId) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  root.classList.remove(...THEME_CLASSES);

  let effectiveTheme = themeId || 'light';

  if (effectiveTheme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  if (effectiveTheme !== 'light') {
    root.classList.add('dark');

    if (effectiveTheme !== 'dark') {
      root.classList.add(`theme-${effectiveTheme}`);
    }
  }
}

export function getStoredTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return localStorage.getItem(THEME_KEY) || 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    const handleThemeChange = (event) => {
      setThemeState(event.detail);
    };

    window.addEventListener('theme-change', handleThemeChange);

    let mediaQuery = null;

    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    if (theme === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    return () => {
      window.removeEventListener('theme-change', handleThemeChange);

      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, [theme]);

  const setTheme = (themeId) => {
    localStorage.setItem(THEME_KEY, themeId);
    applyTheme(themeId);
    setThemeState(themeId);

    window.dispatchEvent(
      new CustomEvent('theme-change', {
        detail: themeId,
      })
    );
  };

  const toggleTheme = () => {
    const isCurrentlyDark =
      document.documentElement.classList.contains('dark');

    setTheme(isCurrentlyDark ? 'light' : 'dark');
  };

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
