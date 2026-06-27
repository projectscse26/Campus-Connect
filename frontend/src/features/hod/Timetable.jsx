import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Plus, X, Trash2 } from 'lucide-react';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const Timetable = () => {
  const [sections, setSections] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [slots, setSlots] = useState([]);
  
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ course_assignment_id: '', day: 'mon', start_time: '09:00', end_time: '10:00', room: '' });

  // Initial load
  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [secRes, cRes, fRes, aRes] = await Promise.all([
          axios.get('/api/hod/sections'),
          axios.get('/api/hod/courses'),
          axios.get('/api/hod/faculty'),
          axios.get('/api/hod/assignments')
        ]);
        setSections(secRes.data);
        setCourses(cRes.data);
        setFaculty(fRes.data);
        setAssignments(aRes.data);
        
        if (secRes.data.length > 0) {
          setSelectedSection(secRes.data[0].id.toString());
        }
      } catch (err) {
        setError('Failed to load initial data');
      }
    };
    fetchInit();
  }, []);

  // Fetch timetable when section changes
  useEffect(() => {
    if (!selectedSection) return;
    const fetchTimetable = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/hod/timetable?section_id=${selectedSection}`);
        setSlots(res.data);
      } catch (err) {
        setError('Failed to load timetable slots');
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, [selectedSection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/hod/timetable', formData);
      const res = await axios.get(`/api/hod/timetable?section_id=${selectedSection}`);
      setSlots(res.data);
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add slot');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await axios.delete(`/api/hod/timetable/${id}`);
      setSlots(slots.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  // Helper to format slot for grid
  const getAssignmentDetails = (assignmentId) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return 'Unknown';
    const course = courses.find(c => c.id === assignment.course_id);
    const fac = faculty.find(f => f.id === assignment.faculty_id);
    return {
      courseName: course ? course.code : 'Unknown Course',
      facultyName: fac ? `${fac.first_name}` : 'Unknown Faculty'
    };
  };

  // Filter assignments for the selected section
  const sectionAssignments = assignments.filter(a => a.section_id.toString() === selectedSection);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center"><Calendar className="w-6 h-6 text-indigo-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
            <p className="text-sm text-gray-500 font-medium">Create and manage class schedules</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={selectedSection} 
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none"
          >
            {sections.map(s => <option key={s.id} value={s.id}>Section {s.name} (Yr {s.year})</option>)}
          </select>
          <button 
            onClick={() => { setFormData({ ...formData, course_assignment_id: sectionAssignments[0]?.id || '' }); setIsModalOpen(true); }}
            className="flex items-center px-5 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
            disabled={!selectedSection || sectionAssignments.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Slot
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-6">
        {loading ? (
          <div className="text-center text-gray-500 p-8">Loading timetable...</div>
        ) : error ? (
          <div className="text-center text-red-500 p-8">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {DAYS.map(day => (
              <div key={day} className="space-y-3">
                <div className="text-center font-bold text-gray-700 uppercase tracking-wider text-xs pb-2 border-b border-gray-100">
                  {day}
                </div>
                {slots.filter(s => s.day === day).sort((a,b) => a.start_time.localeCompare(b.start_time)).map(slot => {
                  const details = getAssignmentDetails(slot.course_assignment_id);
                  return (
                    <div key={slot.id} className="relative bg-indigo-50 border border-indigo-100 rounded-xl p-3 group transition-all hover:shadow-md">
                      <div className="text-[10px] font-bold text-indigo-400 mb-1">{slot.start_time} - {slot.end_time}</div>
                      <div className="text-sm font-bold text-indigo-900 leading-tight mb-1">{details.courseName}</div>
                      <div className="text-xs font-medium text-indigo-600">{details.facultyName}</div>
                      {slot.room && <div className="text-[10px] text-gray-500 mt-1">Room: {slot.room}</div>}
                      <button 
                        onClick={() => handleDelete(slot.id)}
                        className="absolute top-2 right-2 p-1 bg-white text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Add Timetable Slot</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Subject / Faculty</label>
                <select required value={formData.course_assignment_id} onChange={(e) => setFormData({...formData, course_assignment_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary-500">
                  {sectionAssignments.map(a => {
                    const c = courses.find(x => x.id === a.course_id);
                    const f = faculty.find(x => x.id === a.faculty_id);
                    return <option key={a.id} value={a.id}>{c?.code} ({f?.first_name})</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Day</label>
                  <select required value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none">
                    {DAYS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Room</label>
                  <input type="text" placeholder="e.g. Lab 1" value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Start Time</label>
                  <input type="time" required value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">End Time</label>
                  <input type="time" required value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-sm">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
