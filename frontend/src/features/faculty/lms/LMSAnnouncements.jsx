import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Layers, ArrowLeft, Bell, Clock } from 'lucide-react';

export const LMSAnnouncements = () => {
  const { assignmentId } = useParams();
  
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'Important Notice'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await axios.get(`/api/faculty/courses/${assignmentId}/announcements`);
        setAnnouncements(response.data);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [assignmentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        title: `[${formData.priority}] ${formData.title}`,
        content: formData.content,
        is_global: false
      };

      const response = await axios.post(`/api/faculty/courses/${assignmentId}/announcements`, payload);
      setAnnouncements([response.data, ...announcements]);
      setFormData({
        title: '',
        content: '',
        priority: 'Important Notice'
      });
      setMessage({ type: 'success', text: 'Announcement published successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setIsFormVisible(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to publish announcement. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            to={`/faculty/courses/${assignmentId}/lms`} 
            className="text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-red-600" /> Announcements
            </h1>
            <p className="text-sm text-gray-500 mt-1">Broadcast important updates to your students.</p>
          </div>
          {isFormVisible ? (
            <button
              onClick={() => setIsFormVisible(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setIsFormVisible(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <Bell className="w-4 h-4" /> New Memo
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Form Box */}
          {isFormVisible && (
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Compose New Announcement</h3>
              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleAddAnnouncement} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Subject Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Schedule Change: Extra Lecture on Friday"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Announcement Memo Body</label>
                  <textarea
                    name="content"
                    required
                    rows={5}
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Write announcement details here..."
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Priority Tag</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full md:w-1/2 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="Important Notice">Important Notice</option>
                    <option value="General Update">General Update</option>
                    <option value="Reminder">Reminder</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                  >
                    Publish Memo
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">No announcements posted to this syllabus channel yet.</p>
              </div>
            ) : (
              announcements.map((announcement) => {
                const priorityMatch = announcement.title.match(/^\[(.*?)\]\s*(.*)$/);
                const priority = priorityMatch ? priorityMatch[1] : 'Announcement';
                const title = priorityMatch ? priorityMatch[2] : announcement.title;

                let badgeStyles = "bg-gray-100 text-gray-700 border-gray-200";
                let dotColor = "bg-gray-400";
                
                if (priority === 'Important Notice') {
                  badgeStyles = "bg-orange-50 text-orange-700 border-orange-200";
                  dotColor = "bg-orange-500";
                } else if (priority === 'Urgent') {
                  badgeStyles = "bg-red-50 text-red-700 border-red-200";
                  dotColor = "bg-red-500";
                } else if (priority === 'Reminder') {
                  badgeStyles = "bg-blue-50 text-blue-700 border-blue-200";
                  dotColor = "bg-blue-500";
                } else if (priority === 'General Update') {
                  badgeStyles = "bg-green-50 text-green-700 border-green-200";
                  dotColor = "bg-green-500";
                }

                return (
                  <div key={announcement.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${dotColor} opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                    
                    <div className="flex items-center justify-between gap-4 mb-4 pl-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${badgeStyles}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                        {priority}
                      </span>
                      <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(announcement.created_at).toLocaleDateString()} at {new Date(announcement.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 text-lg mb-3 pl-2">{title}</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed pl-2 bg-gray-50/50 p-4 rounded-xl">{announcement.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
