import React, { useEffect, useState } from 'react';
import { X, Bell, CheckCheck, BookOpen, FileCheck2, Award, Calendar, Megaphone } from 'lucide-react';
import { api } from '../../lib/api';
import { Notification, NotificationType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tabId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { refreshNotifications } = useAuth();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'attendance':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'assignment':
        return <FileCheck2 className="w-4 h-4 text-sky-600" />;
      case 'marks':
        return <Award className="w-4 h-4 text-[#E0982A]" />;
      case 'notice':
        return <Megaphone className="w-4 h-4 text-[#2E6FB0]" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeColor = (type: NotificationType) => {
    switch (type) {
      case 'attendance':
        return 'bg-emerald-50 border-emerald-200';
      case 'assignment':
        return 'bg-sky-50 border-sky-200';
      case 'marks':
        return 'bg-amber-50 border-amber-200';
      case 'notice':
        return 'bg-blue-50 border-blue-200';
      case 'event':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/50 transition-opacity" onClick={onClose} />

      <div className="relative z-10 fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-screen sm:max-w-md bg-white sm:border-l border-[#DCE3ED] shadow-2xl flex flex-col h-full animate-slide-up sm:animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-[#DCE3ED] bg-[#F8FAFC] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#13284A]/10 text-[#13284A] rounded-xl">
                <Bell className="w-5 h-5 text-[#2E6FB0]" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#13284A]">Notification Feed</h3>
                <p className="text-xs text-[#667085]">
                  {notifications.filter((n) => !n.read).length} unread alerts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                className="text-xs font-semibold text-[#2E6FB0] hover:text-[#13284A] px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Mark All Read</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-24 sm:pb-4 overscroll-contain">
            {loading ? (
              <div className="py-12 text-center text-sm text-[#667085]">Loading feed...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">No Notifications</p>
                <p className="text-xs text-[#667085]">You are all caught up with your academic updates.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) handleMarkAsRead(notif.id);
                    if (notif.link && onNavigate) {
                      const tab = notif.link.split('/').pop() || 'dashboard';
                      onNavigate(tab);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    notif.read
                      ? 'bg-white border-[#DCE3ED] hover:border-slate-300 opacity-80'
                      : 'bg-blue-50/40 border-[#2E6FB0]/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border shrink-0 ${getBadgeColor(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-[#13284A] leading-snug">{notif.title}</h4>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[#2E6FB0] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-[#667085]">
                        <span className="capitalize font-medium text-slate-500">{notif.type}</span>
                        <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
