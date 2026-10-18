import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const C = createContext();

export const useAuth = () => useContext(C);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const cachedToken = localStorage.getItem('ats_token');
    const cachedUserText = localStorage.getItem('ats_user');
    let cachedUser = null;

    try {
      cachedUser = cachedUserText ? JSON.parse(cachedUserText) : null;
    } catch {
      cachedUser = null;
    }

    const clearSession = () => {
      localStorage.removeItem('ats_token');
      localStorage.removeItem('ats_user');
      if (active) {
        setUser(null);
        setReady(true);
      }
    };

    const handleUnauthorized = () => clearSession();
    window.addEventListener('ats:unauthorized', handleUnauthorized);

    if (!cachedToken || !cachedUser || typeof cachedUser !== 'object') {
      clearSession();
    } else {
      api.get('/auth/me')
        .then((response) => {
          if (active) setUser(response.data);
        })
        .catch((error) => {
          if (!active) return;
          if (error.response?.status === 401) {
            clearSession();
          } else {
            setUser(cachedUser);
          }
        })
        .finally(() => {
          if (active) setReady(true);
        });
    }

    return () => {
      active = false;
      window.removeEventListener('ats:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (data) => {
    const response = await api.post('/auth/login', data);
    localStorage.setItem('ats_token', response.data.access_token);
    localStorage.setItem('ats_user', JSON.stringify(response.data.user));
    setUser(response.data.user);
    setReady(true);
  };

  const logout = () => {
    localStorage.removeItem('ats_token');
    localStorage.removeItem('ats_user');
    setUser(null);
    setReady(true);
  };

  return (
    <C.Provider value={{ user, ready, login, logout }}>
      {children}
    </C.Provider>
  );
}
