import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link2, Plus, X, Trash2, ChevronRight, Folder, Calendar, Layers, Users, BookOpen, User } from 'lucide-react';

export const FacultyAssignment = () => {
  const [assignments, setAssignments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Drill-down states
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const yr = new Date().getFullYear();
  const [formData, setFormData] = useState({ faculty_id: '', course_id: '', section_id: '', academic_year: `${yr}-${yr+1}`, semester: 1 });
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aRes, fRes, cRes, sRes] = await Promise.all([
        axios.get('/api/hod/assignments'),
        axios.get('/api/hod/faculty'),
        axios.get('/api/hod/courses'),
        axios.get('/api/hod/sections')
      ]);
      setAssignments(aRes.data);
      setFaculty(fRes.data);
      setCourses(cRes.data);
      setSections(sRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.post('/api/hod/assignments', {
        ...formData,
        faculty_id: parseInt(formData.faculty_id),
        course_id: parseInt(formData.course_id),
        section_id: parseInt(formData.section_id),
        semester: parseInt(formData.semester)
      });
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create assignment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this course assignment?')) {
      try { await axios.delete(`/api/hod/assignments/${id}`); await fetchData(); }
      catch (err) { alert(err.response?.data?.detail || 'Failed to delete'); }
    }
  };

  const getName = (list, id, fields = ['first_name', 'last_name']) => {
    const item = list.find(i => i.id === id);
    if (!item) return `#${id}`;
    return `${item[fields[0]]} ${item[fields[1]]}`;
  };

  const getFacultyWorkload = (facultyId) => {
    return assignments.filter(a => a.faculty_id === facultyId).length;
  };

  const getWorkloadColor = (count) => {
    if (count <= 2) return 'bg-green-100 text-green-700 border-green-200';
    if (count <= 4) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const handleOpenModal = (course = null) => {
    setFormError(null);
    const initialCourseId = course ? course.id : (courses.filter(c => selectedSemester ? c.semester === selectedSemester : true)[0]?.id || '');
    const initialSectionId = selectedSection ? selectedSection.id : (sections[0]?.id || '');
    const initialSemester = selectedSemester ? selectedSemester : 1;
    
    setFormData({
      faculty_id: faculty[0]?.id || '',
      course_id: initialCourseId,
      section_id: initialSectionId,
      academic_year: `${yr}-${yr+1}`,
      semester: initialSemester
    });
    setIsModalOpen(true);
  };

  // Unique Years from Sections
  const availableYears = [...new Set(sections.map(s => s.year))].sort();

  // ----------------------------------------------------
  // Level 1: Year View
  // ----------------------------------------------------
  const renderYearView = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {availableYears.map(year => (
          <div 
            key={year}
            onClick={() => setSelectedYear(year)}
            className="bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 cursor-pointer hover:border-blue-300 hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] transition-all group flex flex-col items-center text-center h-full"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Folder className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Year {year}</h3>
            <p className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 mt-2">
              {sections.filter(s => s.year === year).length} Sections
            </p>
          </div>
        ))}
        {availableYears.length === 0 && !loading && !error && (
           <div className="col-span-full p-16 flex flex-col items-center justify-center text-center bg-white rounded-[24px] border border-gray-100">
             <h3 className="text-lg font-bold text-gray-900">No Sections Found</h3>
             <p className="text-gray-500 text-sm">Please create sections in the Section Management tab first.</p>
           </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // Level 2: Section & Semester View
  // ----------------------------------------------------
  const renderSectionView = () => {
    const yearSections = sections.filter(s => s.year === selectedYear);
    const semesters = [selectedYear * 2 - 1, selectedYear * 2]; // e.g. Year 2 -> Sem 3, 4

    return (
      <div className="space-y-8 mt-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Layers className="w-5 h-5 mr-2 text-indigo-600" /> Select Section</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {yearSections.map(sec => (
              <div 
                key={sec.id}
                onClick={() => setSelectedSection(sec)}
                className={`p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border cursor-pointer hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] transition-all group flex flex-col items-center text-center h-full ${selectedSection?.id === sec.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-100 hover:border-indigo-300'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${selectedSection?.id === sec.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Users className="w-6 h-6" />
                </div>
                <h3 className={`text-lg font-bold ${selectedSection?.id === sec.id ? 'text-indigo-900' : 'text-gray-900'}`}>Section {sec.name}</h3>
              </div>
            ))}
          </div>
        </div>

        {selectedSection && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-amber-600" /> Select Semester</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {semesters.map(sem => (
                <div 
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className="bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 cursor-pointer hover:border-amber-300 hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] transition-all group flex flex-col items-center text-center h-full"
                >
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Semester {sem}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // Level 3: Dual-Pane Smart Matrix
  // ----------------------------------------------------
  const renderSmartMatrix = () => {
    const semesterCourses = courses.filter(c => c.semester === selectedSemester);
    const sectionAssignments = assignments.filter(a => a.section_id === selectedSection.id && a.semester === selectedSemester);
    
    // Sort faculty by workload to highlight underutilized ones at top
    const facultyWithWorkload = faculty.map(f => ({
      ...f,
      workload: getFacultyWorkload(f.id)
    })).sort((a, b) => a.workload - b.workload);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
        {/* Left Pane: Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">Courses for Semester {selectedSemester}</h3>
            <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
              {sectionAssignments.length} / {semesterCourses.length} Assigned
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {semesterCourses.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-[24px] border border-gray-100 shadow-sm">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No courses found for this semester.</p>
              </div>
            ) : (
              semesterCourses.map(course => {
                const assignment = sectionAssignments.find(a => a.course_id === course.id);
                return (
                  <div key={course.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-[20px] border shadow-sm transition-all ${assignment ? 'bg-white border-gray-200' : 'bg-red-50/30 border-red-100 hover:border-red-300'}`}>
                    <div>
                      <h4 className="font-bold text-gray-900">{course.code} — {course.name}</h4>
                      <p className="text-sm text-gray-500 mt-1 capitalize">{course.course_type} • {course.credits} Credits</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      {assignment ? (
                        <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">{getName(faculty, assignment.faculty_id)}</span>
                          <button onClick={() => handleDelete(assignment.id)} className="ml-2 text-gray-400 hover:text-red-600 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => handleOpenModal(course)} className="flex items-center px-4 py-2 bg-white border-2 border-dashed border-red-200 text-red-600 text-sm font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors">
                          <Plus className="w-4 h-4 mr-2" /> Assign
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Faculty Roster */}
        <div className="lg:col-span-1 bg-white rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden sticky top-6">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Faculty Roster</h3>
            <p className="text-xs text-gray-500 mt-1">Check live workload before assigning</p>
          </div>
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {facultyWithWorkload.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {f.first_name[0]}{f.last_name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{f.first_name} {f.last_name}</h4>
                    <p className="text-xs text-gray-500">{f.designation}</p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${getWorkloadColor(f.workload)}`}>
                  {f.workload} {f.workload === 1 ? 'Course' : 'Courses'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center"><Link2 className="w-6 h-6 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Course Assignment</h1>
            <p className="text-sm text-gray-500 font-medium">Distribute workload strategically</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Manual Assignment
        </button>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-2 text-sm font-medium overflow-x-auto">
        <button onClick={() => { setSelectedYear(null); setSelectedSection(null); setSelectedSemester(null); }} className={`flex items-center whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${!selectedYear ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
          <Folder className="w-4 h-4 mr-2" /> All Years
        </button>
        {selectedYear && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <button onClick={() => { setSelectedSection(null); setSelectedSemester(null); }} className={`flex items-center whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${!selectedSection && selectedYear ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Users className="w-4 h-4 mr-2" /> Year {selectedYear}
            </button>
          </>
        )}
        {selectedSection && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <button onClick={() => setSelectedSemester(null)} className={`flex items-center whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors ${!selectedSemester && selectedSection ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Layers className="w-4 h-4 mr-2" /> Section {selectedSection.name}
            </button>
          </>
        )}
        {selectedSemester && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <div className="flex items-center whitespace-nowrap px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 font-bold">
              <Calendar className="w-4 h-4 mr-2" /> Semester {selectedSemester}
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="p-8 text-center bg-white rounded-[24px] text-red-500 font-bold shadow-sm border border-red-100 mt-6">{error}</div>
      ) : loading ? (
        <div className="p-8 text-center bg-white rounded-[24px] text-gray-500 font-bold shadow-sm border border-gray-100 mt-6">Loading...</div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {!selectedYear && renderYearView()}
          {selectedYear && !selectedSemester && renderSectionView()}
          {selectedSemester && renderSmartMatrix()}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">New Course Assignment</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">{formError}</div>}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex justify-between items-center">
                  <span>Faculty</span>
                  <span className="text-primary-600 normal-case font-medium text-[11px] bg-primary-50 px-2 py-0.5 rounded-md">Check roster for workloads</span>
                </label>
                <select required value={formData.faculty_id} onChange={(e) => setFormData({...formData, faculty_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {faculty.map(f => {
                     const load = getFacultyWorkload(f.id);
                     return <option key={f.id} value={f.id}>{f.first_name} {f.last_name} ({load} assigned)</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Course</label>
                <select required value={formData.course_id} onChange={(e) => setFormData({...formData, course_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {courses.filter(c => selectedSemester ? c.semester === selectedSemester : true).map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Section</label>
                <select required value={formData.section_id} onChange={(e) => setFormData({...formData, section_id: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none">
                  {sections.map(s => <option key={s.id} value={s.id}>Section {s.name} (Year {s.year}, {s.batch})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Academic Year</label>
                  <input type="text" required value={formData.academic_year} onChange={(e) => setFormData({...formData, academic_year: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Semester</label>
                  <input type="number" required min="1" max="8" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
                  {formLoading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
