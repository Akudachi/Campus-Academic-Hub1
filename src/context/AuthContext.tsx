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
  login: (credentials: { email?: string; userId?: string; role?: string }) => Promise<void>;
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
      // 1. Fetch available personas for the switch bar
      const pRes = await api.getPersonas();
      setPersonas(pRes.personas);

      // 2. Fetch active me session
      const meRes = await api.getMe();
      setUser(meRes.user);
      setTeacher(meRes.teacher || null);
      setStudent(meRes.student || null);
      setAuthToken(meRes.user.id, meRes.user.id);

      // 3. Unread notification count
      const notifRes = await api.getNotifications();
      setUnreadCount(notifRes.unreadCount);
    } catch (err: any) {
      console.warn('Boot auth load fallback:', err.message);
      // If no session found, fallback to first persona (Admin)
      try {
        const pRes = await api.getPersonas();
        if (pRes.personas.length > 0) {
          const first = pRes.personas[0];
          setUser(first.user);
          setTeacher(first.teacher || null);
          setStudent(first.student || null);
          setAuthToken(first.user.id, first.user.id);
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const login = async (credentials: { email?: string; userId?: string; role?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setUser(res.user);
      setTeacher(res.teacher || null);
      setStudent(res.student || null);
      setAuthToken(res.token, res.user.id);
      showToast(`Signed in as ${res.user.name} (${res.user.role.toUpperCase()})`, 'success');
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
      const target = personas.find((p) => p.user.id === targetUserId);
      if (target) {
        setAuthToken(target.user.id, target.user.id);
        setUser(target.user);
        setTeacher(target.teacher || null);
        setStudent(target.student || null);
        showToast(`Switched active persona to ${target.user.name} (${target.user.role})`, 'info');
        await refreshNotifications();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setTeacher(null);
    setStudent(null);
    showToast('Signed out successfully.', 'info');
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
