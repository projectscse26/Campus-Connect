import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Calendar, Clock, User, Search, Filter, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "/api";

export default function LateEntryNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, today, unacknowledged
  const [category, setCategory] = useState("all_roles"); // all_roles, mentee, class
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();
  const isFaculty = user?.role === "faculty";

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${API_BASE}/late/notifications`;
      
      // Add filters
      const params = new URLSearchParams();
      if (filter === "today") {
        params.append("date_filter", new Date().toISOString().split("T")[0]);
      } else if (filter === "unacknowledged") {
        params.append("unacknowledged_only", "true");
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
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

  const filteredNotifications = notifications.filter((notif) => {
    // Role filter
    if (category === "mentee" && !notif.is_mentee) return false;
    if (category === "class" && !notif.is_class_student) return false;

    // Search filter
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      notif.student_name?.toLowerCase().includes(search) ||
      notif.student_register_number?.toLowerCase().includes(search) ||
      notif.reason?.toLowerCase().includes(search)
    );
  });

  const todayCount = notifications.filter(
    (n) => n.date === new Date().toISOString().split("T")[0]
  ).length;
  const unacknowledgedCount = notifications.filter((n) => !n.acknowledged_by_security).length;

  return (
    <div className="bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4 md:hidden mb-4 shadow-md rounded-lg">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Late Entry Notifications
        </h1>
        <p className="text-blue-100 text-sm mt-1">View student late arrival notices</p>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-7 w-7" />
          Late Entry Notifications
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage late entry notifications from students
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Total</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-700">{notifications.length}</p>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Today</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-700">{todayCount}</p>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-3 md:p-4 text-center">
            <p className="text-xs md:text-sm text-gray-600 font-medium mb-1">Pending</p>
            <p className="text-2xl md:text-3xl font-bold text-red-700">{unacknowledgedCount}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
          {/* Category Buttons */}
          {isFaculty && (
            <div className="flex flex-wrap gap-2 mb-3 border-b border-gray-100 pb-3">
              <button
                onClick={() => setCategory("all_roles")}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  category === "all_roles"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setCategory("mentee")}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  category === "mentee"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                My Mentees
              </button>
              <button
                onClick={() => setCategory("class")}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  category === "class"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                My Class
              </button>
            </div>
          )}

          {/* Time/Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-3 pb-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter("unacknowledged")}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === "unacknowledged"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, register number, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            Notifications ({filteredNotifications.length})
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2 text-sm">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm md:text-base">
                {searchTerm ? "No matching notifications found" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredNotifications.map((notif) => (
                  <div key={notif.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{notif.student_name}</div>
                        <div className="text-xs text-gray-500">{notif.student_register_number}</div>
                      </div>
                      {notif.acknowledged_by_security ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Seen
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                      

                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDate(notif.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{formatTime(notif.expected_arrival_time)}</span>
                      </div>
                      {notif.department_name && (
                        <div className="text-xs text-gray-500">
                          {notif.department_name} {notif.section_name && `- ${notif.section_name}`}
                        </div>
                      )}
                      <div className="text-gray-700 mt-2 bg-white p-2 rounded border border-gray-200">
                        <span className="text-xs text-gray-500">Reason:</span>
                        <p className="mt-1">{notif.reason}</p>
                      </div>
                      

                      <div className="text-xs text-gray-500 pt-2 border-t mt-2">
                        Submitted: {formatDateTime(notif.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Security Status</th>

                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNotifications.map((notif) => (
                      <tr key={notif.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{notif.student_name}</div>
                              <div className="text-xs text-gray-500">{notif.student_register_number}</div>
                              {notif.department_name && (
                                <div className="text-xs text-gray-400">
                                  {notif.department_name} {notif.section_name && `- ${notif.section_name}`}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {formatDate(notif.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-600">
                          {formatTime(notif.expected_arrival_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-md">
                          {notif.reason}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(notif.created_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {notif.acknowledged_by_security ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-max">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-max">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </span>
                          )}
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
