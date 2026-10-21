import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  CheckCircle, 
  CheckCheck,
  Clock, 
  Award, 
  GraduationCap, 
  Lock, 
  Search, 
  Filter, 
  UserPlus, 
  Upload, 
  FileSpreadsheet, 
  FileDown, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  RefreshCw,
  Trash2,
  Sparkles
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { StudentDetailModal } from '../../components/StudentDetailModal';
import { AddStudentModal } from '../../components/AddStudentModal';
import { BulkImportModal } from '../../components/BulkImportModal';

export const AdminDashboard = ({ onOpenMultiStepEdit }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    submitted: 0,
    pending: 0,
    verified: 0,
    firstGraduates: 0,
    pmsBeneficiaries: 0,
    lockedRecords: 0
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [firstGraduate, setFirstGraduate] = useState('');
  const [pms, setPms] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('register_no');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modals
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Load summary statistics
  const fetchStats = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle page change without automatic scroll up (preserves user scroll position)
  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    const currentScrollY = window.scrollY;
    setCurrentPage(newPage);
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    });
  };

  // Reset page to 1 when any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, year, semester, section, firstGraduate, pms, status]);

  // Load students table
  useEffect(() => {
    let isCurrent = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: 10,
          search: debouncedSearch,
          year,
          semester,
          section,
          firstGraduate,
          pms,
          status,
          sortBy,
          sortOrder
        };
        const res = await api.getStudents(params);
        if (isCurrent && res.success) {
          setStudents(res.students);
          setPagination(res.pagination);
        }
      } catch (e) {
        if (isCurrent) console.error(e);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [currentPage, debouncedSearch, year, semester, section, firstGraduate, pms, status, sortBy, sortOrder, refreshTrigger]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const handleRowClick = (id) => {
    setSelectedStudentId(id);
    setIsDetailOpen(true);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      await api.downloadExcel({ year, semester, section, status });
    } catch (err) {
      alert(`Excel export failed: ${err.message || 'Unable to download file.'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExporting(true);
      await api.downloadPdf({ year, semester, section, status });
    } catch (err) {
      alert(`PDF export failed: ${err.message || 'Unable to download file.'}`);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setYear('');
    setSemester('');
    setSection('');
    setFirstGraduate('');
    setPms('');
    setStatus('');
  };

  const handleDeleteStudent = async (student) => {
    const confirmMsg = `Are you sure you want to PERMANENTLY delete student ${student.name} (${student.register_no})?\n\nThis will remove their profile and all uploaded certificates from Cloudflare R2. This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteStudent(student.id);
      alert(res.message || 'Student deleted successfully.');
      if (search) {
        setSearch('');
      } else if (students.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete student.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7">
      
      {/* Top Page Header (Cupertino Command Bar) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-primary tracking-tight">
              Academic Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Database
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Department of Artificial Intelligence & Data Science &bull; Cohort Oversight & Statutory Compliance
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-surface-container border border-outline-variant/50 text-primary text-xs font-semibold rounded-xl shadow-2xs transition-all active:scale-[0.98]"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-secondary" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-emerald-50/50 border border-emerald-500/30 text-emerald-800 text-xs font-semibold rounded-xl shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
            title="Download Excel register"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-rose-50/50 border border-rose-500/30 text-rose-800 text-xs font-semibold rounded-xl shadow-2xs transition-all active:scale-[0.98] disabled:opacity-50"
            title="Download official PDF report"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
            <span>{exporting ? 'Exporting...' : 'Official PDF'}</span>
          </button>
        </div>
      </div>

      {/* Top Bento Metric Cards (Apple macOS Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        
        {/* Total Students */}
        <div className="glass-card-l2 rounded-2xl p-4 border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Cohort</span>
            <div className="w-7 h-7 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-primary tracking-tight">{stats.totalStudents}</div>
          <div className="text-[10px] text-outline mt-1 font-medium">All 4 Years</div>
        </div>

        {/* Submitted */}
        <div className="glass-card-l2 rounded-2xl p-4 border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Submitted</span>
            <div className="w-7 h-7 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-secondary">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-secondary tracking-tight">{stats.submitted}</div>
          <div className="text-[10px] text-outline mt-1 font-medium">Awaiting Audit</div>
        </div>

        {/* Verified */}
        <div className="glass-card-l2 rounded-2xl p-4 border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">{stats.verified || 0}</div>
          <div className="text-[10px] text-emerald-700/80 mt-1 font-medium">Approved & Sealed</div>
        </div>

        {/* Pending Draft */}
        <div className="glass-card-l2 rounded-2xl p-4 border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Drafts</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 tracking-tight">{stats.pending}</div>
          <div className="text-[10px] text-amber-700/80 mt-1 font-medium">Incomplete</div>
        </div>

        {/* First Graduates */}
        <div className="glass-card-l2 rounded-2xl p-4 border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">First Grad</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-700 tracking-tight">{stats.firstGraduates}</div>
          <div className="text-[10px] text-indigo-700/80 mt-1 font-medium">TN Concession</div>
        </div>

        {/* PMS Beneficiaries */}
        <div className="glass-card-l2 rounded-2xl p-4 border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">PMS Scheme</span>
            <div className="w-7 h-7 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-700 tracking-tight">{stats.pmsBeneficiaries}</div>
          <div className="text-[10px] text-teal-700/80 mt-1 font-medium">Post Matric</div>
        </div>

        {/* Locked Records */}
        <div className="glass-card-l2 rounded-2xl p-4 border border-white/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Locked</span>
            <div className="w-7 h-7 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 tracking-tight">{stats.lockedRecords}</div>
          <div className="text-[10px] text-slate-600 mt-1 font-medium">Read-Only</div>
        </div>

      </div>

      {/* Search & Filters Section (Cupertino Frosted Strip) */}
      <div className="glass-card-l1 rounded-2xl p-4 sm:p-5 border border-white/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2.5">
          <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-secondary" /> Filter Cohort Register
          </span>
          {(search || year || semester || section || firstGraduate !== '' || pms !== '' || status) && (
            <button
              onClick={clearFilters}
              className="text-xs text-secondary hover:text-primary font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
          {/* Search box */}
          <div className="sm:col-span-2 lg:col-span-2 relative">
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

          {/* Semester Filter (1 to 8) */}
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
              <option value="">First Graduate: All</option>
              <option value="1">First Graduate: Yes</option>
              <option value="0">First Graduate: No</option>
            </select>
          </div>

          {/* PMS Filter */}
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

      {/* Main Student Data Container (Cupertino Frosted Table) */}
      <div className="glass-card-l2 rounded-2xl border border-white/80 shadow-sm overflow-hidden">
        
        {/* Mobile Stacked Card View */}
        <div className={`md:hidden divide-y divide-outline-variant/20 min-h-[300px] transition-opacity duration-200 ${loading && students.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
          {loading && students.length === 0 ? (
            <div className="py-16 text-center text-outline text-xs">
              Loading student dossier records...
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 px-4 text-center text-outline text-xs">
              <p className="font-medium">No student records found matching current criteria.</p>
              {(search || year || semester || section || status || firstGraduate || pms) && (
                <button
                  onClick={clearFilters}
                  className="mt-2.5 inline-flex items-center text-xs text-secondary font-semibold hover:underline"
                >
                  Reset / Show All Students
                </button>
              )}
            </div>
          ) : (
            students.map((student, idx) => (
              <div
                key={student.id}
                onClick={() => handleRowClick(student.id)}
                className="p-4 hover:bg-white/50 transition-colors space-y-2.5 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-primary flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-outline">#{(pagination.page - 1) * pagination.limit + idx + 1}</span>
                      <span>{student.name}</span>
                    </div>
                    <div className="font-mono text-xs text-secondary font-semibold">
                      {student.register_no}
                    </div>
                  </div>
                  <StatusBadge status={student.status} isLocked={Boolean(student.is_locked)} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant bg-surface-container/50 p-2.5 rounded-xl border border-outline-variant/30">
                  <div>
                    <span className="text-[10px] text-outline block uppercase font-medium">Cohort & Sem</span>
                    <span className="font-semibold text-on-surface">
                      {student.year ? `Year ${student.year}` : '-'}{student.section ? ` (${student.section})` : ''}
                      {student.current_semester ? ` • Sem ${student.current_semester}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block uppercase font-medium">Contact</span>
                    <span className="font-semibold text-on-surface">{student.mobile || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-outline uppercase font-medium">First Grad:</span>
                    {student.is_first_graduate ? (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">YES</span>
                    ) : (
                      <span className="text-[10px] text-outline">NO</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-outline uppercase font-medium">PMS:</span>
                    {student.is_pms ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">YES</span>
                    ) : (
                      <span className="text-[10px] text-outline">NO</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-outline-variant/20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(student.id);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-primary bg-white hover:bg-surface-container rounded-lg border border-outline-variant/50 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Dossier
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStudent(student);
                    }}
                    className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto min-h-[480px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-container/60 border-b border-outline-variant/30 text-primary font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th 
                  onClick={() => handleSort('register_no')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Register No</span>
                    <ArrowUpDown className="w-3 h-3 text-outline" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-outline" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('current_semester')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Cohort & Sem</span>
                    <ArrowUpDown className="w-3 h-3 text-outline" />
                  </div>
                </th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">First Grad</th>
                <th className="py-3 px-4">PMS</th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-outline" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-outline-variant/20 transition-opacity duration-200 ${loading && students.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-outline">
                    Loading student cohort records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-outline">
                    <p className="font-medium">No student records matching current filters.</p>
                    {(search || year || semester || section || status || firstGraduate || pms) && (
                      <button
                        onClick={clearFilters}
                        className="mt-2.5 inline-flex items-center text-xs text-secondary font-semibold hover:underline"
                      >
                        Reset / Show All Students
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr
                    key={student.id}
                    onClick={() => handleRowClick(student.id)}
                    className="hover:bg-white/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-outline font-mono">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {student.register_no}
                    </td>
                    <td className="py-3 px-4 font-semibold text-on-surface">
                      {student.name}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant">
                      <div className="font-semibold text-on-surface">
                        {student.year ? `Year ${student.year}` : '-'}{student.section ? ` - ${student.section}` : ''}
                      </div>
                      {student.current_semester ? (
                        <div className="text-[11px] text-outline font-medium">Sem {student.current_semester}</div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-on-surface-variant font-mono">
                      {student.mobile || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {student.is_first_graduate ? (
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          YES
                        </span>
                      ) : (
                        <span className="text-[11px] text-outline">NO</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {student.is_pms ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          YES
                        </span>
                      ) : (
                        <span className="text-[11px] text-outline">NO</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={student.status} isLocked={student.is_locked} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(student.id);
                        }}
                        className="p-1.5 text-primary hover:bg-surface-container rounded-lg inline-flex items-center justify-center transition-colors shadow-2xs"
                        title="View Full Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStudent(student);
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg inline-flex items-center justify-center transition-colors"
                        title="Permanently Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="bg-surface-container/50 border-t border-outline-variant/30 px-5 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-3">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-primary">{students.length}</strong> of <strong className="text-primary">{pagination.total}</strong> scholars
            </span>
            {loading && students.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-secondary font-medium px-2 py-0.5 rounded-full bg-secondary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Loading page...
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(Math.max(1, currentPage - 1));
              }}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center px-3 py-1.5 border border-outline-variant/50 rounded-xl bg-white text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all shadow-2xs font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </button>
            <span className="text-xs px-2 font-medium">
              Page <strong className="text-primary">{pagination.page || currentPage}</strong> of <strong className="text-primary">{pagination.totalPages || 1}</strong>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(Math.min(pagination.totalPages || 1, currentPage + 1));
              }}
              disabled={currentPage >= (pagination.totalPages || 1) || loading}
              className="inline-flex items-center px-3 py-1.5 border border-outline-variant/50 rounded-xl bg-white text-on-surface disabled:opacity-40 hover:bg-surface-container transition-all shadow-2xs font-semibold cursor-pointer disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StudentDetailModal
        studentId={selectedStudentId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onRefresh={() => {
          if (search) setSearch('');
          setRefreshTrigger((prev) => prev + 1);
        }}
        onEditStudent={(id) => {
          setIsDetailOpen(false);
          onOpenMultiStepEdit && onOpenMultiStepEdit(id);
        }}
      />

      <AddStudentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

    </div>
  );
};
