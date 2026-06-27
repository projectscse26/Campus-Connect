import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Plus, X, Trash2, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/hod/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await axios.post('/api/hod/announcements', formData);
      await fetchAnnouncements();
      setIsModalOpen(false);
      setFormData({ title: '', content: '' });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to post announcement');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`/api/hod/announcements/${id}`);
      setAnnouncements(announcements.filter(a => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center"><Bell className="w-6 h-6 text-amber-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Announcements</h1>
            <p className="text-sm text-gray-500 font-medium">Broadcast messages to faculty and students</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Post Announcement
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 p-8">Loading announcements...</div>
        ) : error ? (
          <div className="text-center text-red-500 p-8">{error}</div>
        ) : announcements.length === 0 ? (
          <div className="bg-white p-16 rounded-[24px] border border-gray-100 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Announcements</h3>
            <p className="text-gray-500 text-sm">Post an announcement to notify your department.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className={`bg-white p-6 rounded-[20px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border relative group ${ann.is_global ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-gray-900">{ann.title}</h3>
                  {ann.is_global && <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-lg flex items-center"><Globe className="w-3 h-3 mr-1" /> Global</span>}
                </div>
                {!ann.is_global && (
                  <button onClick={() => handleDelete(ann.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{ann.content}</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Posted by {ann.posted_by_id === user.id ? 'You' : `User ID: ${ann.posted_by_id}`}</span>
                <span>{new Date(ann.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Post Announcement</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Title</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary-500" 
                  placeholder="e.g. Mid-term Exam Schedule"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Content</label>
                <textarea 
                  required 
                  rows={5}
                  value={formData.content} 
                  onChange={(e) => setFormData({...formData, content: e.target.value})} 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary-500 resize-none" 
                  placeholder="Type your message here..."
                />
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-sm disabled:opacity-50">
                  {formLoading ? 'Posting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
