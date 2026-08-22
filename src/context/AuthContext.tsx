import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Teacher, Student, UserRole } from '../types';
import { api, setAuthToken } from '../lib/api';

interface Persona {
  user: User;
  teacher?: Teacher;
  student?: Student;
  displaySub: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AuthContextType {
  user: User | null;
  teacher: Teacher | null;
  student: Student | null;
  role: UserRole;
  isLoading: boolean;
  personas: Persona[];
  unreadCount: number;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  login: (credentials: {
    key?: string;
    credential?: string;
    email?: string;
    userId?: string;
    role?: string;
    password?: string;
    teacherCode?: string;
    usn?: string;
  }) => Promise<void>;
  logout: () => void;
  switchPersona: (targetUserId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setUnreadCount(res.unreadCount);
    } catch {
      // Ignore notification fetch errors during initial boot
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch available personas for directory / quick switcher
      try {
        const pRes = await api.getPersonas();
        setPersonas(pRes.personas || []);
      } catch (e) {
        console.warn('Persona list load:', e);
      }

      // 2. Fetch active session if token exists in localStorage
      const savedToken = localStorage.getItem('cah_token');
      if (savedToken) {
        const meRes = await api.getMe();
        if (meRes?.user) {
          setUser(meRes.user);
          setTeacher(meRes.teacher || null);
          setStudent(meRes.student || null);
          setAuthToken(meRes.user.id, meRes.user.id);
          await refreshNotifications();
        }
      } else {
        // No saved token -> Stay on Login Page
        setUser(null);
        setTeacher(null);
        setStudent(null);
      }
    } catch (err: any) {
      console.warn('Boot auth load:', err.message);
      setUser(null);
      setTeacher(null);
      setStudent(null);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const login = async (credentials: {
    key?: string;
    credential?: string;
    email?: string;
    userId?: string;
    role?: string;
    password?: string;
    teacherCode?: string;
    usn?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      setTeacher(res.teacher || null);
      setStudent(res.student || null);
      setAuthToken(res.token, res.user.id);
      showToast(`Welcome back, ${res.user.name}! (${res.user.role.toUpperCase()} Portal)`, 'success');
      
      // Refresh directory list after login
      try {
        const pRes = await api.getPersonas();
        setPersonas(pRes.personas || []);
      } catch {}

      await refreshNotifications();
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const switchPersona = async (targetUserId: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ userId: targetUserId });
      setUser(res.user);
      setTeacher(res.teacher || null);
      setStudent(res.student || null);
      setAuthToken(res.token, res.user.id);
      showToast(`Switched active portal to ${res.user.name} (${res.user.role.toUpperCase()})`, 'info');
      await refreshNotifications();
    } catch (err: any) {
      showToast(err.message || 'Switch persona failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setTeacher(null);
    setStudent(null);
    showToast('Signed out of campus portal.', 'info');
  };

  const role: UserRole = user?.role || 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        teacher,
        student,
        role,
        isLoading,
        personas,
        unreadCount,
        toasts,
        showToast,
        removeToast,
        login,
        logout,
        switchPersona,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
