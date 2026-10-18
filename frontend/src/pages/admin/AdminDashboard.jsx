import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  CheckCircle, 
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
  RefreshCw
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
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
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

  // Load students table
  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        year,
        section,
        firstGraduate,
        pms,
        status,
        sortBy,
        sortOrder
      };
      const res = await api.getStudents(params);
      if (res.success) {
        setStudents(res.students);
        setPagination(res.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchStudents(pagination.page);
  }, [search, year, section, firstGraduate, pms, status, sortBy, sortOrder]);

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

  const handleExportExcel = () => {
    const url = api.getExcelExportUrl({ year, section, status });
    window.open(url, '_blank');
  };

  const handleExportPdf = () => {
    const url = api.getPdfExportUrl({ year, section, status });
    window.open(url, '_blank');
  };

  const clearFilters = () => {
    setSearch('');
    setYear('');
    setSection('');
    setFirstGraduate('');
    setPms('');
    setStatus('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gov-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-gov-navy tracking-tight">
            Department Administration Dashboard
          </h1>
          <p className="text-xs text-gov-subtle">
            Department of Artificial Intelligence & Data Science &bull; Master Register & Beneficiaries Monitor
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center px-3 py-1.5 bg-gov-navy text-white text-xs font-semibold rounded hover:bg-gov-navy-dark shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add Student</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-gray-800 text-xs font-semibold rounded hover:bg-gray-50 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-gov-navy" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-green-800 text-xs font-semibold rounded hover:bg-green-50 shadow-sm"
            title="Download Excel register"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-green-700" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 text-red-800 text-xs font-semibold rounded hover:bg-red-50 shadow-sm"
            title="Download official PDF report"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-red-700" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Top Summary Cards (6 standard metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Students */}
        <div className="bg-white border border-gov-border rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-gov-navy" />
          </div>
          <div className="text-xl font-bold text-gray-900">{stats.totalStudents}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Across all 4 years</div>
        </div>

        {/* Submitted */}
        <div className="bg-white border border-gov-border rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Submitted</span>
            <CheckCircle className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-xl font-bold text-blue-900">{stats.submitted}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Awaiting verification</div>
        </div>

        {/* Pending / Draft */}
        <div className="bg-white border border-gov-border rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Draft</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-800">{stats.pending}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Incomplete profile</div>
        </div>

        {/* First Graduates */}
        <div className="bg-white border border-gov-border rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">First Graduate</span>
            <GraduationCap className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="text-xl font-bold text-indigo-900">{stats.firstGraduates}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">TN Govt Concession</div>
        </div>

        {/* PMS Beneficiaries */}
        <div className="bg-white border border-gov-border rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">PMS Beneficiary</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-bold text-emerald-900">{stats.pmsBeneficiaries}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Post Matric Scheme</div>
        </div>

        {/* Locked Records */}
        <div className="bg-white border border-gov-border rounded p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Locked Records</span>
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.lockedRecords}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Verified & Sealed</div>
        </div>

      </div>

      {/* Search & Filters Section */}
      <div className="bg-white border border-gov-border rounded p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="text-xs font-bold text-gov-navy uppercase tracking-wide flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter Student Register
          </span>
          {(search || year || section || firstGraduate !== '' || pms !== '' || status) && (
            <button
              onClick={clearFilters}
              className="text-[11px] text-gov-navy hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Reg No, Name, or Mobile..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gov-navy"
            />
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gov-navy"
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gov-navy"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* First Graduate Filter */}
          <div>
            <select
              value={firstGraduate}
              onChange={(e) => setFirstGraduate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gov-navy"
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
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-gov-navy"
            >
              <option value="">PMS: All</option>
              <option value="1">PMS: Yes</option>
              <option value="0">PMS: No</option>
            </select>
          </div>
        </div>

        {/* Status Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] text-gray-500 font-semibold mr-1">Status:</span>
          {['', 'DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                status === st
                  ? 'bg-gov-navy text-white border-gov-navy font-semibold'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {st || 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Student Data Table */}
      <div className="bg-white border border-gov-border rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F5F7FA] border-b border-gov-border text-gray-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">S.No</th>
                <th 
                  onClick={() => handleSort('register_no')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Reg. No.</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Student Name</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Year / Sec</th>
                <th className="py-2.5 px-3">Student Mobile</th>
                <th className="py-2.5 px-3">First Grad</th>
                <th className="py-2.5 px-3">PMS</th>
                <th 
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <tr
                    key={student.id}
                    onClick={() => handleRowClick(student.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 text-gray-500">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-gov-navy">
                      {student.register_no}
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-900">
                      {student.name}
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      Year {student.year} - {student.section}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {student.mobile || '-'}
                    </td>
                    <td className="py-2 px-3">
                      {student.is_first_graduate ? (
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          YES
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">NO</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      {student.is_pms ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          YES
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">NO</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <StatusBadge status={student.status} isLocked={student.is_locked} />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(student.id);
                        }}
                        className="p-1 text-gov-navy hover:bg-gray-100 rounded"
                        title="View Full Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="bg-[#F5F7FA] border-t border-gov-border px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2">
          <div>
            Showing <strong>{students.length}</strong> of <strong>{pagination.total}</strong> students
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchStudents(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="inline-flex items-center px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
            </button>
            <span className="text-xs">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages || 1}</strong>
            </span>
            <button
              onClick={() => fetchStudents(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="inline-flex items-center px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
          fetchStats();
          fetchStudents(pagination.page);
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
          fetchStats();
          fetchStudents(pagination.page);
        }}
      />

      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => {
          fetchStats();
          fetchStudents(pagination.page);
        }}
      />

    </div>
  );
};
