import React from 'react';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export const LateAnalytics = ({ data }) => {
  if (!data) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  };

  const chartData = data.recent_trend.map(d => ({
    name: formatDate(d.date),
    count: d.count
  }));

  const frequentData = data.frequent_latecomers.map(d => ({
    name: d.name.split(' ')[0], // First name only for chart
    count: d.count,
    fullName: d.name,
    reg: d.register_number
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Stats Cards */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">Total Late Records</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{data.total_lates}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">Recent Trend (7d)</p>
            <h3 className="text-3xl font-extrabold text-gray-900">
              {data.recent_trend.reduce((sum, item) => sum + item.count, 0)}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">Top Offender</p>
            <h3 className="text-lg font-extrabold text-gray-900 truncate max-w-[150px]">
              {data.frequent_latecomers.length > 0 ? data.frequent_latecomers[0].name : 'None'}
            </h3>
            <p className="text-xs text-red-500 font-bold mt-1">
              {data.frequent_latecomers.length > 0 ? `${data.frequent_latecomers[0].count} times` : '0 times'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Daily Trend Line Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <h3 className="font-bold text-gray-900 text-lg mb-6">Recent Trends (Last 7 Days)</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                cursor={{stroke: '#f3f4f6', strokeWidth: 2}}
              />
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Frequent Latecomers Bar Chart */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <h3 className="font-bold text-gray-900 text-lg mb-6">Most Frequent (Top 5)</h3>
        <div className="h-[250px] w-full">
          {frequentData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequentData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 'bold'}} width={70} />
                <RechartsTooltip 
                  cursor={{fill: '#f9fafb'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontWeight: 'bold' }}
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                  {frequentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#eab308'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400 font-bold text-sm">
               No data available
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
