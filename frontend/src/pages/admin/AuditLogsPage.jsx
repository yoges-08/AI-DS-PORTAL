import React, { useState, useEffect } from 'react';
import { History, Shield, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'UNLOCK':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'RESET_PASSWORD':
        return 'bg-purple-50 text-purple-900 border-purple-300';
      case 'VERIFY':
        return 'bg-green-50 text-green-900 border-green-300';
      case 'REJECT':
        return 'bg-red-50 text-red-900 border-red-300';
      case 'BULK_IMPORT':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between border-b border-gov-border pb-3">
        <div>
          <h1 className="text-xl font-bold text-gov-navy flex items-center">
            <History className="w-5 h-5 mr-2 text-gov-navy" /> Administrative Audit Trail
          </h1>
          <p className="text-xs text-gray-500">
            System security audit log: Tracks who locked, unlocked, reset passwords, edited records, or imported data.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          disabled={loading}
          className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold hover:bg-gray-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-white border border-gov-border rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F5F7FA] border-b border-gov-border text-gray-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Administrator</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Student Reg No</th>
                <th className="py-2.5 px-3">Audit Particulars</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 whitespace-nowrap text-gray-600">
                      {new Date(log.created_at).toLocaleString('en-GB')}
                    </td>
                    <td className="py-2 px-3 font-semibold text-gray-900">
                      {log.admin_username}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-gov-navy">
                      {log.student_reg_no || '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-700 max-w-xs truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-gray-500">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-[#F5F7FA] border-t border-gov-border px-4 py-2 flex items-center justify-between text-xs text-gray-600">
          <div>
            Total Audit Entries: <strong>{pagination.total}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-2 py-1 bg-white border border-gray-300 rounded disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-2 py-1 bg-white border border-gray-300 rounded disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
