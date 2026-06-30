import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Link as LinkIcon, BookOpen, Layers, Settings, FilePlus, Users, CheckCircle, XCircle, Save } from 'lucide-react';

export const LMSManager = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resources');

  // Data state
  const [courseDetails, setCourseDetails] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'notes',
    module_unit: '',
    description: '',
    external_link: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isUploadFormVisible, setIsUploadFormVisible] = useState(false);

  // Assignment Form state
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: '',
    due_date: '',
    description: '',
    external_link: ''
  });
  const [isAssignmentSubmitting, setIsAssignmentSubmitting] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState({ type: '', text: '' });
  const [isAssignmentFormVisible, setIsAssignmentFormVisible] = useState(false);

  // Announcement Form state
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    content: '',
    priority: 'Important Notice'
  });
  const [isAnnouncementSubmitting, setIsAnnouncementSubmitting] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState({ type: '', text: '' });
  const [isAnnouncementFormVisible, setIsAnnouncementFormVisible] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course details (from all assignments)
        const coursesRes = await axios.get('/api/faculty/me/courses');
        setAllCourses(coursesRes.data);
        const currentCourse = coursesRes.data.find(c => c.id.toString() === assignmentId);
        if (currentCourse) setCourseDetails(currentCourse);

        // Fetch resources
        const resourcesRes = await axios.get(`/api/faculty/courses/${assignmentId}/resources`);
        setResources(resourcesRes.data);

        // Fetch announcements
        const announcementsRes = await axios.get(`/api/faculty/courses/${assignmentId}/announcements`);
        setAnnouncements(announcementsRes.data);
      } catch (err) {
        console.error("Failed to fetch LMS data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`/api/faculty/courses/${assignmentId}/resources`, formData);
      setResources([response.data, ...resources]);
      setFormData({
        title: '',
        category: 'notes',
        module_unit: '',
        description: '',
        external_link: ''
      });
      setMessage({ type: 'success', text: 'Resource added successfully!' });

      // clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setIsUploadFormVisible(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to add resource. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignmentInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    setIsAssignmentSubmitting(true);
    setAssignmentMessage({ type: '', text: '' });

    try {
      const payload = {
        title: assignmentFormData.title,
        category: 'assignment',
        module_unit: '',
        description: `[Due: ${assignmentFormData.due_date}]\n${assignmentFormData.description}`,
        external_link: assignmentFormData.external_link
      };

      const response = await axios.post(`/api/faculty/courses/${assignmentId}/resources`, payload);
      setResources([response.data, ...resources]);
      setAssignmentFormData({
        title: '',
        due_date: '',
        description: '',
        external_link: ''
      });
      setAssignmentMessage({ type: 'success', text: 'Assignment created successfully!' });
      
      setTimeout(() => setAssignmentMessage({ type: '', text: '' }), 3000);
      setIsAssignmentFormVisible(false);
    } catch (err) {
      console.error(err);
      setAssignmentMessage({ type: 'error', text: 'Failed to create assignment. Please try again.' });
    } finally {
      setIsAssignmentSubmitting(false);
    }
  };

  const handleAnnouncementInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    setIsAnnouncementSubmitting(true);
    setAnnouncementMessage({ type: '', text: '' });

    try {
      const payload = {
        title: `[${announcementFormData.priority}] ${announcementFormData.title}`,
        content: announcementFormData.content,
        is_global: false
      };

      const response = await axios.post(`/api/faculty/courses/${assignmentId}/announcements`, payload);
      setAnnouncements([response.data, ...announcements]);
      setAnnouncementFormData({
        title: '',
        content: '',
        priority: 'Important Notice'
      });
      setAnnouncementMessage({ type: 'success', text: 'Announcement published successfully!' });
      
      setTimeout(() => setAnnouncementMessage({ type: '', text: '' }), 3000);
      setIsAnnouncementFormVisible(false);
    } catch (err) {
      console.error(err);
      setAnnouncementMessage({ type: 'error', text: 'Failed to publish announcement. Please try again.' });
    } finally {
      setIsAnnouncementSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">LMS Course Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Upload resources, publish announcements, manage attendance and grade student submissions</p>
        </div>
        {allCourses.length > 0 && courseDetails && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm relative overflow-hidden">
            <select
              value={assignmentId}
              onChange={(e) => navigate(`/faculty/courses/${e.target.value}/lms`)}
              className="w-full h-full px-4 py-2.5 appearance-none font-semibold text-gray-800 text-sm bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer pr-10"
            >
              {allCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course.code} - {c.course.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'resources' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Resources
          </div>
          {activeTab === 'resources' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-600 rounded-t"></div>}
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'assignments' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Assignments
          </div>
          {activeTab === 'assignments' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-600 rounded-t"></div>}
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'announcements' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" /> Announcements
          </div>
          {activeTab === 'announcements' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-600 rounded-t"></div>}
        </button>
        <button
          disabled
          className="pb-3 font-semibold text-sm text-gray-400 cursor-not-allowed flex items-center gap-2"
          title="Coming soon"
        >
          <Settings className="w-4 h-4 text-blue-400" /> Syllabus
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 font-semibold text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'attendance' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="w-4 h-4" /> Attendance
          {activeTab === 'attendance' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-600 rounded-t"></div>}
        </button>
        <button
          onClick={() => setActiveTab('att-history')}
          className={`pb-3 font-semibold text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'att-history' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FileText className="w-4 h-4" /> Att. History
          {activeTab === 'att-history' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary-600 rounded-t"></div>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-4">

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Course Syllabus Resources</h2>
              {isUploadFormVisible ? (
                <button
                  onClick={() => setIsUploadFormVisible(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setIsUploadFormVisible(true)}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
                >
                  + Upload Resource
                </button>
              )}
            </div>

            {/* Upload Form Box */}
            {isUploadFormVisible && (
              <div className="bg-[#f8fbfd] border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">Upload Course Resource</h3>



                {message.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleAddResource} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Title / Label</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Lab Manual 1 - Intro to Socket Programming"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                      >
                        <option value="notes">Presentation Slides / Notes</option>
                        <option value="reference">Reference Material</option>
                        <option value="video">Video Link</option>
                        <option value="syllabus">Syllabus</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Syllabus Module / Unit</label>
                      <input
                        type="text"
                        name="module_unit"
                        value={formData.module_unit}
                        onChange={handleInputChange}
                        placeholder="General"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Short Description / Guidance</label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter brief student guidance..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">External Drive / Resource URL</label>
                    <input
                      type="url"
                      name="external_link"
                      required
                      value={formData.external_link}
                      onChange={handleInputChange}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                    >
                      <FilePlus className="w-4 h-4" /> Add Resource
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Resources */}
            <div className={`mt-8 ${isUploadFormVisible ? 'border-t border-gray-200 border-dashed pt-8' : ''}`}>
              {(() => {
                const filteredResources = resources.filter(r => r.resource_type !== 'assignment');
                return (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Uploaded Resources ({filteredResources.length})</h3>

                    {filteredResources.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500 text-sm">No resources have been uploaded for this course yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredResources.map((resource) => (
                          <div key={resource.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                            {resource.resource_type}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-[15px]">{resource.title}</h4>
                        {resource.description && (
                          <p className="text-sm text-gray-500 mt-1">{resource.description}</p>
                        )}
                      </div>
                      <div>
                        <a
                          href={resource.external_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg"
                        >
                          <LinkIcon className="w-4 h-4" /> Open Link
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
                  </>
                );
              })()}
            </div>

          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Course Assignments</h2>
              {isAssignmentFormVisible ? (
                <button
                  onClick={() => setIsAssignmentFormVisible(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setIsAssignmentFormVisible(true)}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
                >
                  + Create Assignment
                </button>
              )}
            </div>

            {/* Assignment Form Box */}
            {isAssignmentFormVisible && (
              <div className="bg-[#fcf8fd] border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">Create New Assignment</h3>

                {assignmentMessage.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${assignmentMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {assignmentMessage.text}
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
                        value={assignmentFormData.title}
                        onChange={handleAssignmentInputChange}
                        placeholder="e.g. Assignment 1: Web Development"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Due Date</label>
                      <input
                        type="date"
                        name="due_date"
                        required
                        value={assignmentFormData.due_date}
                        onChange={handleAssignmentInputChange}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Instructions / Description</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      value={assignmentFormData.description}
                      onChange={handleAssignmentInputChange}
                      placeholder="Enter detailed instructions for the students..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Submission Link / Form URL <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input
                      type="url"
                      name="external_link"
                      value={assignmentFormData.external_link}
                      onChange={handleAssignmentInputChange}
                      placeholder="https://forms.google.com/... or Google Classroom link"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAssignmentSubmitting}
                      className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                    >
                      <FilePlus className="w-4 h-4" /> Publish Assignment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Assignments */}
            <div className={`mt-8 ${isAssignmentFormVisible ? 'border-t border-gray-200 border-dashed pt-8' : ''}`}>
              {(() => {
                const filteredAssignments = resources.filter(r => r.resource_type === 'assignment');
                return (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Published Assignments ({filteredAssignments.length})</h3>

                    {filteredAssignments.length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500 text-sm">No assignments have been published for this course yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredAssignments.map((assignment) => {
                          const dueMatch = assignment.description?.match(/\[Due:\s*(.+?)\]/);
                          const dueDate = dueMatch ? dueMatch[1] : 'No due date';
                          const cleanDesc = assignment.description?.replace(/\[Due:\s*(.+?)\]\n?/, '');

                          return (
                            <div key={assignment.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
                                    ASSIGNMENT
                                  </span>
                                  {dueMatch && (
                                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                      Due: {dueDate}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400 font-medium">
                                    Posted: {new Date(assignment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-[15px]">{assignment.title}</h4>
                                {cleanDesc && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cleanDesc}</p>
                                )}
                              </div>
                              <div>
                                {assignment.external_link && (
                                <a
                                  href={assignment.external_link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg whitespace-nowrap"
                                >
                                  <LinkIcon className="w-4 h-4" /> View / Submit Link
                                </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Course Announcements Feed</h2>
              {isAnnouncementFormVisible ? (
                <button
                  onClick={() => setIsAnnouncementFormVisible(false)}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setIsAnnouncementFormVisible(true)}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
                >
                  + Create Announcement
                </button>
              )}
            </div>

            {/* Announcement Form Box */}
            {isAnnouncementFormVisible && (
              <div className="bg-[#f8fbfd] border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">New Announcements Memo</h3>

                {announcementMessage.text && (
                  <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${announcementMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {announcementMessage.text}
                  </div>
                )}

                <form onSubmit={handleAddAnnouncement} className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Subject Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={announcementFormData.title}
                      onChange={handleAnnouncementInputChange}
                      placeholder="e.g. Schedule Change: Extra Lecture on Friday"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Announcement Memo Body</label>
                    <textarea
                      name="content"
                      required
                      rows={4}
                      value={announcementFormData.content}
                      onChange={handleAnnouncementInputChange}
                      placeholder="Write announcement details here..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Priority Tag</label>
                    <select
                      name="priority"
                      value={announcementFormData.priority}
                      onChange={handleAnnouncementInputChange}
                      className="w-full md:w-1/2 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                      <option value="Important Notice">Important Notice</option>
                      <option value="General Update">General Update</option>
                      <option value="Reminder">Reminder</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAnnouncementSubmitting}
                      className="bg-[#059669] hover:bg-[#047857] text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                    >
                      Publish Announcement
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Announcements */}
            <div className={`mt-8 ${isAnnouncementFormVisible ? 'border-t border-gray-200 border-dashed pt-8' : ''}`}>
              {announcements.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                  <p className="text-gray-500 text-sm">No announcements posted to this syllabus channel yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => {
                    const priorityMatch = announcement.title.match(/^\[(.*?)\]\s*(.*)$/);
                    const priority = priorityMatch ? priorityMatch[1] : 'Announcement';
                    const title = priorityMatch ? priorityMatch[2] : announcement.title;

                    let badgeColor = "bg-gray-100 text-gray-700";
                    if (priority === 'Important Notice') badgeColor = "bg-orange-100 text-orange-700";
                    else if (priority === 'Urgent') badgeColor = "bg-red-100 text-red-700";
                    else if (priority === 'Reminder') badgeColor = "bg-blue-100 text-blue-700";
                    else if (priority === 'General Update') badgeColor = "bg-green-100 text-green-700";

                    return (
                      <div key={announcement.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${badgeColor}`}>
                            {priority}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(announcement.created_at).toLocaleDateString()} at {new Date(announcement.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-base mb-2">{title}</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <AttendanceTab assignmentId={assignmentId} />
        )}

        {/* ATTENDANCE HISTORY TAB */}
        {activeTab === 'att-history' && (
          <AttendanceHistory assignmentId={assignmentId} />
        )}

      </div>
    </div>
  );
};

// ── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab({ assignmentId }) {
  const today = new Date().toISOString().split('T')[0];
  const [data, setData]         = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    axios.get(`/api/faculty/courses/${assignmentId}/attendance-slots`)
      .then(r => {
        setData(r.data);
        setStudents(r.data.students);
      })
      .catch(() => setError('Failed to load attendance data'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const toggle = (studentId) => {
    setSaved(false);
    setStudents(prev => prev.map(s =>
      s.id !== studentId ? s : { ...s, status: s.status === 'present' ? 'absent' : 'present' }
    ));
  };

  const markAll = (status) => {
    setSaved(false);
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find the currently active slot to pass its start_time
      const activeSlot = data?.today_slots?.find(s => s.is_active);
      await axios.post(`/api/faculty/courses/${assignmentId}/attendance`, {
        slot_start_time: activeSlot?.start_time || null,
        records: students.filter(s => s.status).map(s => ({ student_id: s.id, status: s.status }))
      });
      setSaved(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>;
  if (error)   return <div className="py-16 text-center text-red-500 text-sm">{error}</div>;

  const presentCount   = students.filter(s => s.status === 'present').length;
  const absentCount    = students.filter(s => s.status === 'absent').length;
  const unmarked       = students.filter(s => !s.status).length;
  const hasSlotToday   = data?.today_slots?.length > 0;
  // Allow marking if at least one slot today has started
  const canMark        = data?.today_slots?.some(s => s.is_active);
  // Active slot label for display
  const activeSlot     = data?.today_slots?.find(s => s.is_current);
  const nextSlot       = data?.today_slots?.find(s => !s.is_active);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Course info + period status */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">{data.course_code} — {data.course_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">Section: {data.section} &nbsp;·&nbsp; {today}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!hasSlotToday ? (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">
                No class scheduled today ({data.today_day?.toUpperCase()})
              </span>
            ) : (
              data.today_slots.map(slot => (
                <span
                  key={slot.id}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    slot.is_current ? 'bg-green-100 text-green-700 ring-1 ring-green-400' :
                    slot.is_active  ? 'bg-indigo-50 text-indigo-700' :
                    'bg-gray-100 text-gray-400'
                  }`}
                >
                  {slot.start_time}–{slot.end_time}
                  {slot.room ? ` · ${slot.room}` : ''}
                  {slot.is_current ? ' ● Now' : slot.is_active ? ' ✓ Started' : ' ⏳ Upcoming'}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Lock message */}
        {hasSlotToday && !canMark && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
            ⏳ Attendance will unlock when the period starts
            {nextSlot && ` at ${nextSlot.start_time}`}.
          </div>
        )}
      </div>

      {/* Mark controls — only shown if period has started */}
      {hasSlotToday && canMark && students.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
            <CheckCircle className="w-4 h-4" /> {presentCount} Present
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-bold">
            <XCircle className="w-4 h-4" /> {absentCount} Absent
          </div>
          {unmarked > 0 && (
            <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm font-bold">
              {unmarked} Unmarked
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={() => markAll('present')} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-lg hover:bg-green-200 transition-colors">
              All Present
            </button>
            <button onClick={() => markAll('absent')} className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-colors">
              All Absent
            </button>
          </div>
        </div>
      )}

      {/* Student list */}
      {students.length === 0 ? (
        <div className="py-12 text-center text-gray-400 bg-white rounded-xl border border-gray-100">
          <Users className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium">No students found in this section.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {students.map((s, idx) => {
            const isPresent = s.status === 'present';
            const isAbsent  = s.status === 'absent';
            return (
              <div key={s.id} className="flex items-center px-4 py-3 gap-3">
                <span className="text-xs font-bold text-gray-300 w-5 text-right flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{s.first_name} {s.last_name}</p>
                  <p className="text-xs font-mono text-gray-400">{s.register_number}</p>
                </div>
                {/* Show toggle only if period has started, else show read-only badge */}
                {hasSlotToday && canMark ? (
                  <button
                    onClick={() => toggle(s.id)}
                    className={`w-24 py-1.5 rounded-xl text-xs font-extrabold flex-shrink-0 transition-colors ${
                      isPresent ? 'bg-green-500 text-white' :
                      isAbsent  ? 'bg-red-500 text-white'   :
                      'bg-gray-100 text-gray-400 border border-dashed border-gray-300'
                    }`}
                  >
                    {isPresent ? '✓ Present' : isAbsent ? '✕ Absent' : 'Tap'}
                  </button>
                ) : (
                  <span className={`w-24 py-1.5 rounded-xl text-xs font-bold text-center flex-shrink-0 ${
                    isPresent ? 'bg-green-50 text-green-700' :
                    isAbsent  ? 'bg-red-50 text-red-700'    :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isPresent ? 'Present' : isAbsent ? 'Absent' : '—'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save */}
      {hasSlotToday && canMark && students.length > 0 && (
        <div className="flex items-center justify-end gap-4 pt-2">
          {saved && <span className="text-sm font-semibold text-green-600">✓ Saved</span>}
          <button
            onClick={handleSave}
            disabled={saving || unmarked === students.length}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : `Save · ${presentCount}P ${absentCount}A`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Attendance History ────────────────────────────────────────────────────────
function AttendanceHistory({ assignmentId }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null); // date string of expanded row

  useEffect(() => {
    axios.get(`/api/faculty/courses/${assignmentId}/attendance-history`)
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load attendance history'))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  if (loading) return <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>;
  if (error)   return <div className="py-16 text-center text-red-500 text-sm">{error}</div>;

  const { history, course_code, course_name, section, total_students } = data;

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">{course_code} — {course_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">Section: {section} &nbsp;·&nbsp; {history.length} class day{history.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg">
          {total_students} Students
        </span>
      </div>

      {history.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-gray-100">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">No attendance recorded yet for this course.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(entry => {
            const pct        = total_students > 0 ? Math.round((entry.present / total_students) * 100) : 0;
            const entryKey   = `${entry.date}-${entry.hour}`;
            const isExpanded = expanded === entryKey;
            const barColor   = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400';
            const dateLabel  = new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

            return (
              <div key={entryKey} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Summary row — click to expand */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : entryKey)}
                  className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{dateLabel}</p>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">{entry.hour_label}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg">{entry.present}P</span>
                    <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg">{entry.absent}A</span>
                    <span className={`text-gray-400 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                  </div>
                </button>

                {/* Expanded student list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {entry.records.map(r => (
                      <div key={r.student_id} className="flex items-center px-4 py-2.5 gap-3">
                        <span className="text-xs font-mono text-gray-400 flex-shrink-0 w-24">{r.register_number}</span>
                        <span className="text-sm font-medium text-gray-800 flex-1 truncate">{r.name}</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                          r.status === 'present' ? 'bg-green-50 text-green-700' :
                          r.status === 'absent'  ? 'bg-red-50 text-red-700'    :
                          'bg-gray-100 text-gray-400'
                        }`}>
                          {r.status === 'present' ? 'Present' : r.status === 'absent' ? 'Absent' : r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
