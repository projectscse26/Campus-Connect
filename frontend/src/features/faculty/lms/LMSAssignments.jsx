import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, FilePlus, Link as LinkIcon, ArrowLeft, Calendar } from 'lucide-react';

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

  const assignments = resources.filter(r => r.resource_type === 'assignment');

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
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
          {isFormVisible ? (
            <button
              onClick={() => setIsFormVisible(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setIsFormVisible(true)}
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
          {/* Create Form Box */}
          {isFormVisible && (
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Create New Assignment</h3>
              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleAddAssignment} className="space-y-5">
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
                    <FilePlus className="w-4 h-4" /> Publish Assignment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Assignments */}
          <div className={isFormVisible ? 'pt-4' : ''}>
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
                        
                        {assignment.external_link && (
                          <a
                            href={assignment.external_link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center w-full gap-2 text-sm font-bold text-white bg-gray-900 hover:bg-black py-2.5 rounded-xl transition-colors shadow-sm"
                          >
                            <LinkIcon className="w-4 h-4" /> View / Submit Here
                          </a>
                        )}
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
