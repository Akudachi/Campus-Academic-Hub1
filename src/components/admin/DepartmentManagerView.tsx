import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  UserCheck,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Department } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';

interface DepartmentManagerViewProps {
  onDepartmentChanged?: () => void;
  onBack?: () => void;
}

export const DepartmentManagerView: React.FC<DepartmentManagerViewProps> = ({ onDepartmentChanged, onBack }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useAuth();

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formHOD, setFormHOD] = useState('');
  const [formEstYear, setFormEstYear] = useState('');
  const [formDesc, setFormDesc] = useState('');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminDepartments();
      setDepartments(res.departments || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormCode('');
    setFormName('');
    setFormHOD('');
    setFormEstYear(new Date().getFullYear().toString());
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (dept: Department) => {
    setEditingDept(dept);
    setFormCode(dept.code);
    setFormName(dept.name);
    setFormHOD(dept.headOfDepartment || '');
    setFormEstYear(dept.establishedYear || '2020');
    setFormDesc(dept.description || '');
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      showToast('Branch code and Department name are required.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      if (editingDept) {
        await api.updateDepartment(editingDept.id, {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          headOfDepartment: formHOD.trim(),
          establishedYear: formEstYear.trim(),
          description: formDesc.trim(),
        });
        showToast(`Branch ${formCode.toUpperCase()} updated successfully!`, 'success');
      } else {
        await api.createDepartment({
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          headOfDepartment: formHOD.trim(),
          establishedYear: formEstYear.trim(),
          description: formDesc.trim(),
        });
        showToast(`New Branch ${formCode.toUpperCase()} created successfully!`, 'success');
      }
      setIsModalOpen(false);
      await fetchDepartments();
      if (onDepartmentChanged) onDepartmentChanged();
    } catch (err: any) {
      showToast(err.message || 'Failed to save branch', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsProcessing(true);
    try {
      await api.deleteDepartment(deleteTarget.id, forceDelete);
      showToast(`Branch ${deleteTarget.code} (${deleteTarget.name}) deleted successfully.`, 'info');
      setDeleteTarget(null);
      setForceDelete(false);
      await fetchDepartments();
      if (onDepartmentChanged) onDepartmentChanged();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete branch', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDepts = departments.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.code.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      (d.headOfDepartment && d.headOfDepartment.toLowerCase().includes(q))
    );
  });

  const totalStudents = departments.reduce((acc, d) => acc + (d.studentsCount || 0), 0);
  const totalFaculty = departments.reduce((acc, d) => acc + (d.teachersCount || 0), 0);
  const totalSemesters = departments.reduce((acc, d) => acc + (d.semestersCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCE3ED] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#13284A]">Academic Branches & Departments</h3>
            <span className="text-[11px] font-bold text-[#2E6FB0] bg-[#2E6FB0]/10 px-2.5 py-0.5 rounded-full border border-[#2E6FB0]/20">
              {departments.length} Active Branches
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Create and delete degree branches (ECE, CSE, MECH, etc.), designate department heads, and manage course structures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDepartments}
            disabled={loading}
            className="p-2 text-xs font-semibold rounded-lg border border-[#DCE3ED] hover:bg-slate-50 text-slate-700 transition-colors"
            title="Refresh branches list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="create-branch-btn"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#5B93D1]" />
            <span>Create New Branch</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Branches"
          value={departments.length.toString()}
          subtitle="Configured disciplines"
          icon={Building2}
          accentColor="blue"
        />
        <MetricCard
          title="Total Enrolled Students"
          value={totalStudents.toString()}
          subtitle="Across all departments"
          icon={GraduationCap}
          accentColor="green"
        />
        <MetricCard
          title="Faculty Members"
          value={totalFaculty.toString()}
          subtitle="Assigned department staff"
          icon={Users}
          accentColor="purple"
        />
        <MetricCard
          title="Active Semester Cycles"
          value={totalSemesters.toString()}
          subtitle="Branch academic sections"
          icon={Layers}
          accentColor="amber"
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-[#DCE3ED]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search branches by code (e.g., ECE, CSE) or department name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] focus:outline-hidden"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Branches Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCE3ED] text-center text-xs text-[#667085]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2E6FB0] mb-2" />
          Loading academic branches...
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCE3ED] text-center space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-300" />
          <h4 className="text-sm font-bold text-slate-700">No branches found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery ? `No branches match "${searchQuery}"` : 'No departments currently exist. Create your first academic branch.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#13284A] text-white hover:bg-[#13284A]/90 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepts.map((dept) => {
            const hasStudents = (dept.studentsCount || 0) > 0;
            const hasFaculty = (dept.teachersCount || 0) > 0;

            return (
              <div
                key={dept.id}
                id={`branch-card-${dept.code.toLowerCase()}`}
                className="bg-white rounded-xl border border-[#DCE3ED] p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Bar with Code Badge and Action Buttons */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-[#13284A] text-white text-xs font-mono font-bold tracking-wider shadow-2xs">
                        {dept.code}
                      </span>
                      {dept.establishedYear && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Est. {dept.establishedYear}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(dept)}
                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-[#13284A] transition-colors"
                        title={`Edit ${dept.code} branch details`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(dept);
                          setForceDelete(false);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title={`Delete ${dept.code} branch`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & HOD */}
                  <h4 className="text-sm font-bold text-[#13284A] line-clamp-1 mb-1" title={dept.name}>
                    {dept.name}
                  </h4>

                  {dept.headOfDepartment ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#2E6FB0] shrink-0" />
                      <span className="font-medium truncate">HOD: {dept.headOfDepartment}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic mb-2.5">Head of Department unassigned</div>
                  )}

                  {/* Description */}
                  {dept.description && (
                    <p className="text-[11px] text-[#667085] line-clamp-2 leading-relaxed mb-4">
                      {dept.description}
                    </p>
                  )}
                </div>

                {/* Bottom Stats Grid */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center bg-[#F8FAFC] -mx-5 -mb-5 p-3 rounded-b-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{dept.studentsCount || 0}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Students</div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-xs font-bold text-slate-800">{dept.teachersCount || 0}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Faculty</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{dept.semestersCount || 0}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Semesters</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Branch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit Branch: ${editingDept.code}` : 'Create New Academic Branch'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveDepartment} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ECE"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0] uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Electronics & Communication Eng"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Head of Department (HOD)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Ananya Joshi"
                value={formHOD}
                onChange={(e) => setFormHOD(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Established Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2026"
                value={formEstYear}
                onChange={(e) => setFormEstYear(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Discipline Focus
            </label>
            <textarea
              rows={2}
              placeholder="e.g. VLSI design, embedded systems, communications, and IoT hardware."
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCE3ED] focus:ring-1 focus:ring-[#2E6FB0]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-white bg-[#13284A] hover:bg-[#13284A]/90 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{editingDept ? 'Update Branch' : 'Create Branch'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setForceDelete(false);
        }}
        title={`Delete Branch: ${deleteTarget?.code}`}
        maxWidth="md"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold mb-1">Confirm Branch Deletion</h5>
                <p className="leading-relaxed text-red-800">
                  Are you sure you want to delete the <strong>{deleteTarget.name} ({deleteTarget.code})</strong> branch?
                </p>
              </div>
            </div>

            {/* Warning if branch has active data */}
            {((deleteTarget.studentsCount || 0) > 0 || (deleteTarget.teachersCount || 0) > 0 || (deleteTarget.semestersCount || 0) > 0) && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Associated Campus Records Detected</span>
                </div>
                <ul className="list-disc list-inside text-amber-800 space-y-1 text-[11px]">
                  <li><strong>{deleteTarget.studentsCount || 0}</strong> students currently enrolled in this branch.</li>
                  <li><strong>{deleteTarget.teachersCount || 0}</strong> faculty members assigned to this branch.</li>
                  <li><strong>{deleteTarget.semestersCount || 0}</strong> active semester cycles configured.</li>
                </ul>

                <label className="flex items-center gap-2 pt-2 border-t border-amber-200/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    Force delete branch & clean up its semester cycles
                  </span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setForceDelete(false);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isProcessing || (((deleteTarget.studentsCount || 0) > 0 || (deleteTarget.teachersCount || 0) > 0) && !forceDelete)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Branch Permanently</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
