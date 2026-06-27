import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp } from 'lucide-react';

export const ResultsMonitor = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get('/api/hod/results-summary');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="w-12 h-12 bg-fuchsia-50 rounded-2xl flex items-center justify-center">
          <Target className="w-6 h-6 text-fuchsia-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Monitoring</h1>
          <p className="text-sm text-gray-500 font-medium">Analyze subject performance and pass percentages</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Subject Analysis</h3>
        {loading ? (
          <div className="text-center text-gray-500 p-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {data.map((item, idx) => (
              <div key={idx} className="p-4 rounded-[16px] border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">{item.course_code} - {item.course_name}</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">Total Pass Percentage</div>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
                  <span className="text-xl font-black text-emerald-600">{item.pass_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
