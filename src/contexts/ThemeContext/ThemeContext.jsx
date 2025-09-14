import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

const getSystemTheme = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  // State to hold the user's selected setting ('light', 'dark', or 'system')
  const [themeSetting, setThemeSetting] = useState(() => {
    try {
        // Get the theme from localStorage or default to 'system'
        const storedTheme = window.localStorage.getItem('theme');
        return storedTheme ? storedTheme : 'system';
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return 'system';
    }
  });

  // State to hold the theme that is actually applied ('light' or 'dark')
  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    if (themeSetting === 'system') {
        return getSystemTheme();
    }
    return themeSetting;
  });

  // Effect to update the effective theme when the setting changes
  useEffect(() => {
    if (themeSetting === 'system') {
      setEffectiveTheme(getSystemTheme());
    } else {
      setEffectiveTheme(themeSetting);
    }
  }, [themeSetting]);

  // Effect to listen for OS-level theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
      if (themeSetting === 'system') {
        setEffectiveTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themeSetting]);
  
  // The function to change the theme setting, now exposed in the context
  const setTheme = (newTheme) => {
    try {
        window.localStorage.setItem('theme', newTheme);
    } catch (error) {
        console.error("Could not save theme to localStorage", error);
    }
    setThemeSetting(newTheme);
  };

  const value = {
    theme: themeSetting, // The user's preference ('light', 'dark', 'system')
    effectiveTheme: effectiveTheme, // The applied theme ('light', 'dark')
    setTheme, // The function to change the preference
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

