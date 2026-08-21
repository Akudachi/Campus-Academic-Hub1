import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Building,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Notice, Event } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { BackButton } from '../common/BackButton';

interface StudentNoticesEventsViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const StudentNoticesEventsView: React.FC<StudentNoticesEventsViewProps> = ({ onBack, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'events'>('notices');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [nRes, eRes] = await Promise.all([
          api.getStudentNotices(),
          api.getStudentEvents(),
        ]);
        setNotices(nRes.notices);
        setEvents(eRes.events);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-5">
      {/* Top Navigation Bar */}
      {onBack && (
        <div className="flex items-center justify-between">
          <BackButton onClick={onBack} label="Back to Dashboard" />
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#DCE3ED] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#13284A] font-serif">
            Campus Notices & Events Bulletin
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Official department notices, examination guidelines, hackathons, and symposiums.
          </p>
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
          <span>Official Circulars ({notices.length})</span>
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
            <div className="py-12 text-center text-xs text-[#667085]">Loading circulars...</div>
          ) : notices.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-[#DCE3ED] text-center text-xs text-[#667085]">
              No active circulars for your cohort.
            </div>
          ) : (
            notices.map((n, idx) => (
              <div
                key={n.id || `not-item-${idx}`}
                className="bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <StatusPill status={n.priority} size="sm" />
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Audience: {n.audienceType.toUpperCase()}
                      {n.audienceTargetId ? ` (${n.audienceTargetId})` : ''}
                    </span>
                  </div>
                  <span className="text-xs text-[#667085]">
                    {new Date(n.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#13284A]">{n.title}</h3>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line max-w-3xl">
                  {n.body}
                </p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-2 py-12 text-center text-xs text-[#667085]">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="col-span-2 bg-white p-8 rounded-xl border border-[#DCE3ED] text-center text-xs text-[#667085]">
              No events scheduled currently.
            </div>
          ) : (
            events.map((ev, idx) => (
              <div
                key={ev.id || `ev-item-${idx}`}
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
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-[#2E6FB0]" />
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
    </div>
  );
};
