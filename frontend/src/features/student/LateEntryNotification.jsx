import { useState, useEffect } from "react";
import axios from "axios";
import { Clock, Calendar, AlertCircle, CheckCircle2, History, Bell, Send } from "lucide-react";

const API_BASE = "/api";

export default function LateEntryNotification() {
  const [usage, setUsage] = useState({ used: 0, remaining: 5, monthly_limit: 5, can_submit: true });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const todayDate = new Date();
  const todayDateStr = todayDate.toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    date: todayDateStr,
    expected_arrival_time: "",
    reason: ""
  });

  useEffect(() => {
    fetchUsage();
    fetchHistory();
  }, []);

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/late/notifications/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Usage Response:", response.data); // Debug log
      setUsage(response.data);
    } catch (error) {
      console.error("Error fetching usage:", error);
      console.error("Error response:", error.response?.data); // Debug log
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/late/notifications/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.expected_arrival_time || !formData.reason.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setMessage({ type: "error", text: "Please login again" });
        setSubmitting(false);
        return;
      }
      
      await axios.post(
        `${API_BASE}/late/notifications`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: "success", text: "Notification submitted successfully!" });
      
      setFormData({
        date: new Date().toISOString().split("T")[0],
        expected_arrival_time: "",
        reason: ""
      });

      fetchUsage();
      fetchHistory();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Submit error:", error.response?.data);
      
      if (error.response?.status === 401) {
        setMessage({ type: "error", text: "Session expired. Please login again." });
      } else if (error.response?.status === 400) {
        // Show backend validation error
        const errorMsg = error.response?.data?.detail || "Failed to submit notification";
        setMessage({ type: "error", text: errorMsg });
      } else {
        const errorMsg = error.response?.data?.detail || "Failed to submit notification";
        setMessage({ type: "error", text: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:p-6">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 md:hidden rounded-b-3xl shadow-lg mb-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <h1 className="text-2xl font-bold flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Bell className="h-6 w-6 text-white" />
          </div>
          Late Entry
        </h1>
        <p className="text-primary-100 text-sm mt-3 opacity-90 relative z-10">Notify in advance if you'll arrive late</p>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-7 w-7" />
          Late Entry Notification
        </h1>
        <p className="text-gray-600 mt-1">
          Notify the college in advance if you expect to arrive late
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Usage Summary */}
        <div className="bg-white shadow-sm border border-gray-100 mx-4 md:mx-0 rounded-3xl p-5 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 bg-gradient-to-bl from-primary-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
          <h2 className="text-base md:text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
            <Clock className="h-5 w-5 text-primary-600" />
            Monthly Usage
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-6 relative z-10">
            <div className="bg-red-50/80 p-2 sm:p-3 md:p-5 rounded-2xl text-center border border-red-100/50 backdrop-blur-sm transition-transform hover:scale-105">
              <p className="text-[10px] sm:text-xs md:text-sm text-red-600 font-bold mb-1 uppercase tracking-wider truncate">Used</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-red-700">{usage.used}</p>
            </div>
            <div className="bg-green-50/80 p-2 sm:p-3 md:p-5 rounded-2xl text-center border border-green-100/50 backdrop-blur-sm transition-transform hover:scale-105">
              <p className="text-[10px] sm:text-xs md:text-sm text-green-600 font-bold mb-1 uppercase tracking-wider truncate">Remaining</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-green-700">{usage.remaining}</p>
            </div>
            <div className="bg-primary-50/80 p-2 sm:p-3 md:p-5 rounded-2xl text-center border border-primary-100/50 backdrop-blur-sm transition-transform hover:scale-105">
              <p className="text-[10px] sm:text-xs md:text-sm text-primary-600 font-bold mb-1 uppercase tracking-wider truncate">Limit</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-primary-700">{usage.monthly_limit}</p>
            </div>
          </div>

          {!usage.can_submit && (
            <div className="mt-3 md:mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 md:p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base text-yellow-700 font-medium">
                  Monthly limit reached. Cannot submit more notifications this month.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        {usage.can_submit && (
          <div className="bg-white shadow-sm border border-gray-100 mx-4 md:mx-0 rounded-3xl p-5 md:p-8">
            <h2 className="text-base md:text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
              <Calendar className="h-5 w-5 text-primary-600" />
              Submit Notification
            </h2>

            {message && (
              <div
                className={`mb-4 p-3 md:p-4 rounded-lg flex items-start gap-2 text-sm md:text-base ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={todayDateStr}
                  className="w-full px-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Expected Arrival Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.expected_arrival_time}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_arrival_time: e.target.value })
                  }
                  className="w-full px-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Reason for Late Arrival <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                  placeholder="Please provide a detailed reason..."
                  className="w-full px-4 py-3 text-base bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Submit Notification
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* History */}
        <div className="bg-white shadow-sm border border-gray-100 mx-4 md:mx-0 rounded-3xl p-5 md:p-8">
          <h2 className="text-base md:text-lg font-bold mb-5 flex items-center gap-2 text-gray-800">
            <History className="h-5 w-5 text-primary-600" />
            History
          </h2>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-4 text-sm font-medium">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-base font-bold text-gray-700">No notifications yet</p>
              <p className="text-sm text-gray-500 mt-1">Your late entry history will appear here.</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent pt-2 pb-2">
                {history.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-4">
                    {/* Timeline Node */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-primary-100 text-primary-500 shadow-sm shrink-0 z-10 relative mt-1">
                      <Clock className="w-4 h-4" />
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex-1 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="font-black text-gray-900 text-base">{formatDate(item.date)}</div>
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <Clock className="h-3.5 w-3.5 text-primary-600" />
                            <span className="font-bold text-primary-700 text-xs">{formatTime(item.expected_arrival_time)}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {item.acknowledged_by_security ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-700 border border-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Seen by Security
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-yellow-50 text-yellow-700 border border-yellow-100">
                              <Clock className="h-3 w-3 mr-1" /> Pending Security
                            </span>
                          )}
                          {item.viewed_by_mentor && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold bg-primary-50 text-primary-700 border border-primary-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Viewed by Mentor
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                        <div className="text-sm text-gray-600 leading-relaxed font-medium">{item.reason}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-2 pt-2 border-t border-gray-100">
                          Submitted: {formatDateTime(item.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{formatDate(item.date)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {formatTime(item.expected_arrival_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-md">{item.reason}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-1">
                            {item.acknowledged_by_security ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-max">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Seen by Sec
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-max">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Sec
                              </span>
                            )}
                            {item.viewed_by_mentor && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-max">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Viewed by Mentor
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
