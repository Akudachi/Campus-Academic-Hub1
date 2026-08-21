import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  Award,
  Lock,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { BackButton } from '../common/BackButton';

interface StudentProfileViewProps {
  onBack?: () => void;
  onNavigate?: (tabId: string) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ onBack, onNavigate }) => {
  const { user, student } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.getStudentProfile();
        setProfileData(res.student);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const st = profileData || student;

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
            Student Academic Profile & Credentials
          </h2>
          <p className="text-xs text-[#667085] mt-1">
            Official institutional enrollment credentials maintained by the College Academic Registry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Enrollment
          </span>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-[#DCE3ED] shadow-xs overflow-hidden">
        <div className="bg-[#13284A] p-6 text-white flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center font-serif text-2xl font-bold border border-white/20">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold">{user?.name}</h3>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#2E6FB0] text-white">
                {st?.usn || '2KL23CS001'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Bachelor of Engineering in {st?.department === 'CSE' ? 'Computer Science & Engineering' : st?.department}
            </p>
            <p className="text-xs text-[#5B93D1] font-medium">{user?.email}</p>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1 border-b sm:border-b-0 pb-3 sm:pb-0">
            <span className="text-[#667085] font-semibold uppercase tracking-wider">
              University Seat Number (USN)
            </span>
            <p className="font-mono text-sm font-bold text-[#13284A]">{st?.usn || '2KL23CS001'}</p>
          </div>

          <div className="space-y-1 border-b sm:border-b-0 pb-3 sm:pb-0">
            <span className="text-[#667085] font-semibold uppercase tracking-wider">
              Department / Branch
            </span>
            <p className="text-sm font-bold text-[#13284A]">{st?.department || 'CSE'}</p>
          </div>

          <div className="space-y-1 border-b sm:border-b-0 pb-3 sm:pb-0">
            <span className="text-[#667085] font-semibold uppercase tracking-wider">
              Current Semester & Section
            </span>
            <p className="text-sm font-bold text-[#13284A]">
              Semester {st?.currentSemester || 4} (Section {st?.section || 'A'})
            </p>
          </div>

          <div className="space-y-1 border-b sm:border-b-0 pb-3 sm:pb-0">
            <span className="text-[#667085] font-semibold uppercase tracking-wider">
              Academic Term
            </span>
            <p className="text-sm font-bold text-[#13284A]">Spring 2026 (Active)</p>
          </div>

          <div className="space-y-1 border-b sm:border-b-0 pb-3 sm:pb-0">
            <span className="text-[#667085] font-semibold uppercase tracking-wider">
              Admission Cohort
            </span>
            <p className="text-sm font-bold text-[#13284A]">2023 - 2027 (Undergraduate)</p>
          </div>

          <div className="space-y-1">
            <span className="text-[#667085] font-semibold uppercase tracking-wider">
              Institution Code
            </span>
            <p className="text-sm font-bold text-[#13284A]">AIT-BLR-048</p>
          </div>
        </div>

        {/* Read-only Security Notice */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-[#667085]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Student profile information is managed centrally by college administration. To request corrections, contact the Registrar Office.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
