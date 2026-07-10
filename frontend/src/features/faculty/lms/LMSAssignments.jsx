import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, FilePlus, Link as LinkIcon, ArrowLeft, Calendar, Save, Send, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react';

export const LMSAssignments = () => {
  const { assignmentId } = useParams();
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    description: '',
    external_link: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Specific assignment grading states
  const [gradingAssignment, setGradingAssignment] = useState(null);
  const [gradeRoster, setGradeRoster] = useState([]);
  const [maxMarks, setMaxMarks] = useState(100);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [publishingGrades, setPublishingGrades] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit/delete assignment states
  const [editingAssignment, setEditingAssignment] = useState(null);

  const assignments = resources.filter(r => r.resource_type === 'assignment');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axios.get(`/api/faculty/courses/${assignmentId}/resources`);
        setResources(response.data);
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, [assignmentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getAutoAssignmentTitle = () => {
    const num = assignments.length + 1;
    let suffix = 'th';
    if (num === 1) suffix = 'st';
    else if (num === 2) suffix = 'nd';
    else if (num === 3) suffix = 'rd';
    return `${num}${suffix} Assignment`;
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        title: formData.title,
        category: 'assignment',
        module_unit: '',
        description: `[Due: ${formData.due_date}]\n${formData.description}`,
        external_link: formData.external_link
      };

      const response = await axios.post(`/api/faculty/courses/${assignmentId}/resources`, payload);
      setResources([response.data, ...resources]);
      setFormData({
        title: '',
        due_date: '',
        description: '',
        external_link: ''
      });
      setMessage({ type: 'success', text: 'Assignment created successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setIsFormVisible(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to create assignment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (assignment) => {
    const dueMatch = assignment.description?.match(/\[Due:\s*(.+?)\]/);
    const dueDate = dueMatch ? dueMatch[1] : '';
    const cleanDesc = assignment.description?.replace(/\[Due:\s*(.+?)\]\n?/, '') || '';
    
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      due_date: dueDate,
      description: cleanDesc,
      external_link: assignment.external_link || ''
    });
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${assignment.title}"? This will also delete all student grades for this assignment.`)) return;
    try {
      await axios.delete(`/api/faculty/courses/${assignmentId}/resources/${assignment.id}`);
      setResources(prev => prev.filter(r => r.id !== assignment.id));
      setToast({ text: 'Assignment deleted successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ text: 'Failed to delete assignment', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        title: formData.title,
        category: 'assignment',
        module_unit: '',
        description: formData.due_date ? `[Due: ${formData.due_date}]\n${formData.description}` : formData.description,
        external_link: formData.external_link
      };

      const response = await axios.put(`/api/faculty/courses/${assignmentId}/resources/${editingAssignment.id}`, payload);
      setResources(prev => prev.map(r => r.id === editingAssignment.id ? response.data : r));
      setFormData({
        title: '',
        due_date: '',
        description: '',
        external_link: ''
      });
      setMessage({ type: 'success', text: 'Assignment updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setEditingAssignment(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update assignment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Specific Assignment Grading Handlers
  const handleGradeAssignment = async (assignment) => {
    setGradingAssignment(assignment);
    setLoadingRoster(true);
    try {
      const response = await axios.get(`/api/faculty/courses/${assignmentId}/assignments/${assignment.id}/grades`);
      setGradeRoster(response.data.roster.map(r => ({ ...r, _dirty: false })));
      if (response.data.roster.length > 0) {
        setMaxMarks(response.data.roster[0].max_marks);
      } else {
        setMaxMarks(100);
      }
    } catch (err) {
      console.error(err);
      setToast({ text: 'Failed to load student roster', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleMarksChange = (idx, val) => {
    setGradeRoster(prev => prev.map((r, i) =>
      i === idx ? { ...r, marks_obtained: val === '' ? null : Number(val), _dirty: true } : r
    ));
  };

  const handleRemarksChange = (idx, val) => {
    setGradeRoster(prev => prev.map((r, i) =>
      i === idx ? { ...r, remarks: val, _dirty: true } : r
    ));
  };

  const handleSaveGrades = async () => {
    setSavingGrades(true);
    try {
      await axios.post(`/api/faculty/courses/${assignmentId}/assignments/${gradingAssignment.id}/grades`, {
        max_marks: Number(maxMarks),
        entries: gradeRoster.map(r => ({
          student_id: r.student_id,
          marks_obtained: r.marks_obtained,
          is_absent: false,
          remarks: r.remarks
        }))
      });
      setToast({ text: 'Draft marks saved successfully!', type: 'success' });
      setGradeRoster(prev => prev.map(r => ({ ...r, _dirty: false })));
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ text: err.response?.data?.detail || 'Failed to save marks', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSavingGrades(false);
    }
  };

  const handlePublishGrades = async () => {
    if (!window.confirm(`Publish all marks for "${gradingAssignment.title}"? Students will be able to see them.`)) return;
    setPublishingGrades(true);
    try {
      // Save draft first
      await axios.post(`/api/faculty/courses/${assignmentId}/assignments/${gradingAssignment.id}/grades`, {
        max_marks: Number(maxMarks),
        entries: gradeRoster.map(r => ({
          student_id: r.student_id,
          marks_obtained: r.marks_obtained,
          is_absent: false,
          remarks: r.remarks
        }))
      });
      // Publish
      await axios.post(`/api/faculty/courses/${assignmentId}/assignments/${gradingAssignment.id}/grades/publish`);
      setToast({ text: 'Marks published successfully!', type: 'success' });
      setGradeRoster(prev => prev.map(r => ({ ...r, is_published: true, _dirty: false })));
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ text: err.response?.data?.detail || 'Failed to publish marks', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setPublishingGrades(false);
    }
  };

  // RENDER GRADING VIEW IF SELECTED
  if (gradingAssignment) {
    const dirtyCount = gradeRoster.filter(r => r._dirty).length;
    const isPublished = gradeRoster.some(r => r.is_published);
    
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
            ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.text}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => setGradingAssignment(null)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 font-medium mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Assignments List
            </button>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-purple-600" />
              Marks Entry: {gradingAssignment.title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter and publish assignment marks for the student roster.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSaveGrades}
              disabled={savingGrades || dirtyCount === 0}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" /> {savingGrades ? 'Saving...' : `Save Draft${dirtyCount ? ` (${dirtyCount})` : ''}`}
            </button>
            <button
              onClick={handlePublishGrades}
              disabled={publishingGrades}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" /> {publishingGrades ? 'Publishing...' : isPublished ? 'Re-Publish' : 'Publish Marks'}
            </button>
          </div>
        </div>

        {/* Max Marks Selector */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[13px] font-bold text-gray-700 uppercase tracking-wide mb-1">Set Maximum Marks</h3>
            <p className="text-xs text-gray-400">Specify the total marks for grading this assignment.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={1000}
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-24 text-center border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-bold text-gray-85"
            />
            <span className="text-sm font-semibold text-gray-500">marks</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loadingRoster ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left font-bold text-gray-600 w-12">#</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600 w-32">Reg. No.</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Student Name</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 w-36">Marks obtained</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 w-28">Status</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600 hidden md:table-cell">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gradeRoster.map((row, idx) => {
                    const passmark = maxMarks ? maxMarks * 0.4 : 40;
                    const passed = row.marks_obtained != null && row.marks_obtained >= passmark;
                    
                    return (
                      <tr key={row.student_id} className={`hover:bg-gray-50/50 transition-colors ${row._dirty ? 'bg-purple-50/10' : ''}`}>
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.register_number}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {row.first_name} {row.last_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={maxMarks || 100}
                            step={0.5}
                            value={row.marks_obtained ?? ''}
                            onChange={(e) => handleMarksChange(idx, e.target.value)}
                            className="w-20 text-center border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm
                                       focus:outline-none focus:ring-2 focus:ring-purple-300 font-semibold text-gray-800"
                            placeholder="—"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {row.marks_obtained == null ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-400">—</span>
                          ) : passed ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Pass</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Fail</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <input
                            type="text"
                            value={row.remarks || ''}
                            onChange={(e) => handleRemarksChange(idx, e.target.value)}
                            placeholder="Optional note..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs
                                       focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700"
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {gradeRoster.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 text-sm font-medium">
                        No students found in this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
          ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            to={`/faculty/courses/${assignmentId}/lms`} 
            className="text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-600" /> Course Assignments
            </h1>
            <p className="text-sm text-gray-500 mt-1">Create, manage, and track student assignments.</p>
          </div>
          {isFormVisible || editingAssignment ? (
            <button
              onClick={() => {
                setIsFormVisible(false);
                setEditingAssignment(null);
                setFormData({
                  title: '',
                  due_date: '',
                  description: '',
                  external_link: ''
                });
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => {
                setIsFormVisible(true);
                setFormData(prev => ({
                  ...prev,
                  title: getAutoAssignmentTitle()
                }));
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" /> Create Assignment
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Create / Edit Form Box */}
          {(isFormVisible || editingAssignment) && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                {editingAssignment ? `Edit Assignment: ${editingAssignment.title}` : 'Create New Assignment'}
              </h3>
              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={editingAssignment ? handleUpdateAssignment : handleAddAssignment} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Assignment Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Assignment 1: Web Development"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Due Date</label>
                    <input
                      type="date"
                      name="due_date"
                      required
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white text-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Instructions / Description</label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter detailed instructions for the students..."
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Submission Link / Form URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="url"
                    name="external_link"
                    value={formData.external_link}
                    onChange={handleInputChange}
                    placeholder="https://forms.google.com/... or Google Classroom link"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                  >
                    {editingAssignment ? 'Update Assignment' : 'Publish Assignment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Assignments */}
          <div className={(isFormVisible || editingAssignment) ? 'pt-4' : ''}>
            {assignments.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">No assignments have been published for this course yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {assignments.map((assignment) => {
                  const dueMatch = assignment.description?.match(/\[Due:\s*(.+?)\]/);
                  const dueDate = dueMatch ? dueMatch[1] : 'No due date';
                  const cleanDesc = assignment.description?.replace(/\[Due:\s*(.+?)\]\n?/, '');

                  // Check if overdue
                  const isOverdue = new Date(dueDate) < new Date(new Date().toDateString());

                  return (
                    <div key={assignment.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -z-10 group-hover:scale-150 transition-transform"></div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                            ASSIGNMENT
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                          Posted: {new Date(assignment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-purple-700 transition-colors">{assignment.title}</h4>
                      
                      {cleanDesc && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-grow">{cleanDesc}</p>
                      )}
                      
                      <div className="mt-auto space-y-4">
                        <div className={`flex items-center gap-2 text-sm font-semibold p-2.5 rounded-lg ${isOverdue ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                          <Calendar className="w-4 h-4" />
                          Due: {dueDate} {isOverdue && '(Overdue)'}
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGradeAssignment(assignment)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 py-2.5 rounded-xl transition-colors border border-purple-100 shadow-sm"
                          >
                            <ClipboardList className="w-3.5 h-3.5" /> Grade Book
                          </button>
                          
                          <button
                            onClick={() => handleEditClick(assignment)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-xl transition-colors border border-blue-100 shadow-sm"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteAssignment(assignment)}
                            className="flex items-center justify-center px-3 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 py-2.5 rounded-xl transition-colors border border-red-100 shadow-sm"
                            title="Delete Assignment"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
