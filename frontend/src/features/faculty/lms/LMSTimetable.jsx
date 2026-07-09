import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, ArrowLeft, MapPin } from 'lucide-react';

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

export const LMSTimetable = () => {
  const { assignmentId } = useParams();
  const [slots, setSlots] = useState([]);
  const [grid, setGrid] = useState(emptyGrid());
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        const [timetableRes, coursesRes] = await Promise.all([
          axios.get(`/api/faculty/courses/${assignmentId}/timetable`),
          axios.get('/api/faculty/me/courses')
        ]);
        
        setSlots(timetableRes.data);
        
        const currentCourse = coursesRes.data.find(c => c.id.toString() === assignmentId);
        if (currentCourse) setCourseDetails(currentCourse);

        // Build grid from flat slot list
        const newGrid = emptyGrid();
        timetableRes.data.forEach(slot => {
          const period = PERIODS.find(p => p.start === slot.start_time);
          if (period && newGrid[slot.day]) {
            newGrid[slot.day][period.id] = {
              room: slot.room,
            };
          }
        });
        setGrid(newGrid);
      } catch (err) {
        console.error("Failed to load course timetable:", err);
        setError('Failed to load course timetable');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimetableData();
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-red-500 font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              to={`/faculty/courses/${assignmentId}/lms`} 
              className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8 text-indigo-600 animate-pulse" /> Course Timetable
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {courseDetails ? `${courseDetails.course.code} - ${courseDetails.course.name} (Year-${courseDetails.section.year} ${courseDetails.section.name})` : 'View the weekly schedule for this course'}
          </p>
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
          <Calendar className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-gray-500 font-bold text-lg mb-1">No timetable slots assigned</p>
          <p className="text-gray-400 text-sm max-w-sm">No schedule has been configured for this course assignment in the current semester.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <div className="min-w-[760px] p-4">
              {/* Header row */}
              <div className="flex bg-gray-50 border-b border-gray-200 rounded-t-xl">
                <div className="w-16 shrink-0 border-r border-gray-200 p-3 flex flex-col justify-center items-center font-bold text-gray-500 text-xs">
                  DAY /<br />TIME
                </div>
                {PERIODS.map(period => (
                  <div
                    key={period.id}
                    className={`flex flex-col justify-center items-center p-2 text-xs border-r border-gray-200 shrink-0 ${
                      period.type === 'break'
                        ? 'w-10 bg-gray-100 text-gray-400 font-medium'
                        : 'w-[96px] bg-white font-bold text-gray-700'
                    }`}
                  >
                    {period.type === 'period' ? (
                      <>
                        <span className="text-indigo-600 mb-0.5 text-[10px]">Period {period.label}</span>
                        <span className="font-normal text-[9px] text-gray-500 text-center leading-tight">
                          {period.time}
                        </span>
                      </>
                    ) : (
                      <div className="[writing-mode:vertical-rl] tracking-wider uppercase text-[9px]">
                        {period.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Day rows */}
              {DAYS.map(day => (
                <div key={day.id} className="flex border-b border-gray-100 last:border-b-0 hover:bg-gray-50/20 transition-colors">
                  <div className="w-16 shrink-0 border-r border-gray-200 bg-gray-50 p-3 flex items-center justify-center font-bold text-gray-700 text-xs uppercase">
                    {day.label}
                  </div>

                  {PERIODS.map(period => {
                    if (period.type === 'break') {
                      return (
                        <div
                          key={`${day.id}-${period.id}`}
                          className="w-10 shrink-0 border-r border-gray-200 bg-gray-100/30"
                        />
                      );
                    }

                    const cell = grid[day.id]?.[period.id];

                    return (
                      <div
                        key={`${day.id}-${period.id}`}
                        className={`w-[96px] shrink-0 border-r border-gray-200 p-1.5 flex items-center justify-center ${
                          cell ? 'bg-indigo-50/40' : 'bg-white'
                        }`}
                      >
                        {cell ? (
                          <div className="w-full h-full bg-white border border-indigo-200 rounded-lg p-1.5 text-center flex flex-col justify-center items-center shadow-sm">
                            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide">
                              {courseDetails?.course.short_name || courseDetails?.course.code || 'CLASS'}
                            </span>
                            {cell.room && (
                              <span className="text-[9px] font-bold text-indigo-500 mt-0.5">
                                Rm {cell.room}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-full min-h-[38px]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
