import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, FilePlus, Link as LinkIcon, ArrowLeft } from 'lucide-react';

export const LMSResources = () => {
  const { assignmentId } = useParams();
  
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axios.get(`/api/faculty/courses/${assignmentId}/resources`);
        setResources(response.data);
      } catch (err) {
        console.error("Failed to fetch resources:", err);
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
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      setIsUploadFormVisible(false);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to add resource. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredResources = resources.filter(r => r.resource_type !== 'assignment');

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            to={`/faculty/courses/${assignmentId}/lms`} 
            className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" /> Course Resources
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage slides, notes, and external links for your course.</p>
          </div>
          {isUploadFormVisible ? (
            <button
              onClick={() => setIsUploadFormVisible(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setIsUploadFormVisible(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" /> Upload Resource
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upload Form Box */}
          {isUploadFormVisible && (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Upload New Resource</h3>
              {message.text && (
                <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
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
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
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
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
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
          <div className={isUploadFormVisible ? 'pt-4' : ''}>
            {filteredResources.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">No resources have been uploaded for this course yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResources.map((resource) => (
                  <div key={resource.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between h-full group">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-bold px-2 py-0.5 rounded uppercase">
                          {resource.resource_type}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-1 group-hover:text-blue-700 transition-colors">{resource.title}</h4>
                      {resource.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{resource.description}</p>
                      )}
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <a
                        href={resource.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" /> Open Resource Link
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
