import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  Shield, Search, Activity, Copy, CheckCircle2,
  ChevronDown, Check, X, WifiOff, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ── Backend WS URL ────────────────────────────────────────────────────────────
// Works on same machine OR a shared LAN server (set VITE_API_URL in .env).
const API_BASE = import.meta.env.VITE_API_URL || '';
const WS_BASE  = API_BASE
  ? API_BASE.replace(/^http/, 'ws')          // http://x.x.x.x:8000 → ws://…
  : `ws://${window.location.hostname}:8000`; // same-host fallback

// ── Custom dropdown ───────────────────────────────────────────────────────────
function FilterDropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-150 focus:outline-none ${
          open
            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
            : value
            ? 'border-indigo-300 bg-indigo-50/60 text-indigo-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && (onChange(''), setOpen(false))}
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 rounded-full hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[180px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-100 py-1.5 overflow-hidden animate-dropdown">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-gray-700 hover:bg-gray-50 font-medium'
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Options ───────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'success',      label: '✅  Success (2xx)' },
  { value: 'client_error', label: '⚠️  Client Error (4xx)' },
  { value: 'server_error', label: '🔴  Server Error (5xx)' },
];
const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'auth',          label: 'Auth' },
  { value: 'admin',         label: 'Admin' },
  { value: 'students',      label: 'Students' },
  { value: 'faculty',       label: 'Faculty' },
  { value: 'departments',   label: 'Departments' },
  { value: 'courses',       label: 'Courses' },
  { value: 'discipline',    label: 'Discipline' },
  { value: 'late',          label: 'Late Tracker' },
  { value: 'leave',         label: 'Leave' },
  { value: 'announcements', label: 'Announcements' },
];
const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin',        label: 'Admin' },
  { value: 'hod',          label: 'HOD' },
  { value: 'faculty',      label: 'Faculty' },
  { value: 'student',      label: 'Student' },
  { value: 'authority',    label: 'Authority' },
  { value: 'late_tracker', label: 'Late Tracker' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const METHOD_STYLE = {
  GET:    'bg-blue-50   text-blue-700   border-blue-200',
  POST:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUT:    'bg-amber-50  text-amber-700  border-amber-200',
  PATCH:  'bg-orange-50 text-orange-700 border-orange-200',
  DELETE: 'bg-red-50    text-red-700    border-red-200',
};

function formatTimestamp(ts) {
  if (!ts) return { date: '-', time: '-' };
  const dt = new Date(ts);
  return { date: dt.toLocaleDateString('en-GB'), time: dt.toLocaleTimeString('en-GB') };
}

function StatusBadge({ code }) {
  const map = {
    '2': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '3': 'bg-yellow-100  text-yellow-700  border-yellow-200',
    '4': 'bg-red-100     text-red-700     border-red-200',
    '5': 'bg-purple-100  text-purple-700  border-purple-200',
  };
  const cls = map[String(code)[0]] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${cls}`}>
      {code}
    </span>
  );
}

// Deduplicate by id, keeping order (newest first)
function dedupe(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export const AuditLogs = () => {
  const { token } = useAuth();

  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filtering,  setFiltering]  = useState(false);
  const [error,      setError]      = useState(null);
  const [wsStatus,   setWsStatus]   = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected'
  const [liveCount,  setLiveCount]  = useState(0);

  // Pagination
  const [page,       setPage]       = useState(1);
  const pageSize = 20;
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [searchInput,  setSearchInput]  = useState('');
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');

  const [highlightedId, setHighlightedId] = useState(null);
  const [copiedId,      setCopiedId]      = useState(null);

  // Refs
  const wsRef               = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef     = useRef(null);
  const reconnectAttempt    = useRef(0);

  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setSearchTerm(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Reset page on filter change ─────────────────────────────────────────────
  useEffect(() => { setPage(1); }, [statusFilter, moduleFilter, roleFilter]);

  // ── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async ({ initial = false } = {}) => {
    try {
      if (initial) setLoading(true); else setFiltering(true);

      const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() });
      if (searchTerm)   params.append('search',        searchTerm);
      if (statusFilter) params.append('status_filter', statusFilter);
      if (moduleFilter) params.append('module',        moduleFilter);
      if (roleFilter)   params.append('role',          roleFilter);

      const res = await axios.get(`/api/audit-logs?${params}`);
      setLogs(res.data.logs);        // REST fetch is authoritative — replaces list
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setFiltering(false);
    }
  }, [page, searchTerm, statusFilter, moduleFilter, roleFilter]);

  useEffect(() => {
    fetchLogs({ initial: logs.length === 0 });
  }, [fetchLogs]);

  // ── WebSocket ───────────────────────────────────────────────────────────────
  const connectWebSocket = useCallback(() => {
    if (!token) return;

    // Clean up any stale socket first
    if (wsRef.current && wsRef.current.readyState < 2) {
      wsRef.current.onclose = null; // prevent reconnect loop
      wsRef.current.close();
    }

    const wsUrl = `${WS_BASE}/api/audit-logs/ws/audit-logs?token=${token}`;
    console.log('[AuditWS] Connecting →', wsUrl);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[AuditWS] ✅ Connected');
      setWsStatus('connected');
      reconnectAttempt.current = 0;
      // Cancel polling fallback now that WS is alive
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      // Server keepalive ping → reply pong so the socket stays alive
      if (data.type === 'ping') {
        if (ws.readyState === WebSocket.OPEN) ws.send('pong');
        return;
      }

      // Real audit log entry from any user on any machine
      setLogs(prev => {
        // Avoid duplicate: if this ID already exists, skip
        if (prev.some(l => l.id === data.id)) return prev;
        const updated = [data, ...prev].slice(0, pageSize);
        return updated;
      });
      setTotal(prev => prev + 1);
      setLiveCount(prev => prev + 1);
      setHighlightedId(data.id);
      setTimeout(() => setHighlightedId(null), 2000);
    };

    ws.onerror = () => {
      console.warn('[AuditWS] ❌ Error (will reconnect)');
    };

    ws.onclose = (evt) => {
      console.warn('[AuditWS] 🔌 Closed — code:', evt.code);
      setWsStatus('reconnecting');
      wsRef.current = null;

      // Exponential back-off: 3 s → 5 s → 10 s cap
      const attempt = reconnectAttempt.current;
      const delay   = attempt < 3 ? 3000 : attempt < 6 ? 5000 : 10000;
      reconnectAttempt.current += 1;
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);

      // Polling fallback while WS is down
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(() => fetchLogs(), 15000);
      }
    };

    wsRef.current = ws;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    reconnectAttempt.current = 0;
    connectWebSocket();
    return () => {
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pollIntervalRef.current);
    };
  }, [token]);   // reconnect only when token changes

  // ── Copy request ID ─────────────────────────────────────────────────────────
  const copyRequestId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeFilters = [statusFilter, moduleFilter, roleFilter].filter(Boolean).length;
  const clearAll = () => { setStatusFilter(''); setModuleFilter(''); setRoleFilter(''); setSearchInput(''); };

  // ── Full-page spinner (first load only) ─────────────────────────────────────
  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes dropdownIn {
          from { opacity:0; transform:translateY(-6px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
        .animate-dropdown { animation: dropdownIn 0.15s ease-out; }
        @keyframes slideIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0);    }
        }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
      `}</style>

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500 mt-2">
              Live operational trail — every action by every user appears here in real time.
            </p>
          </div>

          {/* Connection badge */}
          <div className="flex items-center gap-2 shrink-0">
            {wsStatus === 'connected' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-700">Live</span>
                {liveCount > 0 && (
                  <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                    +{liveCount} new
                  </span>
                )}
              </div>
            )}
            {wsStatus === 'reconnecting' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="text-xs font-bold text-amber-700">Reconnecting…</span>
              </div>
            )}
            {wsStatus === 'disconnected' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                <WifiOff className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-bold text-red-600">Disconnected</span>
              </div>
            )}
            {wsStatus === 'connecting' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-gray-500">Connecting…</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search actor, email, endpoint…"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-gray-50"
              />
              {searchInput && (
                <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="w-44"><FilterDropdown value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="All Status" /></div>
            <div className="w-44"><FilterDropdown value={moduleFilter} onChange={setModuleFilter} options={MODULE_OPTIONS} placeholder="All Modules" /></div>
            <div className="w-44"><FilterDropdown value={roleFilter}   onChange={setRoleFilter}   options={ROLE_OPTIONS}   placeholder="All Roles"   /></div>

            {activeFilters > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-colors">
                <X className="w-3.5 h-3.5" /> Clear {activeFilters}
              </button>
            )}

            {filtering && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-semibold">
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                Filtering…
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400 font-semibold">
            <span>{total.toLocaleString()} total entries</span>
            {activeFilters > 0 && <span className="text-indigo-500">• {activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>}
            {liveCount > 0 && <span className="text-emerald-600">• {liveCount} received live this session</span>}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* ── Table ── */}
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-opacity duration-200 ${filtering ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Time', 'Actor', 'Action', 'Status', 'Request'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                      <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-bold text-gray-500">No audit logs found</p>
                      <p className="text-xs mt-1">Actions will appear here as they happen</p>
                    </td>
                  </tr>
                ) : (
                  // Deduplicate so WS push + REST fetch of same row don't cause duplicate key
                  dedupe(logs).map((log) => {
                    const ts          = formatTimestamp(log.timestamp);
                    const isNew       = log.id === highlightedId;
                    const methodCls   = METHOD_STYLE[log.method] || 'bg-gray-50 text-gray-700 border-gray-200';

                    return (
                      <tr
                        key={log.id}
                        className={`group transition-all duration-300 ${
                          isNew
                            ? 'bg-emerald-50 animate-slide-in'
                            : 'hover:bg-indigo-50/30'
                        }`}
                      >
                        {/* Time */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{ts.date}</div>
                          <div className="text-xs text-gray-400 font-mono">{ts.time}</div>
                          {isNew && (
                            <span className="inline-block mt-1 text-[9px] font-extrabold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              New
                            </span>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">
                            {log.actor_name || <span className="text-gray-400 italic font-normal">anonymous</span>}
                          </div>
                          <div className="text-xs text-gray-400">{log.actor_email || log.ip_address}</div>
                          {log.role && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full capitalize">
                              {log.role}
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-extrabold tracking-wide ${methodCls}`}>
                              {log.method}
                            </span>
                            {log.module && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                                {log.module}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-1 truncate max-w-[220px]">{log.endpoint}</div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge code={log.status_code} />
                          {log.response_time_ms !== null && log.response_time_ms !== undefined && (
                            <div className="text-[11px] text-gray-400 mt-1 font-mono">{log.response_time_ms}ms</div>
                          )}
                        </td>

                        {/* Request ID */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => copyRequestId(log.request_id)}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
                            title={log.request_id}
                          >
                            {copiedId === log.request_id
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              : <Copy className="w-3.5 h-3.5 shrink-0" />
                            }
                            <span className="font-mono">{log.request_id?.substring(0, 8)}…</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 flex-wrap gap-3">
              <div className="text-sm text-gray-500 font-medium">
                Showing{' '}
                <span className="font-bold text-gray-800">{(page - 1) * pageSize + 1}</span>
                –
                <span className="font-bold text-gray-800">{Math.min(page * pageSize, total)}</span>
                {' '}of{' '}
                <span className="font-bold text-gray-800">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p;
                  if (totalPages <= 5)       p = i + 1;
                  else if (page <= 3)         p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else                        p = page - 2 + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 text-sm font-bold rounded-xl transition-all ${
                        page === p ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
