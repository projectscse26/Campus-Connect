import { useState, useEffect } from "react";
import axios from "axios";
import { Clock, Calendar, AlertCircle, CheckCircle2, History, Bell, Send } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

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
      <div className="bg-blue-600 text-white p-4 md:hidden sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Late Entry Notification
        </h1>
        <p className="text-blue-100 text-sm mt-1">Notify in advance if you'll arrive late</p>
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
        <div className="bg-white shadow-sm border mx-4 md:mx-0 rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            Monthly Usage
          </h2>
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-red-50 p-3 md:p-4 rounded-lg text-center">
              <p className="text-xs md:text-sm text-red-600 font-medium mb-1">Used</p>
              <p className="text-2xl md:text-3xl font-bold text-red-700">{usage.used}</p>
            </div>
            <div className="bg-green-50 p-3 md:p-4 rounded-lg text-center">
              <p className="text-xs md:text-sm text-green-600 font-medium mb-1">Remaining</p>
              <p className="text-2xl md:text-3xl font-bold text-green-700">{usage.remaining}</p>
            </div>
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg text-center">
              <p className="text-xs md:text-sm text-blue-600 font-medium mb-1">Limit</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-700">{usage.monthly_limit}</p>
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
          <div className="bg-white shadow-sm border mx-4 md:mx-0 rounded-lg p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={todayDateStr}
                  className="w-full px-3 py-3 md:py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Arrival Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.expected_arrival_time}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_arrival_time: e.target.value })
                  }
                  className="w-full px-3 py-3 md:py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Late Arrival <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="4"
                  placeholder="Please provide a detailed reason..."
                  className="w-full px-3 py-3 md:py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium py-3 px-4 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="bg-white shadow-sm border mx-4 md:mx-0 rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <History className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            History
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2 text-sm">Loading...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm md:text-base">No notifications submitted yet</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">{formatDate(item.date)}</div>
                      {item.acknowledged_by_security ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Seen by Security
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Security
                        </span>
                      )}
                    </div>
                    {item.viewed_by_mentor && (
                      <div className="mb-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Viewed by Mentor
                        </span>
                      </div>
                    )}
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{formatTime(item.expected_arrival_time)}</span>
                      </div>
                      <div className="text-gray-700 mt-2">{item.reason}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        Submitted: {formatDateTime(item.created_at)}
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
