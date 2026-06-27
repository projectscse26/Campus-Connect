import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle } from 'lucide-react';

export const AttendanceMonitor = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get('/api/hod/attendance-summary');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
          <Activity className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Monitoring</h1>
          <p className="text-sm text-gray-500 font-medium">Department-wide attendance and shortage alerts</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Class-wise Overview</h3>
        {loading ? (
          <div className="text-center text-gray-500 p-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.map(item => (
              <div key={item.section_id} className="p-4 rounded-[16px] border border-gray-100 bg-gray-50/50 hover:border-rose-200 transition-colors">
                <div className="font-bold text-gray-900 mb-2">{item.section_name}</div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Avg Attendance</div>
                    <div className={`text-2xl font-black ${item.average_attendance < 75 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {item.average_attendance}%
                    </div>
                  </div>
                  {item.low_attendance_count > 0 && (
                    <div className="flex items-center text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-lg">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {item.low_attendance_count} students &lt; 75%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
