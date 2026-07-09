import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Save, Plus, Trash2, ClipboardList, CheckCircle2, 
  AlertTriangle, Calendar, BookOpen, Clock, FileText, Settings, Users
} from 'lucide-react';

export const LMSSyllabus = () => {
  const { assignmentId } = useParams();
  
  const [topics, setTopics] = useState([]);
  const [courseDetails, setCourseDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // View state: "selection" (landing), "write" (planning sheet), or "record" (coverage sheet)
  const [viewMode, setViewMode] = useState("selection");



  useEffect(() => {
    fetchPlan();
    fetchCourseDetails();
  }, [assignmentId]);

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/course-plan/${assignmentId}`);
      const fetchedTopics = response.data.topics || [];
      setTopics(fetchedTopics);
    } catch (err) {
      console.error("Failed to fetch course plan:", err);
      setError("Failed to load course plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const response = await axios.get('/api/faculty/me/courses');
      const currentCourse = response.data.find(c => c.id.toString() === assignmentId);
      if (currentCourse) {
        setCourseDetails(currentCourse);
      }
    } catch (err) {
      console.error("Failed to fetch course details:", err);
    }
  };

  // Save changes to backend
  const savePlanToBackend = async (updatedTopics = topics) => {
    setSaving(true);
    setSuccessMessage(null);
    setError(null);

    // Validation: proposed date vs actual date deviation reason
    const errors = updatedTopics.filter(t => {
      if (t.actual_date && t.proposed_date) {
        const actualStr = t.actual_date.split('T')[0];
        const proposedStr = t.proposed_date.split('T')[0];
        if (actualStr !== proposedStr) {
          return !t.reason_for_deviation || t.reason_for_deviation.trim() === "";
        }
      }
      return false;
    });

    if (errors.length > 0) {
      alert(`Cannot save! There are ${errors.length} topic(s) where Actual Date differs from Proposed Date but no Reason for Deviation is provided.`);
      setSaving(false);
      return false;
    }

    try {
      const payloadTopics = updatedTopics.map(t => {
        // Automatically clear reason if dates match
        let finalReason = t.reason_for_deviation || "";
        if (t.actual_date && t.proposed_date) {
          const actualStr = t.actual_date.split('T')[0];
          const proposedStr = t.proposed_date.split('T')[0];
          if (actualStr === proposedStr) {
            finalReason = "";
          }
        }
        return {
          ...t,
          reason_for_deviation: finalReason,
          is_signed: !!t.actual_date
        };
      });

      const response = await axios.post(`/api/course-plan/${assignmentId}`, { topics: payloadTopics });
      setTopics(response.data.topics || []);
      setSuccessMessage("Changes saved successfully!");
      return true;
    } catch (err) {
      console.error("Failed to save plan:", err);
      setError(err.response?.data?.detail || "Failed to save the plan. Please check validations.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add new topic row (Write Mode)
  const addRow = () => {
    setSuccessMessage(null);
    const newSeq = topics.length + 1;
    const lastRow = topics[topics.length - 1];
    
    let proposedDateStr = new Date().toISOString().split('T')[0];
    if (lastRow && lastRow.proposed_date) {
      const lastDate = new Date(lastRow.proposed_date);
      lastDate.setDate(lastDate.getDate() + 2);
      proposedDateStr = lastDate.toISOString().split('T')[0];
    }

    setTopics(prev => [
      ...prev,
      {
        sequence_no: newSeq,
        proposed_date: proposedDateStr,
        hours: 1,
        unit: lastRow ? lastRow.unit : "1",
        topic: "",
        cognitive_level: "K1",
        mode_of_delivery: "BB",
        actual_date: null,
        reason_for_deviation: "",
        is_signed: false
      }
    ]);
  };

  // Delete topic row (Write Mode)
  const removeRow = (index) => {
    setSuccessMessage(null);
    setTopics(prev => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((t, idx) => ({ ...t, sequence_no: idx + 1 }));
    });
  };

  // Edit fields inline in tables by sequence number
  const handleRowChange = (sequenceNo, field, value) => {
    setSuccessMessage(null);
    setTopics(prev => prev.map(t => {
      if (t.sequence_no !== sequenceNo) return t;
      const updated = { ...t, [field]: value };
      
      if (field === 'actual_date' && !value) {
        updated.is_signed = false;
        updated.reason_for_deviation = "";
      }
      
      // Clear deviation reason if actual date matches proposed date
      if (field === 'actual_date' && value && t.proposed_date) {
        const actualStr = value.split('T')[0];
        const proposedStr = t.proposed_date.split('T')[0];
        if (actualStr === proposedStr) {
          updated.reason_for_deviation = "";
        }
      }

      return updated;
    }));
  };

  // Filter topics for Record table (Only show covered ones)
  const coveredTopics = topics.filter(t => t.actual_date !== null && t.actual_date !== "");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const courseCode = courseDetails?.course?.code || "N/A";
  const courseTitle = courseDetails?.course?.name || "N/A";

  // 1. LANDING DASHBOARD CARD VIEW
  if (viewMode === "selection") {
    return (
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 lg:p-8">
        
        {/* Breadcrumb Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              to={`/faculty/courses/${assignmentId}/lms`} 
              className="text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Courses
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Lesson Plan</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage lesson planning and coverage records</p>
        </div>

        {/* Selection Cards (mockup styling matching Course Dashboard) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl pt-4">
          
          {/* Card 1: Write Lesson Plan */}
          <div
            onClick={() => setViewMode("write")}
            className="group flex flex-col bg-white border-2 border-gray-100 rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-orange-300 hover:shadow-orange-100 cursor-pointer relative overflow-hidden"
          >
            {/* Background blob */}
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-orange-50 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-5 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">
              Write Lesson Plan
            </h3>
            
            <p className="text-gray-500 text-sm font-medium leading-relaxed relative z-10">
              Plan topics, record proposed dates, and schedule Units to make them available in the daily attendance page.
            </p>
            
            <div className="mt-auto pt-6 flex items-center text-sm font-bold text-gray-400 group-hover:text-gray-950 transition-colors relative z-10">
              Manage Write Lesson Plan <ArrowLeft className="w-4 h-4 ml-1 rotate-180 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Card 2: Coverage Record */}
          <div
            onClick={() => setViewMode("record")}
            className="group flex flex-col bg-white border-2 border-gray-100 rounded-2xl p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-green-300 hover:shadow-green-100 cursor-pointer relative overflow-hidden"
          >
            {/* Background blob */}
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 bg-green-50 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            
            <div className="w-14 h-14 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mb-5 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10">
              Coverage Record
            </h3>
            
            <p className="text-gray-500 text-sm font-medium leading-relaxed relative z-10">
              View work done progress. The covered dates log automatically from Daily Attendance, allowing manual entry of deviation reasons.
            </p>
            
            <div className="mt-auto pt-6 flex items-center text-sm font-bold text-gray-400 group-hover:text-gray-950 transition-colors relative z-10">
              Manage Coverage Records <ArrowLeft className="w-4 h-4 ml-1 rotate-180 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

        </div>

      </div>
    );
  }

  // 2. WORKSHEET ACTIVE VIEWS (WRITE & RECORD TABLES)
  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
      
      {/* Small Back to Selection breadcrumb */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button 
          onClick={() => { setViewMode("selection"); setSuccessMessage(null); setError(null); }}
          className="text-gray-600 hover:text-primary-600 flex items-center gap-1 text-sm font-bold transition-colors focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Selection Mode
        </button>
        <span className="text-xs font-bold text-gray-400">Course Plan</span>
      </div>

      {/* Simplified Header Title and Metadata */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-955 tracking-tight flex items-center gap-2">
          {viewMode === "write" ? "Write Lesson Plan" : "Coverage Record (Work Done)"}
        </h1>
        <p className="text-xs font-semibold text-gray-500 mt-1">
          Course: <span className="font-mono text-gray-800">{courseCode}</span> &nbsp;·&nbsp; <span className="uppercase text-gray-800">{courseTitle}</span>
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> {successMessage}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600" /> {error}
        </div>
      )}

      {/* ── WRITE TABLE ── */}
      {viewMode === "write" && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Lesson Plan Sheet</span>
            <span className="text-xs text-gray-400 font-medium">* Fill out proposed dates, period, units and topics below</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-300 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase">
                  <th className="py-2.5 px-3 w-16 text-center border-r border-gray-300">S.No.</th>
                  <th className="py-2.5 px-3 w-40 border-r border-gray-300">Proposed Date</th>
                  <th className="py-2.5 px-3 w-32 border-r border-gray-300">Hour / Period</th>
                  <th className="py-2.5 px-3 w-28 border-r border-gray-300">Unit</th>
                  <th className="py-2.5 px-4 border-r border-gray-300">Topic(s)</th>
                  <th className="py-2.5 px-3 w-28 border-r border-gray-300">COs</th>
                  <th className="py-2.5 px-3 w-44 border-r border-gray-300">Mode of Delivery</th>
                  <th className="py-2.5 px-2 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {topics.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    
                    {/* S.No */}
                    <td className="py-2 px-3 text-center font-bold text-gray-500 border-r border-gray-200 bg-gray-50/50">
                      {t.sequence_no}
                    </td>

                    {/* Proposed Date */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <input
                        type="date"
                        value={t.proposed_date ? t.proposed_date.split('T')[0] : ""}
                        onChange={(e) => handleRowChange(t.sequence_no, 'proposed_date', e.target.value || null)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </td>

                    {/* Hour / Period Dropdown */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <select
                        value={t.hours}
                        onChange={(e) => handleRowChange(t.sequence_no, 'hours', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white text-gray-800"
                      >
                        <option value={1}>1st Hour</option>
                        <option value={2}>2nd Hour</option>
                        <option value={3}>3rd Hour</option>
                        <option value={4}>4th Hour</option>
                        <option value={5}>5th Hour</option>
                        <option value={6}>6th Hour</option>
                        <option value={7}>7th Hour</option>
                        <option value={8}>8th Hour</option>
                      </select>
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <input
                        type="text"
                        value={t.unit}
                        onChange={(e) => handleRowChange(t.sequence_no, 'unit', e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </td>

                    {/* Topic */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <input
                        type="text"
                        value={t.topic}
                        onChange={(e) => handleRowChange(t.sequence_no, 'topic', e.target.value)}
                        placeholder="Enter topic details..."
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </td>

                    {/* COs */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <select
                        value={t.cognitive_level}
                        onChange={(e) => handleRowChange(t.sequence_no, 'cognitive_level', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                      >
                        <option value="K1">K1</option>
                        <option value="K2">K2</option>
                        <option value="K3">K3</option>
                        <option value="K4">K4</option>
                        <option value="K5">K5</option>
                      </select>
                    </td>

                    {/* Mode of Delivery */}
                    <td className="py-2 px-3 border-r border-gray-200">
                      <select
                        value={t.mode_of_delivery}
                        onChange={(e) => handleRowChange(t.sequence_no, 'mode_of_delivery', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                      >
                        <option value="BB">Blackboard (BB)</option>
                        <option value="PPT">PPT Presentation</option>
                        <option value="F2F">Face-to-Face (F2F)</option>
                        <option value="LAB">Laboratory (LAB)</option>
                        <option value="LMS">LMS</option>
                        <option value="SEM">Seminar (SEM)</option>
                        <option value="WS">Workshop (WS)</option>
                        <option value="PBL">Project-Based Learning (PBL)</option>
                        <option value="TUT">Tutorial (TUT)</option>
                        <option value="CS">Case Study (CS)</option>
                      </select>
                    </td>

                    {/* Delete button */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                ))}

                {topics.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-500 font-semibold">
                      No topics added yet. Click "+ Add Topic Row" below to plan a syllabus item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-Based View */}
          <div className="block md:hidden space-y-4">
            {topics.map((t, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-700">Topic #{t.sequence_no}</span>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Delete Row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Proposed Date</label>
                    <input
                      type="date"
                      value={t.proposed_date ? t.proposed_date.split('T')[0] : ""}
                      onChange={(e) => handleRowChange(t.sequence_no, 'proposed_date', e.target.value || null)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Hour / Period</label>
                    <select
                      value={t.hours}
                      onChange={(e) => handleRowChange(t.sequence_no, 'hours', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white text-gray-800"
                    >
                      <option value={1}>1st Hour</option>
                      <option value={2}>2nd Hour</option>
                      <option value={3}>3rd Hour</option>
                      <option value={4}>4th Hour</option>
                      <option value={5}>5th Hour</option>
                      <option value={6}>6th Hour</option>
                      <option value={7}>7th Hour</option>
                      <option value={8}>8th Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Unit</label>
                    <input
                      type="text"
                      value={t.unit}
                      onChange={(e) => handleRowChange(t.sequence_no, 'unit', e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">COs</label>
                    <select
                      value={t.cognitive_level}
                      onChange={(e) => handleRowChange(t.sequence_no, 'cognitive_level', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                    >
                      <option value="K1">K1</option>
                      <option value="K2">K2</option>
                      <option value="K3">K3</option>
                      <option value="K4">K4</option>
                      <option value="K5">K5</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mode of Delivery</label>
                    <select
                      value={t.mode_of_delivery}
                      onChange={(e) => handleRowChange(t.sequence_no, 'mode_of_delivery', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                    >
                      <option value="BB">Blackboard (BB)</option>
                      <option value="PPT">PPT Presentation</option>
                      <option value="F2F">Face-to-Face (F2F)</option>
                      <option value="LAB">Laboratory (LAB)</option>
                      <option value="LMS">LMS</option>
                      <option value="SEM">Seminar (SEM)</option>
                      <option value="WS">Workshop (WS)</option>
                      <option value="PBL">Project-Based Learning (PBL)</option>
                      <option value="TUT">Tutorial (TUT)</option>
                      <option value="CS">Case Study (CS)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Topic(s)</label>
                  <textarea
                    value={t.topic}
                    onChange={(e) => handleRowChange(t.sequence_no, 'topic', e.target.value)}
                    placeholder="Enter topic details..."
                    rows={2}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white text-gray-800"
                  />
                </div>
              </div>
            ))}
            
            {topics.length === 0 && (
              <div className="bg-white border border-gray-200 border-dashed rounded-xl p-8 text-center text-gray-500 text-xs font-semibold">
                No topics added yet. Click "+ Add Topic Row" below to plan a syllabus item.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 text-orange-600" /> Add Topic Row
            </button>
            
            <button
              onClick={() => savePlanToBackend(topics)}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:bg-orange-400 w-full sm:w-auto justify-center"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Lesson Plan"}
            </button>
          </div>

        </div>
      )}

      {/* ── RECORD TABLE ── */}
      {viewMode === "record" && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Coverage Log Sheet</span>
            <span className="text-xs text-gray-400 font-semibold">* Deviation reason auto-saves on leaving the input field</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-300 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 text-xs font-bold text-gray-700 uppercase">
                  <th className="py-2.5 px-3 w-16 text-center border-r border-gray-300">S.No.</th>
                  <th className="py-2.5 px-3 w-28 border-r border-gray-300">Proposed Date</th>
                  <th className="py-2.5 px-3 w-28 text-center border-r border-gray-300">Hour / Period</th>
                  <th className="py-2.5 px-2 w-16 text-center border-r border-gray-300">Unit</th>
                  <th className="py-2.5 px-4 border-r border-gray-300">Topic(s)</th>
                  <th className="py-2.5 px-2 w-16 text-center border-r border-gray-300">COs</th>
                  <th className="py-2.5 px-3 w-36 border-r border-gray-300">Mode of Delivery</th>
                  <th className="py-2.5 px-3 w-32 border-r border-gray-300">Actual Date Covered</th>
                  <th className="py-2.5 px-4">Reason for Deviation (if any)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {coveredTopics.map((t, idx) => {
                  const isDeviated = t.proposed_date && t.actual_date && t.actual_date.split('T')[0] !== t.proposed_date.split('T')[0];
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 bg-green-50/10">
                      
                      {/* S.No */}
                      <td className="py-2.5 px-3 text-center font-bold text-gray-500 border-r border-gray-200 bg-gray-50/50">
                        {t.sequence_no}
                      </td>

                      {/* Proposed Date */}
                      <td className="py-2.5 px-3 border-r border-gray-200 font-semibold text-gray-700">
                        {t.proposed_date ? new Date(t.proposed_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : 'N/A'}
                      </td>

                      {/* Hour / Period */}
                      <td className="py-2.5 px-3 text-center border-r border-gray-200 font-semibold text-gray-700">
                        {t.hours === 1 ? "1st Hour" :
                         t.hours === 2 ? "2nd Hour" :
                         t.hours === 3 ? "3rd Hour" :
                         t.hours === 4 ? "4th Hour" :
                         t.hours === 5 ? "5th Hour" :
                         t.hours === 6 ? "6th Hour" :
                         t.hours === 7 ? "7th Hour" :
                         t.hours === 8 ? "8th Hour" : `${t.hours} Hour`}
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-2 text-center border-r border-gray-200 font-semibold text-gray-700">
                        {t.unit}
                      </td>

                      {/* Topic */}
                      <td className="py-2.5 px-4 border-r border-gray-200 text-gray-700 font-medium">
                        {t.topic}
                      </td>

                      {/* COs */}
                      <td className="py-2.5 px-2 text-center border-r border-gray-200 font-bold text-gray-600">
                        {t.cognitive_level}
                      </td>

                      {/* Mode of Delivery */}
                      <td className="py-2.5 px-3 border-r border-gray-200 font-semibold text-gray-600">
                        {t.mode_of_delivery === "BB" ? "Blackboard (BB)" :
                         t.mode_of_delivery === "PPT" ? "PPT Presentation" :
                         t.mode_of_delivery === "F2F" ? "Face-to-Face (F2F)" :
                         t.mode_of_delivery === "LAB" ? "Laboratory (LAB)" :
                         t.mode_of_delivery === "LMS" ? "LMS" :
                         t.mode_of_delivery === "SEM" ? "Seminar (SEM)" :
                         t.mode_of_delivery === "WS" ? "Workshop (WS)" :
                         t.mode_of_delivery === "PBL" ? "Project-Based Learning (PBL)" :
                         t.mode_of_delivery === "TUT" ? "Tutorial (TUT)" :
                         t.mode_of_delivery === "CS" ? "Case Study (CS)" : t.mode_of_delivery}
                      </td>

                      {/* Actual Date Covered */}
                      <td className="py-2 px-3 border-r border-gray-200">
                        <input
                          type="date"
                          value={t.actual_date ? t.actual_date.split('T')[0] : ""}
                          onChange={(e) => handleRowChange(t.sequence_no, 'actual_date', e.target.value || null)}
                          onBlur={() => savePlanToBackend(topics)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-green-500 focus:outline-none"
                        />
                      </td>

                      {/* Reason for Deviation (Editable) */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={t.reason_for_deviation || ""}
                          onChange={(e) => handleRowChange(t.sequence_no, 'reason_for_deviation', e.target.value)}
                          onBlur={() => savePlanToBackend(topics)}
                          placeholder={isDeviated ? "Mandatory deviation reason..." : "No deviation"}
                          className={`w-full px-2 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 ${
                            isDeviated && (!t.reason_for_deviation || t.reason_for_deviation.trim() === "")
                              ? "border-red-400 bg-red-50/30 focus:ring-red-500 focus:border-red-500"
                              : isDeviated
                                ? "border-amber-300 bg-amber-50/20 focus:ring-amber-500 focus:border-amber-500"
                                : "border-gray-200 bg-gray-50/50 cursor-not-allowed text-gray-400"
                          }`}
                          disabled={!isDeviated}
                        />
                      </td>

                    </tr>
                  );
                })}

                {coveredTopics.length === 0 && (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-500 font-semibold bg-gray-50/30 border-dashed border border-gray-200 rounded-lg">
                      <div className="max-w-md mx-auto space-y-1">
                        <p className="text-sm font-bold text-gray-700">No Covered Topics Recorded Yet</p>
                        <p className="text-xs text-gray-400 leading-relaxed font-normal">
                          Topics planned in Write Mode will populate here automatically once student attendance is marked for them.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-Based View */}
          <div className="block md:hidden space-y-4">
            {coveredTopics.map((t, idx) => {
              const isDeviated = t.proposed_date && t.actual_date && t.actual_date.split('T')[0] !== t.proposed_date.split('T')[0];
              
              return (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3 bg-green-50/5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-700">Topic #{t.sequence_no} · Unit {t.unit}</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Covered</span>
                  </div>

                  <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="font-semibold text-gray-800">{t.topic}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-gray-500 font-medium">
                      <p>Proposed: {t.proposed_date ? new Date(t.proposed_date).toLocaleDateString() : 'N/A'}</p>
                      <p>Hour/Period: {t.hours === 1 ? "1st Hour" : t.hours === 2 ? "2nd Hour" : t.hours === 3 ? "3rd Hour" : t.hours === 4 ? "4th Hour" : t.hours === 5 ? "5th Hour" : t.hours === 6 ? "6th Hour" : t.hours === 7 ? "7th Hour" : t.hours === 8 ? "8th Hour" : `${t.hours} Hour`}</p>
                      <p>COs: {t.cognitive_level}</p>
                      <p>Mode: {t.mode_of_delivery}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Actual Date Covered</label>
                      <input
                        type="date"
                        value={t.actual_date ? t.actual_date.split('T')[0] : ""}
                        onChange={(e) => handleRowChange(t.sequence_no, 'actual_date', e.target.value || null)}
                        onBlur={() => savePlanToBackend(topics)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-green-500 focus:outline-none bg-white text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Reason for Deviation {isDeviated && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={t.reason_for_deviation || ""}
                        onChange={(e) => handleRowChange(t.sequence_no, 'reason_for_deviation', e.target.value)}
                        onBlur={() => savePlanToBackend(topics)}
                        placeholder={isDeviated ? "Mandatory deviation reason..." : "No deviation"}
                        className={`w-full px-2 py-1.5 border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 ${
                          isDeviated && (!t.reason_for_deviation || t.reason_for_deviation.trim() === "")
                            ? "border-red-400 bg-red-50/30 focus:ring-red-500 focus:border-red-500"
                            : isDeviated
                              ? "border-amber-300 bg-amber-50/20 focus:ring-amber-500 focus:border-amber-500"
                              : "border-gray-200 bg-gray-50/50 cursor-not-allowed text-gray-400"
                        }`}
                        disabled={!isDeviated}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {coveredTopics.length === 0 && (
              <div className="bg-gray-50/30 border border-gray-200 border-dashed rounded-xl p-8 text-center text-gray-500 text-xs font-semibold">
                <p className="font-bold text-gray-700">No Covered Topics Recorded Yet</p>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Topics planned in Write Mode will populate here automatically once student attendance is marked for them.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => savePlanToBackend(topics)}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:bg-green-400"
            >
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Deviation Reasons"}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
