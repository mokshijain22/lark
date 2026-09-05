import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nook_token');
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem('nook_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('nook_token', res.data.data.token);
    setUser(res.data.data);
  };

  const register = async (name, email, password) => {
    const res = await client.post('/auth/register', { name, email, password });
    localStorage.setItem('nook_token', res.data.data.token);
    setUser(res.data.data);
  };

  const logout = () => {
    localStorage.removeItem('nook_token');
    setUser(null);
  };

  // Lets any component patch fields on the logged-in user (e.g. after an avatar upload)
  // without a full re-fetch — merges into the existing user object.
  const updateUser = (patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
