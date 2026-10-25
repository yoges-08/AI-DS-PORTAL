import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Mail,
  Users,
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';

export const WhitelistPage = ({ onNavigateTab }) => {
  const [whitelist, setWhitelist] = useState([]);
  const [stats, setStats] = useState({ total: 0, claimed: 0, unclaimed: 0, withEmail: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unclaimed', 'claimed'
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalEntry, setDeleteModalEntry] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchWhitelist = useCallback(async (page = 1, currentSearch = search, currentStatus = statusFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (currentSearch.trim()) params.search = currentSearch.trim();
      if (currentStatus !== 'all') params.status = currentStatus;

      const res = await api.getWhitelist(params);
      if (res.success) {
        setWhitelist(res.whitelist || []);
        setStats(res.stats || { total: 0, claimed: 0, unclaimed: 0, withEmail: 0 });
        setPagination(res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (err) {
      console.error('[WhitelistPage fetch error]:', err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to load whitelist entries.' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchWhitelist(1, search, statusFilter);
  }, [statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWhitelist(1, search, statusFilter);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDeleteConfirm = async () => {
    if (!deleteModalEntry) return;
    try {
      setDeletingId(deleteModalEntry.id);
      const res = await api.deleteWhitelistEntry(deleteModalEntry.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: res.message || 'Whitelist entry deleted successfully.' });
        setDeleteModalEntry(null);
        fetchWhitelist(pagination.page, search, statusFilter);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to delete whitelist entry.' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDisplayDob = (dobStr) => {
    if (!dobStr) return '—';
    try {
      const parts = dobStr.split('-');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
      return dobStr;
    } catch {
      return dobStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/30 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-primary-fixed text-primary">
              Pre-Registration Registry
            </span>
            <span className="text-caption text-outline font-medium">Department Eligibility Cohort</span>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-secondary" /> Imported Whitelist &amp; DOB Register
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            View, audit, and verify all student register numbers and dates of birth imported to grant self-registration eligibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('bulk-import')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import More</span>
            </button>
          )}

          <button
            onClick={() => fetchWhitelist(pagination.page, search, statusFilter)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/90 border border-outline-variant/40 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container shadow-xs transition-all active:scale-95"
            title="Refresh Whitelist"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-start justify-between gap-3 text-xs border ${
            actionMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card-l1 p-4 sm:p-5 rounded-2xl border border-white/60 shadow-xs bg-white/90">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Uploaded</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-primary">{stats.total}</div>
          <p className="text-[11px] text-outline mt-1 font-medium">Eligible register numbers</p>
        </div>

        <div className="glass-card-l1 p-4 sm:p-5 rounded-2xl border border-white/60 shadow-xs bg-white/90">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Claimed / Active</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.claimed}</div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Accounts self-registered</p>
        </div>

        <div className="glass-card-l1 p-4 sm:p-5 rounded-2xl border border-white/60 shadow-xs bg-white/90">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Claim</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.unclaimed}</div>
          <p className="text-[11px] text-amber-600 mt-1 font-medium">Awaiting student sign-up</p>
        </div>

        <div className="glass-card-l1 p-4 sm:p-5 rounded-2xl border border-white/60 shadow-xs bg-white/90">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pre-Bound Email</span>
            <div className="w-8 h-8 rounded-xl bg-secondary-fixed/50 flex items-center justify-center text-primary">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-primary">{stats.withEmail}</div>
          <p className="text-[11px] text-outline mt-1 font-medium">Locked to specific email</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card-l1 rounded-2xl p-4 border border-white/60 shadow-xs bg-white/95 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Register Number, Whitelist Email, or Student Name..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low/60 border border-outline-variant/30 rounded-xl text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-surface-container-low/80 p-1 rounded-xl border border-outline-variant/30 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('unclaimed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'unclaimed'
                ? 'bg-amber-100 text-amber-900 shadow-xs font-bold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Pending ({stats.unclaimed})
          </button>
          <button
            onClick={() => setStatusFilter('claimed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'claimed'
                ? 'bg-emerald-100 text-emerald-900 shadow-xs font-bold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Claimed ({stats.claimed})
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="glass-card-l1 rounded-3xl border border-white/60 shadow-lg backdrop-blur-xl bg-white/95 overflow-hidden">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 text-center space-y-2">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-xs text-outline font-medium">Fetching whitelist database...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && whitelist.length === 0 && (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-outline">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-primary">No Whitelist Records Found</h3>
            <p className="text-xs text-outline max-w-sm mx-auto">
              {search || statusFilter !== 'all'
                ? 'No imported student entries matched your search filter. Try clearing the search query or status filter.'
                : 'No cohort whitelist entries have been uploaded yet. Upload a 2-column spreadsheet in the Cohort Bulk Import tab to pre-register students.'}
            </p>
            {onNavigateTab && !search && statusFilter === 'all' && (
              <button
                onClick={() => onNavigateTab('bulk-import')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Go to Cohort Bulk Import</span>
              </button>
            )}
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && whitelist.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low/70 border-b border-outline-variant/30 text-outline uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Register Number</th>
                  <th className="py-3.5 px-4 font-bold">Date of Birth (DOB)</th>
                  <th className="py-3.5 px-4 font-bold">Pre-Bound Email</th>
                  <th className="py-3.5 px-4 font-bold">Claim / Registration Status</th>
                  <th className="py-3.5 px-4 font-bold">Imported On</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {whitelist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-surface-container-low/40 transition-colors">
                    
                    {/* Register Number */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/15 text-[12px]">
                          {entry.register_no}
                        </span>
                      </div>
                    </td>

                    {/* Date of Birth */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-on-surface">
                          <Calendar className="w-3.5 h-3.5 text-secondary" />
                          <span>{formatDisplayDob(entry.dob)}</span>
                        </div>
                        <span className="text-[10px] font-mono text-outline block pl-5">
                          Format: {entry.dob}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      {entry.email ? (
                        <div className="flex items-center gap-1.5 text-on-surface font-medium">
                          <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
                          <span className="truncate max-w-[200px]" title={entry.email}>
                            {entry.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-outline text-[11px] italic">
                          Any institutional email
                        </span>
                      )}
                    </td>

                    {/* Claim / Registered Status */}
                    <td className="py-3.5 px-4">
                      {entry.is_claimed ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            CLAIMED
                          </span>
                          {entry.student_name && (
                            <div className="text-[11px] text-on-surface-variant font-medium">
                              <span className="font-bold text-primary">{entry.student_name}</span>
                              {(entry.student_year || entry.student_section) && (
                                <span className="text-outline ml-1">
                                  ({entry.student_year ? `Yr ${entry.student_year}` : ''} {entry.student_section ? `Sec ${entry.student_section}` : ''})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            PENDING CLAIM
                          </span>
                          <span className="block text-[10px] text-outline">
                            Awaiting student registration
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Imported On */}
                    <td className="py-3.5 px-4 text-outline text-[11px] whitespace-nowrap">
                      {formatDateTime(entry.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {entry.is_claimed ? (
                        <span className="text-[11px] text-outline font-medium italic" title="Claimed accounts must be deleted from Student Register">
                          Active Account
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteModalEntry(entry)}
                          disabled={deletingId === entry.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold transition-all active:scale-95"
                          title="Delete unclaimed whitelist record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Card List View (<md) */}
        {!loading && whitelist.length > 0 && (
          <div className="md:hidden divide-y divide-outline-variant/20">
            {whitelist.map((entry) => (
              <div key={entry.id} className="p-4 space-y-3 hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/15 text-xs">
                    {entry.register_no}
                  </span>
                  {entry.is_claimed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      CLAIMED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      PENDING
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-outline block">Date of Birth (DOB)</span>
                    <span className="font-bold text-on-surface flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-secondary" />
                      {formatDisplayDob(entry.dob)}
                    </span>
                    <span className="text-[10px] font-mono text-outline">{entry.dob}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-outline block">Pre-Bound Email</span>
                    <span className="font-medium text-on-surface text-[11px] truncate block mt-0.5">
                      {entry.email || '— None (Any)'}
                    </span>
                  </div>
                </div>

                {entry.is_claimed && entry.student_name && (
                  <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs">
                    <span className="text-[10px] text-outline block">Registered Student</span>
                    <span className="font-bold text-primary">{entry.student_name}</span>
                    {(entry.student_year || entry.student_section) && (
                      <span className="text-outline text-[11px] ml-1">
                        (Year {entry.student_year}, Sec {entry.student_section})
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[11px]">
                  <span className="text-outline">
                    Imported: {formatDateTime(entry.created_at)}
                  </span>
                  {!entry.is_claimed && (
                    <button
                      onClick={() => setDeleteModalEntry(entry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && pagination.totalPages > 1 && (
          <div className="p-4 bg-surface-container-low/50 border-t border-outline-variant/30 flex items-center justify-between text-xs">
            <span className="text-outline">
              Page <span className="font-bold text-on-surface">{pagination.page}</span> of{' '}
              <span className="font-bold text-on-surface">{pagination.totalPages}</span>{' '}
              ({pagination.total} records)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchWhitelist(pagination.page - 1, search, statusFilter)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-white font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container flex items-center gap-1 shadow-xs transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <button
                onClick={() => fetchWhitelist(pagination.page + 1, search, statusFilter)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-white font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container flex items-center gap-1 shadow-xs transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setDeleteModalEntry(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">
                Delete Whitelist Entry?
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Are you sure you want to remove this pre-registered eligibility record? Once deleted, the student will no longer be eligible to self-register with this register number and DOB.
              </p>
            </div>

            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/30 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-outline">Register Number:</span>
                <span className="font-mono font-bold text-primary">{deleteModalEntry.register_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Date of Birth:</span>
                <span className="font-bold text-on-surface">{deleteModalEntry.dob} ({formatDisplayDob(deleteModalEntry.dob)})</span>
              </div>
              {deleteModalEntry.email && (
                <div className="flex justify-between">
                  <span className="text-outline">Bound Email:</span>
                  <span className="font-medium text-on-surface">{deleteModalEntry.email}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                onClick={() => setDeleteModalEntry(null)}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-surface-container hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                {deletingId ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
