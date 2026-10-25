import React, { useState, useEffect } from 'react';
import { 
  History, 
  Shield, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Lock, 
  Unlock, 
  KeyRound, 
  CheckCircle, 
  XCircle, 
  Upload,
  Activity,
  Terminal,
  Trash2
} from 'lucide-react';
import { api } from '../../services/api';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(page);
      if (res.success) {
        setLogs(res.logs);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOCK':
        return {
          classes: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          icon: Lock
        };
      case 'UNLOCK':
        return {
          classes: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-500',
          icon: Unlock
        };
      case 'RESET_PASSWORD':
        return {
          classes: 'bg-purple-100 text-purple-900 border-purple-300',
          dot: 'bg-purple-500',
          icon: KeyRound
        };
      case 'VERIFY':
        return {
          classes: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: CheckCircle
        };
      case 'REJECT':
        return {
          classes: 'bg-rose-100 text-rose-900 border-rose-300',
          dot: 'bg-rose-500',
          icon: XCircle
        };
      case 'BULK_IMPORT':
        return {
          classes: 'bg-secondary-fixed text-primary border-secondary/30',
          dot: 'bg-secondary',
          icon: Upload
        };
      case 'BULK_LOCK':
        return {
          classes: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          dot: 'bg-amber-600',
          icon: Lock
        };
      case 'BULK_UNLOCK':
        return {
          classes: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          dot: 'bg-emerald-600',
          icon: Unlock
        };
      case 'BULK_DELETE':
        return {
          classes: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
          dot: 'bg-rose-600',
          icon: Trash2
        };
      default:
        return {
          classes: 'bg-surface-container-high text-on-surface border-outline-variant/40',
          dot: 'bg-outline',
          icon: Activity
        };
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/30 pb-4 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-label-sm font-semibold bg-primary-fixed text-primary">
              Security Compliance
            </span>
            <span className="text-caption text-outline font-medium">Immutable Activity Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-secondary" /> Administrative Audit Trail
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Real-time audit log of credentials resets, status locks, verification approvals, and bulk dataset ingestions.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/90 border border-outline-variant/40 rounded-xl text-xs font-semibold text-primary hover:bg-surface-container shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Audit Log Card Container */}
      <div className="glass-card-l1 rounded-3xl border border-white/60 shadow-lg backdrop-blur-xl bg-white/95 overflow-hidden">
        
        {/* Mobile View */}
        <div className="md:hidden divide-y divide-outline-variant/20">
          {loading ? (
            <div className="py-12 text-center text-outline text-xs">
              Loading security audit ledger...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 px-4 text-center text-outline text-xs">
              No audit records logged yet.
            </div>
          ) : (
            logs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;
              return (
                <div key={log.id} className="p-4 space-y-2.5 hover:bg-surface-container-low/50 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      <Icon className="w-3 h-3" />
                      {log.action}
                    </span>
                    <span className="text-[11px] text-outline font-mono">
                      {new Date(log.created_at).toLocaleString('en-GB')}
                    </span>
                  </div>
                  {log.student_reg_no && (
                    <div className="flex items-center gap-1.5 font-mono text-primary font-bold">
                      <span className="text-outline font-normal">Candidate:</span> {log.student_reg_no}
                    </div>
                  )}
                  <div className="text-on-surface bg-surface-container-low/80 p-2.5 rounded-xl border border-outline-variant/20 font-mono text-[11px] break-words break-all">
                    {log.details || '-'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-outline pt-1">
                    <span>Admin: <strong className="text-on-surface">{log.admin_username}</strong></span>
                    <span className="font-mono text-[10px]">{log.ip_address || '127.0.0.1'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-container-low/80 border-b border-outline-variant/30 text-outline font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Student Reg No</th>
                <th className="py-3 px-4">Event Particulars</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-on-surface">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-outline">
                    Loading security audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-outline">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  return (
                    <tr key={log.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-outline font-mono text-[11px]">
                        {new Date(log.created_at).toLocaleString('en-GB')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {log.admin_username}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          <Icon className="w-3 h-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {log.student_reg_no || '-'}
                      </td>
                      <td className="py-3 px-4 text-on-surface max-w-sm truncate font-mono text-[11px]" title={log.details}>
                        {log.details || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-outline">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-surface-container-lowest/90 border-t border-outline-variant/30 px-6 py-3.5 flex items-center justify-between text-xs text-outline backdrop-blur-md">
          <div>
            Total Audit Entries: <strong className="text-primary">{pagination.total}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition-all active:scale-95"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-on-surface" />
            </button>
            <span className="px-2 font-medium text-on-surface">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest disabled:opacity-40 transition-all active:scale-95"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-on-surface" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
