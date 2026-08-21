import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Calendar,
  Plus,
  Send,
  Users,
  Building,
  Layers,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Notice, Event } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { Modal } from '../common/Modal';
import { BackButton } from '../common/BackButton';
import { useAuth } from '../../context/AuthContext';

interface NoticesEventsAdminViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const NoticesEventsAdminView: React.FC<NoticesEventsAdminViewProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'events'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast, refreshNotifications } = useAuth();

  // Notice form
  const [noticeForm, setNoticeForm] = useState<{
    title: string;
    body: string;
    audienceType: 'everyone' | 'department' | 'semester';
    audienceTargetId: string;
    priority: 'normal' | 'urgent';
  }>({
    title: '',
    body: '',
    audienceType: 'everyone',
    audienceTargetId: '',
    priority: 'normal',
  });

  // Event form
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    posterImageUrl: '',
    organizer: 'College Student Affairs',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nRes, eRes] = await Promise.all([api.getStudentNotices(), api.getStudentEvents()]);
      setNotices(nRes.notices);
      setEvents(eRes.events);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createNotice({
        ...noticeForm,
        audienceTargetId: noticeForm.audienceTargetId || null,
      });
      showToast(`Notice published! Notified ${res.notifiedStudentsCount} students.`, 'success');
      setIsNoticeModalOpen(false);
      setNoticeForm({
        title: '',
        body: '',
        audienceType: 'everyone',
        audienceTargetId: '',
        priority: 'normal',
      });
      fetchData();
      refreshNotifications();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createEvent(eventForm);
      showToast(`Event '${eventForm.title}' published campus-wide!`, 'success');
      setIsEventModalOpen(false);
      setEventForm({
        title: '',
        description: '',
        date: '',
        venue: '',
        posterImageUrl: '',
        organizer: 'College Student Affairs',
      });
      fetchData();
      refreshNotifications();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Back to Overview" />
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">Notices & Events</h2>
          <p className="text-xs text-[#667085] mt-0.5">Official campus circulars and announcements.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'notices' ? (
            <button
              id="publish-notice-btn"
              onClick={() => setIsNoticeModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Publish Circular
            </button>
          ) : (
            <button
              id="publish-event-btn"
              onClick={() => setIsEventModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#2E6FB0]/90 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Publish Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DCE3ED] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'notices'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-[#2E6FB0]" />
          <span>Circulars & Notices ({notices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'events'
              ? 'border-[#13284A] text-[#13284A]'
              : 'border-transparent text-[#667085] hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-purple-600" />
          <span>Campus Events ({events.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'notices' ? (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#667085]">Loading notices...</div>
          ) : notices.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-[#DCE3ED] text-center text-sm text-[#667085]">
              No circulars published yet.
            </div>
          ) : (
            notices.map((n, idx) => (
              <div
                key={n.id || `admin-not-${idx}`}
                className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusPill status={n.priority} size="sm" />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Audience: {n.audienceType.toUpperCase()}
                      {n.audienceTargetId ? ` (${n.audienceTargetId})` : ''}
                    </span>
                    <span className="text-xs text-[#667085]">
                      {new Date(n.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#13284A]">{n.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl whitespace-pre-line">
                    {n.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-sm text-[#667085]">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="col-span-2 bg-white p-8 rounded-xl border border-[#DCE3ED] text-center text-sm text-[#667085]">
              No campus events published yet.
            </div>
          ) : (
            events.map((ev, idx) => (
              <div
                key={ev.id || `admin-ev-${idx}`}
                className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {ev.posterImageUrl && (
                  <img
                    src={ev.posterImageUrl}
                    alt={ev.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover border-b border-slate-100"
                  />
                )}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#667085]">
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {ev.organizer}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(ev.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#13284A]">{ev.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {ev.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#667085]">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {ev.venue}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Publish Notice Modal */}
      <Modal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title="Publish Circular / Notice"
        subtitle="Notifies target students and faculty immediately."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateNotice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Circular Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule for Internal Assessment Test 1 (Spring 2026)"
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
              <select
                value={noticeForm.audienceType}
                onChange={(e: any) =>
                  setNoticeForm({ ...noticeForm, audienceType: e.target.value, audienceTargetId: '' })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden bg-white"
              >
                <option value="everyone">Everyone (All Students & Faculty)</option>
                <option value="department">Specific Department</option>
                <option value="semester">Specific Semester</option>
              </select>
            </div>

            {noticeForm.audienceType === 'department' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department</label>
                <select
                  value={noticeForm.audienceTargetId}
                  onChange={(e) => setNoticeForm({ ...noticeForm, audienceTargetId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white"
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="ISE">Information Science (ISE)</option>
                  <option value="MECH">Mechanical (MECH)</option>
                </select>
              </div>
            ) : noticeForm.audienceType === 'semester' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Semester</label>
                <select
                  value={noticeForm.audienceTargetId}
                  onChange={(e) => setNoticeForm({ ...noticeForm, audienceTargetId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white"
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="4">Semester 4 (Active)</option>
                  <option value="6">Semester 6</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={noticeForm.priority}
                  onChange={(e: any) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white"
                >
                  <option value="normal">Normal Circular</option>
                  <option value="urgent">Urgent / High Priority</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notice Body Text</label>
            <textarea
              rows={5}
              required
              placeholder="Enter full circular guidelines, schedules, and instructions..."
              value={noticeForm.body}
              onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Publish Circular
            </button>
          </div>
        </form>
      </Modal>

      {/* Publish Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Publish Campus Event"
        subtitle="Broadcast technical symposiums, hackathons, and guest lectures."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Hackfest 2026: 24-Hour Code Sprint"
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event Date</label>
              <input
                type="date"
                required
                value={eventForm.date}
                onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Main Auditorium / CSE Lab 3"
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              required
              placeholder="Detail the event objectives, registration details, and eligibility..."
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organizer</label>
              <input
                type="text"
                value={eventForm.organizer}
                onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Poster Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={eventForm.posterImageUrl}
                onChange={(e) => setEventForm({ ...eventForm, posterImageUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2E6FB0] text-white hover:bg-[#2E6FB0]/90 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Publish Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
