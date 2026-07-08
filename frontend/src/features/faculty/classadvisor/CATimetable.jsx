import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock } from 'lucide-react';

const PERIODS = [
  { id: 1,    label: '1',     time: '8.45 - 9.30am',    type: 'period', start: '08:45' },
  { id: 2,    label: '2',     time: '9.30 - 10.20am',   type: 'period', start: '09:30' },
  { id: 'b1', label: 'BREAK', time: '10.20 - 10.35am',  type: 'break'  },
  { id: 3,    label: '3',     time: '10.35 - 11.25am',  type: 'period', start: '10:35' },
  { id: 4,    label: '4',     time: '11.25 - 12.15pm',  type: 'period', start: '11:25' },
  { id: 'l1', label: 'LUNCH', time: '12.15 - 1.00pm',   type: 'break'  },
  { id: 5,    label: '5',     time: '1.00 - 1.50pm',    type: 'period', start: '13:00' },
  { id: 6,    label: '6',     time: '1.50 - 2.40pm',    type: 'period', start: '13:50' },
  { id: 'b2', label: 'BREAK', time: '2.40 - 2.50pm',    type: 'break'  },
  { id: 7,    label: '7',     time: '2.50 - 3.40pm',    type: 'period', start: '14:50' },
  { id: 8,    label: '8',     time: '3.40 - 4.30pm',    type: 'period', start: '15:40' },
];

const DAYS = [
  { id: 'mon', label: 'MON' },
  { id: 'tue', label: 'TUE' },
  { id: 'wed', label: 'WED' },
  { id: 'thu', label: 'THU' },
  { id: 'fri', label: 'FRI' },
];

const emptyGrid = () => {
  const g = {};
  DAYS.forEach(d => {
    g[d.id] = {};
    PERIODS.filter(p => p.type === 'period').forEach(p => { g[d.id][p.id] = null; });
  });
  return g;
};

export const CATimetable = () => {
  const [slots, setSlots]   = useState([]);
  const [grid, setGrid]     = useState(emptyGrid());
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    axios.get('/api/class-advisor/timetable')
      .then(r => {
        setSlots(r.data);

        // Build grid from flat slot list
        const newGrid = emptyGrid();
        r.data.forEach(slot => {
          const period = PERIODS.find(p => p.start === slot.start_time);
          if (period && newGrid[slot.day]) {
            newGrid[slot.day][period.id] = {
              subject_code: slot.subject_code,
              subject_name: slot.subject_name,
              faculty_name: slot.faculty_name,
              room: slot.room,
            };
          }
        });
        setGrid(newGrid);
      })
      .catch(() => setError('Failed to load timetable'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading...</div>;
  if (error)   return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Timetable</h1>
          <p className="text-gray-500 text-sm">Read-only view of your class schedule</p>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
          <Calendar className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No timetable assigned to your class yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <div className="min-w-[900px]">

            {/* Header row */}
            <div className="flex bg-gray-50 border-b border-gray-200 rounded-t-2xl">
              <div className="w-20 shrink-0 border-r border-gray-200 p-3 flex flex-col justify-center items-center font-bold text-gray-500 text-xs">
                DAY /<br />TIME
              </div>
              {PERIODS.map(period => (
                <div
                  key={period.id}
                  className={`flex flex-col justify-center items-center p-2 text-xs border-r border-gray-200 shrink-0 ${
                    period.type === 'break'
                      ? 'w-14 bg-gray-100 text-gray-500 font-medium'
                      : 'w-[120px] bg-white font-bold text-gray-700'
                  }`}
                >
                  {period.type === 'period' ? (
                    <>
                      <span className="text-indigo-600 mb-1">Period {period.label}</span>
                      <span className="font-normal text-[10px] text-gray-500 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{period.time}
                      </span>
                    </>
                  ) : (
                    <div className="[writing-mode:vertical-rl] tracking-widest uppercase text-[10px]">
                      {period.label}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Day rows */}
            {DAYS.map(day => (
              <div key={day.id} className="flex border-b border-gray-100 last:border-b-0 hover:bg-gray-50/40 transition-colors">
                <div className="w-20 shrink-0 border-r border-gray-200 bg-gray-50 p-3 flex items-center justify-center font-bold text-gray-700 text-sm">
                  {day.label}
                </div>

                {PERIODS.map(period => {
                  if (period.type === 'break') {
                    return (
                      <div
                        key={`${day.id}-${period.id}`}
                        className="w-14 shrink-0 border-r border-gray-200 bg-gray-100/50"
                      />
                    );
                  }

                  const cell = grid[day.id]?.[period.id];

                  return (
                    <div
                      key={`${day.id}-${period.id}`}
                      className={`w-[120px] shrink-0 border-r border-gray-200 p-2 ${
                        cell ? 'bg-indigo-50/40 dark:bg-gray-50/40' : 'bg-white'
                      }`}
                    >
                      {cell ? (
                        <div className="h-full bg-white dark:bg-gray-100 border border-indigo-200 dark:border-gray-200 rounded-lg p-2 shadow-sm">
                          <div
                            className="font-bold text-indigo-700 dark:text-indigo-300 text-xs truncate"
                            title={cell.subject_name}
                          >
                            {cell.subject_code}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5 truncate" title={cell.faculty_name}>
                            {cell.faculty_name}
                          </div>
                          {cell.room && (
                            <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                              {cell.room}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full min-h-[48px]" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
};
