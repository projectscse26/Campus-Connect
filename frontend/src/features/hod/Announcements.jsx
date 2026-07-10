import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, X, Trash2, Globe, Edit, Calendar, User, Clock, Send, Inbox } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Tab state: 'received' | 'sent' ──
  const [activeTab, setActiveTab] = useState('received');

  // Category filter (Received tab only)
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    target_audience: 'Everyone',
    is_global: false
  });
  const [formLoading, setFormLoading] = useState(false);

  // Highlight / scroll state (triggered via ?id= query param)
  const [highlightedId, setHighlightedId] = useState(null);

  const categories = ['All', 'Urgent', 'Event', 'General', 'Academic'];

  const categoryColors = {
    Urgent:   'bg-red-50 text-red-700 border-red-200',
    Event:    'bg-purple-50 text-purple-700 border-purple-200',
    Academic: 'bg-blue-50 text-blue-700 border-blue-200',
    General:  'bg-gray-50 text-gray-700 border-gray-200',
  };

  // ── Permissions ──────────────────────────────────────────────
  const canCreate = user && ['admin', 'authority', 'hod', 'faculty'].includes(user.role);

  const getAllowedAudiences = () => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':     return ['Everyone', 'Higher Authorities', 'HODs', 'Faculty', 'Students'];
      case 'authority': return ['Everyone', 'HODs', 'Faculty', 'Students'];
      case 'hod':       return ['Everyone', 'Faculty', 'Students'];
      case 'faculty':   return ['Students'];
      default:          return [];
    }
  };

  // ── Data fetching ─────────────────────────────────────────────
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/announcements/');
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // ── Highlight / scroll to ?id= card ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    if (idParam && announcements.length > 0) {
      const numericId = parseInt(idParam, 10);
      const exists = announcements.some(a => a.id === numericId);
      if (exists) {
        // Switch to Received so the card is visible
        setActiveTab('received');
        setHighlightedId(numericId);
        setTimeout(() => {
          document.getElementById(`announcement-card-${numericId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 400);
        const t = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(t);
      } else {
        alert('This announcement no longer exists or you do not have permission to view it.');
      }
    }
  }, [window.location.search, announcements]);

  // ── Modal helpers ─────────────────────────────────────────────
  const handleOpenCreateModal = () => {
    const audiences = getAllowedAudiences();
    setModalMode('create');
    setFormData({
      title: '',
      content: '',
      category: 'General',
      target_audience: audiences[0] || 'Everyone',
      is_global: false,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (ann) => {
    setModalMode('edit');
    setEditingId(ann.id);
    setFormData({
      title: ann.title,
      content: ann.content,
      category: ann.category,
      target_audience: ann.target_audience,
      is_global: ann.is_global,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await axios.post('/api/announcements/', formData);
      } else {
        await axios.put(`/api/announcements/${editingId}`, formData);
      }
      await fetchAnnouncements();
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`/api/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  // ── Derived lists ─────────────────────────────────────────────
  // Received: everything the backend returns that wasn't posted by the user,
  // PLUS the user's own (so creators still see their cards in Received).
  // Category filter applies here.
  const receivedAnnouncements = announcements.filter(ann => {
    if (selectedCategory !== 'All' && ann.category !== selectedCategory) return false;
    return true;
  });

  // Sent: only announcements the current user created
  const sentAnnouncements = announcements.filter(ann => ann.posted_by_id === user?.id);

  // ── Reusable Announcement Card ────────────────────────────────
  const AnnouncementCard = ({ ann, showAudienceBadge = false }) => {
    const isHighlighted = highlightedId === ann.id;
    const badgeClass = categoryColors[ann.category] || categoryColors.General;
    const createdDate = new Date(ann.created_at);
    const isCreator = ann.posted_by_id === user?.id;
    const isAdmin = user?.role === 'admin';

    return (
      <div
        id={`announcement-card-${ann.id}`}
        className={`bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border transition-all duration-500 relative ${
          isHighlighted
            ? 'border-primary-500 ring-4 ring-primary-100 scale-[1.01] bg-primary-50/20'
            : ann.is_global
              ? 'border-indigo-100 bg-indigo-50/10'
              : 'border-gray-100'
        }`}
      >
        {/* Top row: badges + date/time */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center flex-wrap gap-2">
            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${badgeClass}`}>
              {ann.category}
            </span>
            {showAudienceBadge && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border bg-amber-50 text-amber-700 border-amber-200">
                → {ann.target_audience}
              </span>
            )}
            {ann.is_global && (
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-lg border border-indigo-100 flex items-center">
                <Globe className="w-3 h-3 mr-1" /> Global
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-400 font-semibold shrink-0">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {createdDate.toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Middle: title + content */}
        <div className="space-y-2 mb-4">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{ann.title}</h3>
          <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{ann.content}</p>
        </div>

        {/* Bottom: author + actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs text-gray-500 font-bold">
            <User className="w-4 h-4 text-gray-400" />
            <span>Posted by:</span>
            <span className="text-gray-800">{ann.author?.name}</span>
            <span className="text-gray-400 font-normal">|</span>
            <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">
              {ann.author?.designation || ann.author?.role}
            </span>
          </div>

          <div className="flex space-x-2">
            {isCreator && (
              <button
                onClick={() => handleEditClick(ann)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="Edit Announcement"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {(isCreator || isAdmin) && (
              <button
                onClick={() => handleDelete(ann.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Header Block ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campus Announcements</h1>
            <p className="text-sm text-gray-500 font-medium">Broadcast alerts, schedules, events and general news</p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> New Announcement
          </button>
        )}
      </div>

      {/* ── Received / Sent Toggle Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 flex gap-1 w-fit shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'received'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Received
          {announcements.filter(a => a.posted_by_id !== user?.id).length > 0 && activeTab !== 'received' && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-primary-100 text-primary-600 rounded-full">
              {announcements.filter(a => a.posted_by_id !== user?.id).length}
            </span>
          )}
        </button>

        {canCreate && (
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'sent'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Send className="w-4 h-4" />
            Sent
            {sentAnnouncements.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                activeTab === 'sent'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {sentAnnouncements.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════
          RECEIVED TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'received' && (
        <>
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 bg-white p-3 rounded-2xl border border-gray-100">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Announcement Cards */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 p-8">Loading announcements...</div>
            ) : error ? (
              <div className="text-center text-red-500 p-8">{error}</div>
            ) : receivedAnnouncements.length === 0 ? (
              <div className="bg-white p-16 rounded-[24px] border border-gray-100 text-center">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Announcements</h3>
                <p className="text-gray-500 text-sm">
                  There are no announcements in this category yet.
                </p>
              </div>
            ) : (
              receivedAnnouncements.map(ann => (
                <AnnouncementCard key={ann.id} ann={ann} showAudienceBadge={false} />
              ))
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          SENT TAB
      ══════════════════════════════════════════ */}
      {activeTab === 'sent' && canCreate && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 p-8">Loading...</div>
          ) : sentAnnouncements.length === 0 ? (
            <div className="bg-white p-16 rounded-[24px] border border-gray-100 text-center">
              <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Sent Announcements</h3>
              <p className="text-gray-500 text-sm">
                You haven't posted any announcements yet.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-6 inline-flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Post Your First Announcement
              </button>
            </div>
          ) : (
            sentAnnouncements.map(ann => (
              <AnnouncementCard key={ann.id} ann={ann} showAudienceBadge={true} />
            ))
          )}
        </div>
      )}

      {/* ── Creation / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                {modalMode === 'create' ? 'Post Announcement' : 'Edit Announcement'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary-500"
                  placeholder="e.g. Mid-term Exam Schedule"
                />
              </div>

              {/* Category + Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary-500"
                  >
                    <option value="General">General</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Event">Event</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Audience
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={e => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary-500"
                  >
                    {getAllowedAudiences().map(aud => (
                      <option key={aud} value={aud}>{aud}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Global checkbox (Admin + Authority only) */}
              {user && ['admin', 'authority'].includes(user.role) && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_global"
                    checked={formData.is_global}
                    onChange={e => setFormData({ ...formData, is_global: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_global" className="text-xs font-bold text-gray-700 cursor-pointer">
                    Publish as Institution-wide (Global) Announcement
                  </label>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Announcement Description
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary-500 resize-none"
                  placeholder="Type your message here..."
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {formLoading ? 'Publishing...' : modalMode === 'create' ? 'Publish' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
