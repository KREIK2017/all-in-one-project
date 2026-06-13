import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Load saved theme/font from localStorage or defaults
  const [theme, setTheme] = useState(() => localStorage.getItem('aio_theme') || 'dark');
  const [font, setFont] = useState(() => localStorage.getItem('aio_font') || 'Inter');

  // Sync with user context when it loads
  useEffect(() => {
    if (user?.theme) setTheme(user.theme);
    if (user?.font) setFont(user.font);
  }, [user?.theme, user?.font]);

  useEffect(() => {
    // Apply theme class to body
    const oldThemes = ['theme-dark', 'theme-light', 'theme-midnight', 'theme-indigo'];
    document.body.classList.remove(...oldThemes);
    
    let themeClass = 'theme-dark';
    if (theme === 'light') themeClass = 'theme-light';
    if (theme === 'midnight') themeClass = 'theme-midnight';
    if (theme === 'indigo') themeClass = 'theme-indigo';
    
    document.body.classList.add(themeClass);
    localStorage.setItem('aio_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply font family to body
    document.body.style.fontFamily = `"${font}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    
    // Dynamically load font from Google Fonts if needed
    if (font === 'Outfit' && !document.getElementById('font-outfit')) {
      const link = document.createElement('link');
      link.id = 'font-outfit';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap';
      document.head.appendChild(link);
    }
    if (font === 'Roboto Mono' && !document.getElementById('font-roboto-mono')) {
        const link = document.createElement('link');
        link.id = 'font-roboto-mono';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap';
        document.head.appendChild(link);
      }

    localStorage.setItem('aio_font', font);
  }, [font]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, font, setFont }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
