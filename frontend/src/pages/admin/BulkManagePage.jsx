import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  ListChecks, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Users, 
  ChevronRight,
  Info,
  CheckSquare,
  Square
} from 'lucide-react';

export const BulkManagePage = () => {
  // Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [firstGraduate, setFirstGraduate] = useState('');
  const [pms, setPms] = useState('');
  const [status, setStatus] = useState('');
  const [lockState, setLockState] = useState('');

  // Preview data state
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState({
    count: 0,
    lockedCount: 0,
    sample: []
  });
  const [error, setError] = useState('');

  // Selection mode:
  // 'all_matching' = apply to all records matching current filter
  // 'custom' = apply to specific selected IDs
  const [selectionMode, setSelectionMode] = useState('all_matching'); // 'all_matching' | 'custom'
  const [selectedIds, setSelectedIds] = useState([]);

  // Action modals
  const [activeModal, setActiveModal] = useState(null); // 'lock' | 'unlock' | 'delete' | 'result' | null
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  // Lock body scroll while any modal is active (prevents background scroll and blur misalignment)
  useEffect(() => {
    if (!activeModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [activeModal]);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Construct current filters object
  const getCurrentFilters = () => {
    const filters = {};
    if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
    if (year) filters.year = year;
    if (semester) filters.semester = semester;
    if (section) filters.section = section;
    if (firstGraduate !== '') filters.firstGraduate = firstGraduate;
    if (pms !== '') filters.pms = pms;
    if (status) filters.status = status;
    if (lockState) filters.lockState = lockState;
    return filters;
  };

  const hasActiveFilters = () => {
    return Boolean(
      debouncedSearch.trim() ||
      year ||
      semester ||
      section ||
      firstGraduate !== '' ||
      pms !== '' ||
      status ||
      lockState
    );
  };

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setYear('');
    setSemester('');
    setSection('');
    setFirstGraduate('');
    setPms('');
    setStatus('');
    setLockState('');
    setSelectedIds([]);
    setSelectionMode('all_matching');
  };

  // Fetch preview matching current filters
  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError('');
      const filters = getCurrentFilters();
      const res = await api.previewBulkStudents(filters);
      if (res?.success) {
        setPreviewData({
          count: res.count || 0,
          lockedCount: res.lockedCount || 0,
          sample: res.sample || []
        });

        // If previously selected IDs are no longer in sample and in custom mode, sync them
        if (selectionMode === 'all_matching') {
          // Pre-select all visible sample IDs as well
          setSelectedIds((res.sample || []).map((s) => s.id));
        }
      } else {
        setError(res?.message || 'Failed to preview cohort.');
      }
    } catch (err) {
      console.error('[Bulk Preview Error]:', err);
      setError(err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh preview whenever any filter changes
  useEffect(() => {
    fetchPreview();
  }, [debouncedSearch, year, semester, section, firstGraduate, pms, status, lockState]);

  // Handle individual sample row checkbox toggle
  const toggleSelectRow = (id) => {
    if (selectionMode === 'all_matching') {
      // Transitioning to custom selection
      setSelectionMode('custom');
      setSelectedIds(
        previewData.sample.map((s) => s.id).filter((item) => item !== id)
      );
      return;
    }

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle select all visible sample rows
  const toggleSelectAllVisible = () => {
    if (selectionMode === 'all_matching') {
      // Deselect all
      setSelectionMode('custom');
      setSelectedIds([]);
    } else {
      // If some or all custom, switch back to all matching across entire dataset
      setSelectionMode('all_matching');
      setSelectedIds(previewData.sample.map((s) => s.id));
    }
  };

  // Effective count of students targeted
  const getTargetCount = () => {
    if (selectionMode === 'all_matching') {
      return previewData.count;
    }
    return selectedIds.length;
  };

  // Effective locked count among targeted
  const getTargetLockedCount = () => {
    if (selectionMode === 'all_matching') {
      return previewData.lockedCount;
    }
    // Count locked inside selectedIds based on sample
    return previewData.sample.filter((s) => selectedIds.includes(s.id) && s.is_locked).length;
  };

  // Open action confirmation modals
  const handleOpenLockModal = () => {
    setActiveModal('lock');
  };

  const handleOpenUnlockModal = () => {
    setActiveModal('unlock');
  };

  const handleOpenDeleteModal = () => {
    setDeleteConfirmInput('');
    setActiveModal('delete');
  };

  // Execute Bulk Lock or Unlock
  const executeBulkLock = async (shouldLock) => {
    try {
      setActionLoading(true);
      setError('');
      const payload = {
        lock: shouldLock,
        allowAll: !hasActiveFilters()
      };

      if (selectionMode === 'custom') {
        payload.ids = selectedIds;
      } else {
        payload.filters = getCurrentFilters();
      }

      const res = await api.bulkLockStudents(payload);
      if (res?.success) {
        setActionResult({
          type: shouldLock ? 'LOCK' : 'UNLOCK',
          title: `Bulk ${shouldLock ? 'Lock' : 'Unlock'} Succeeded`,
          message: res.message,
          affected: res.affected || 0,
          skipped: res.skipped || 0,
          failed: res.failed || 0
        });
        setActiveModal('result');
        fetchPreview();
      } else {
        setError(res?.message || 'Bulk lock operation failed.');
        setActiveModal(null);
      }
    } catch (err) {
      console.error('[executeBulkLock Error]:', err);
      setError(err.message || 'Failed to execute bulk lock operation.');
      setActiveModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Bulk Delete
  const executeBulkDelete = async () => {
    if (deleteConfirmInput.trim() !== 'DELETE') return;

    try {
      setActionLoading(true);
      setError('');
      const payload = {
        confirmText: 'DELETE',
        allowAll: !hasActiveFilters()
      };

      if (selectionMode === 'custom') {
        payload.ids = selectedIds;
      } else {
        payload.filters = getCurrentFilters();
      }

      const res = await api.bulkDeleteStudents(payload);
      if (res?.success) {
        setActionResult({
          type: 'DELETE',
          title: 'Bulk Deletion Completed',
          message: res.message,
          affected: res.affected || 0,
          skipped: res.skipped || 0,
          failed: res.failed || 0
        });
        setActiveModal('result');
        setSelectedIds([]);
        fetchPreview();
      } else {
        setError(res?.message || 'Bulk delete operation failed.');
        setActiveModal(null);
      }
    } catch (err) {
      console.error('[executeBulkDelete Error]:', err);
      setError(err.message || 'Failed to execute bulk delete operation.');
      setActiveModal(null);
    } finally {
      setActionLoading(false);
    }
  };

  const targetCount = getTargetCount();
  const targetLockedCount = getTargetLockedCount();
  const hasTargets = targetCount > 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 text-on-surface">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/30 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-primary text-white shadow-2xs">
              Batch Administration
            </span>
            <span className="text-caption text-outline font-medium">Cohort Batch Operations</span>
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">Bulk Student Manager</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Filter targeted student cohorts to execute multi-record Lock, Unlock, or Permanent Deletion in a single safe operation.
          </p>
        </div>

        {/* Refresh & Preview Trigger Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPreview}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-surface-container border border-outline-variant/60 text-primary text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-secondary' : 'text-primary'}`} />
            <span>{loading ? 'Scanning...' : 'Refresh Preview'}</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Panel (Consistent with AdminDashboard) */}
      <div className="glass-card-l1 rounded-2xl p-4 sm:p-5 border border-white/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2.5">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-secondary" /> Define Target Cohort Filter
          </span>
          {hasActiveFilters() && (
            <button
              onClick={resetFilters}
              className="text-xs text-secondary hover:text-primary font-semibold transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
          {/* Search box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-outline absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Reg No, Name, or Mobile..."
              className="w-full pl-9 pr-3 py-2 bg-white/80 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            />
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all font-medium"
            >
              <option value="">All Academic Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all font-medium"
            >
              <option value="">All Semesters (1-8)</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all font-medium"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>

          {/* First Graduate Filter */}
          <div>
            <select
              value={firstGraduate}
              onChange={(e) => setFirstGraduate(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            >
              <option value="">First Grad: All</option>
              <option value="1">First Grad: Yes</option>
              <option value="0">First Grad: No</option>
            </select>
          </div>

          {/* PMS Scheme Filter */}
          <div>
            <select
              value={pms}
              onChange={(e) => setPms(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            >
              <option value="">PMS: All</option>
              <option value="1">PMS: Yes</option>
              <option value="0">PMS: No</option>
            </select>
          </div>

          {/* Lock State Filter */}
          <div>
            <select
              value={lockState}
              onChange={(e) => setLockState(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-outline-variant/60 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all font-semibold"
            >
              <option value="">Lock State: All</option>
              <option value="locked">🔒 Locked Only</option>
              <option value="unlocked">🔓 Unlocked Only</option>
            </select>
          </div>
        </div>

        {/* Status Filter Segmented Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] text-outline font-semibold mr-1">Status:</span>
          {['', 'DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-3 py-1 text-[11px] rounded-full border transition-all ${
                status === st
                  ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                  : 'bg-white/80 text-on-surface-variant border-outline-variant/40 hover:bg-white hover:text-on-surface'
              }`}
            >
              {st || 'All Cohort Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Target Cohort Overview & Bulk Action Strip */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-outline-variant/40 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Metric Summary */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary tracking-tight">
                  {selectionMode === 'all_matching' ? previewData.count : selectedIds.length}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {selectionMode === 'all_matching' 
                    ? `total matched ${hasActiveFilters() ? 'cohort records' : '(entire directory)'}`
                    : `of ${previewData.count} matched students selected`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-outline font-medium">
                <span>Locked: <strong className="text-slate-800">{previewData.lockedCount}</strong></span>
                <span>&bull;</span>
                <span>Unlocked: <strong className="text-slate-800">{Math.max(0, previewData.count - previewData.lockedCount)}</strong></span>
              </div>
            </div>
          </div>

          {/* Select all across entire dataset pill */}
          {previewData.count > 0 && (
            <button
              onClick={toggleSelectAllVisible}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                selectionMode === 'all_matching'
                  ? 'bg-primary/10 border-primary/30 text-primary font-bold'
                  : 'bg-surface-container border-outline-variant/40 text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {selectionMode === 'all_matching' ? (
                <CheckSquare className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Square className="w-3.5 h-3.5 text-outline" />
              )}
              <span>
                {selectionMode === 'all_matching'
                  ? `Selected All ${previewData.count} Matching Students`
                  : `Select All ${previewData.count} Matches`}
              </span>
            </button>
          )}
        </div>

        {/* 3 Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bulk Lock Button */}
          <button
            onClick={handleOpenLockModal}
            disabled={!hasTargets || actionLoading}
            className="inline-flex items-center px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Lock editing on selected students"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" />
            <span>Lock Selected ({targetCount})</span>
          </button>

          {/* Bulk Unlock Button */}
          <button
            onClick={handleOpenUnlockModal}
            disabled={!hasTargets || actionLoading}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Unlock editing on selected students"
          >
            <Unlock className="w-3.5 h-3.5 mr-1.5" />
            <span>Unlock Selected ({targetCount})</span>
          </button>

          {/* Bulk Delete Button */}
          <button
            onClick={handleOpenDeleteModal}
            disabled={!hasTargets || actionLoading}
            className="inline-flex items-center px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Permanently remove selected students & storage files"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Selected ({targetCount})</span>
          </button>
        </div>
      </div>

      {/* Preview Sample Table Card */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-xs overflow-hidden">
        
        <div className="px-5 py-3.5 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Cohort Match Sample ({previewData.sample.length} of {previewData.count} shown)
            </span>
          </div>

          <div className="text-[11px] text-outline font-medium">
            {previewData.count > 10 ? (
              <span>Actions will apply across all <strong>{targetCount}</strong> records matching criteria</span>
            ) : (
              <span>All matching records displayed below</span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center text-xs text-outline flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <p className="font-semibold text-primary">Filtering and evaluating student records...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && previewData.count === 0 && (
          <div className="p-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center space-y-2">
            <Users className="w-8 h-8 text-outline" />
            <p className="font-bold text-sm text-primary">No students match this filter</p>
            <p className="text-xs text-outline max-w-sm">
              Adjust your search keywords, year, semester, or status criteria above to inspect and manage a group.
            </p>
          </div>
        )}

        {/* Data Table */}
        {!loading && previewData.count > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-outline text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectionMode === 'all_matching' ||
                        (previewData.sample.length > 0 &&
                          previewData.sample.every((s) => selectedIds.includes(s.id)))
                      }
                      onChange={toggleSelectAllVisible}
                      className="rounded text-primary focus:ring-primary h-4 w-4 border-outline-variant cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Year &amp; Semester</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Lock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {previewData.sample.map((student) => {
                  const isChecked =
                    selectionMode === 'all_matching' || selectedIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => toggleSelectRow(student.id)}
                      className={`hover:bg-primary-fixed/20 transition-colors cursor-pointer ${
                        isChecked ? 'bg-primary-fixed/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(student.id)}
                          className="rounded text-primary focus:ring-primary h-4 w-4 border-outline-variant cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {student.register_no}
                      </td>
                      <td className="py-3 px-4 font-semibold text-on-surface">
                        {student.name}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant font-medium">
                        {student.year ? `${student.year} Year` : 'Year Not Set'}
                        {student.current_semester ? ` (Sem ${student.current_semester})` : ''}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant font-medium">
                        {student.section ? `Sec ${student.section}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={student.status} isLocked={false} />
                      </td>
                      <td className="py-3 px-4">
                        {student.is_locked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 border border-amber-400/30">
                            <Lock className="w-2.5 h-2.5 text-amber-600" />
                            <span>LOCKED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-800 border border-emerald-400/30">
                            <Unlock className="w-2.5 h-2.5 text-emerald-600" />
                            <span>UNLOCKED</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Note */}
        {!loading && previewData.count > 10 && (
          <div className="p-3 bg-surface-container-low/40 border-t border-outline-variant/30 text-center text-[11px] text-outline font-medium flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-secondary" />
            <span>
              Preview shows first 10 students. The selected bulk action will securely execute on <strong>all {targetCount}</strong> matching students.
            </span>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: BULK LOCK CONFIRMATION */}
      {/* ============================================================ */}
      {activeModal === 'lock' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto apple-modal-backdrop flex min-h-full items-center justify-center p-3 sm:p-6 animate-fade-in">
          {/* Click-away backdrop overlay */}
          <div className="fixed inset-0 bg-transparent" onClick={() => !actionLoading && setActiveModal(null)} aria-hidden="true" />
          
          <div className="relative z-10 apple-modal-card rounded-2xl max-w-md w-full p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">Confirm Bulk Lock</h3>
                <p className="text-xs text-on-surface-variant">Lock editing privileges on student profiles</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs text-amber-900 space-y-1.5">
              <p>
                You are about to <strong>LOCK {targetCount} student record(s)</strong>.
              </p>
              <p className="text-[11px] text-amber-800">
                While locked, students cannot edit their profile, personal details, or re-upload documents.
              </p>
              {targetLockedCount > 0 && (
                <p className="text-[11px] text-amber-700 font-semibold pt-1">
                  Note: {targetLockedCount} of these students are already locked and will be skipped automatically.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeBulkLock(true)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{actionLoading ? 'Locking...' : `Confirm Lock (${targetCount})`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* MODAL 2: BULK UNLOCK CONFIRMATION */}
      {/* ============================================================ */}
      {activeModal === 'unlock' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto apple-modal-backdrop flex min-h-full items-center justify-center p-3 sm:p-6 animate-fade-in">
          {/* Click-away backdrop overlay */}
          <div className="fixed inset-0 bg-transparent" onClick={() => !actionLoading && setActiveModal(null)} aria-hidden="true" />
          
          <div className="relative z-10 apple-modal-card rounded-2xl max-w-md w-full p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">Confirm Bulk Unlock</h3>
                <p className="text-xs text-on-surface-variant">Restore profile editing privileges</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 space-y-1.5">
              <p>
                You are about to <strong>UNLOCK {targetCount} student record(s)</strong>.
              </p>
              <p className="text-[11px] text-emerald-800">
                Students will regain access to update their submissions, phone numbers, and documents.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeBulkLock(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{actionLoading ? 'Unlocking...' : `Confirm Unlock (${targetCount})`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* MODAL 3: BULK DELETE CONFIRMATION (With DELETE typing guard) */}
      {/* ============================================================ */}
      {activeModal === 'delete' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto apple-modal-backdrop flex min-h-full items-center justify-center p-3 sm:p-6 animate-fade-in">
          {/* Click-away backdrop overlay */}
          <div className="fixed inset-0 bg-transparent" onClick={() => !actionLoading && setActiveModal(null)} aria-hidden="true" />
          
          <div className="relative z-10 apple-modal-card rounded-2xl max-w-lg w-full p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-800">Dangerous Action: Permanent Bulk Delete</h3>
                <p className="text-xs text-on-surface-variant">Permanent removal of student records and cloud storage documents</p>
              </div>
            </div>

            {/* Severe Warning Notice */}
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                This action is IRREVERSIBLE and cannot be undone.
              </p>
              <p className="text-[11px] leading-relaxed text-rose-800">
                You are about to permanently delete <strong>{targetCount} student account(s)</strong>. All associated records, Aadhaar details, bank accounts, and <strong>all uploaded documents &amp; photos will be purged from cloud storage</strong>.
              </p>
              
              {/* Locked Student Warning Edge Case */}
              {targetLockedCount > 0 && (
                <div className="p-2.5 bg-amber-100/80 rounded-lg border border-amber-300 text-amber-950 font-medium text-[11px] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Warning: <strong>{targetLockedCount} of the {targetCount} selected students are currently LOCKED</strong>. Bulk deletion will forcibly remove them.
                  </span>
                </div>
              )}
            </div>

            {/* Type DELETE confirmation guard */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-primary block">
                To confirm permanent deletion, type <code className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-mono font-black">DELETE</code> in the box below:
              </label>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3.5 py-2.5 border-2 border-rose-200 focus:border-rose-500 rounded-xl text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeBulkDelete}
                disabled={deleteConfirmInput.trim() !== 'DELETE' || actionLoading}
                className="px-5 py-2 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{actionLoading ? 'Purging Records...' : `Permanently Delete (${targetCount})`}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ACTION RESULT FEEDBACK BANNER */}
      {/* ============================================================ */}
      {activeModal === 'result' && actionResult && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto apple-modal-backdrop flex min-h-full items-center justify-center p-3 sm:p-6 animate-fade-in">
          {/* Click-away backdrop overlay */}
          <div className="fixed inset-0 bg-transparent" onClick={() => { setActiveModal(null); setActionResult(null); }} aria-hidden="true" />
          
          <div className="relative z-10 apple-modal-card rounded-2xl max-w-md w-full p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">{actionResult.title}</h3>
                <p className="text-xs text-on-surface-variant">Audit ledger entry recorded successfully</p>
              </div>
            </div>

            <div className="p-3.5 bg-surface-container/60 rounded-xl border border-outline-variant/30 text-xs space-y-2">
              <p className="text-on-surface font-semibold">{actionResult.message}</p>
              
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white p-2 rounded-lg border border-outline-variant/30">
                  <div className="text-xs text-outline font-medium">Affected</div>
                  <div className="text-base font-black text-emerald-700">{actionResult.affected}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-outline-variant/30">
                  <div className="text-xs text-outline font-medium">Skipped</div>
                  <div className="text-base font-black text-amber-700">{actionResult.skipped}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-outline-variant/30">
                  <div className="text-xs text-outline font-medium">Failed</div>
                  <div className="text-base font-black text-rose-700">{actionResult.failed}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setActionResult(null);
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-container shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default BulkManagePage;
