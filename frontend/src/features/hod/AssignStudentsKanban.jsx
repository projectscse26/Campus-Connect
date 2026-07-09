import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { X, Search, Loader2 } from 'lucide-react';

export default function AssignStudentsKanban({ section, onClose, onSaveComplete }) {
  const [unassigned, setUnassigned] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Search states
  const [searchUnassigned, setSearchUnassigned] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');

  useEffect(() => {
    fetchData();
  }, [section.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch unassigned students for this section's year/batch
      const unassignedRes = await axios.get(`/api/hod/sections/${section.id}/unassigned-students`);
      
      // Fetch currently assigned students from the main students list (filtered by this section)
      const allStudentsRes = await axios.get('/api/hod/students');
      
      const assignedToThisSection = allStudentsRes.data.filter(s => s.section && s.section.id === section.id);
      
      setUnassigned(unassignedRes.data);
      setAssigned(assignedToThisSection);
    } catch (err) {
      console.error("Failed to fetch students for kanban", err);
      alert("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // No movement
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const studentId = parseInt(draggableId);
    let sourceList = source.droppableId === 'unassigned' ? [...unassigned] : [...assigned];
    let destList = destination.droppableId === 'unassigned' ? [...unassigned] : [...assigned];

    // Find the actual student by ID (not by index)
    const movedItem = sourceList.find(s => s.id === studentId);
    if (!movedItem) return;
    
    // Remove from source list
    sourceList = sourceList.filter(s => s.id !== studentId);
    
    // If moving within the same list
    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, movedItem);
      if (source.droppableId === 'unassigned') setUnassigned(sourceList);
      else setAssigned(sourceList);
    } else {
      // Moving between lists - add to destination at the end
      destList.push(movedItem);
      if (source.droppableId === 'unassigned') {
        setUnassigned(sourceList);
        setAssigned(destList);
      } else {
        setAssigned(sourceList);
        setUnassigned(destList);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const studentIds = assigned.map(s => s.id);
      await axios.put(`/api/hod/sections/${section.id}/students`, { student_ids: studentIds });
      onSaveComplete();
    } catch (err) {
      console.error("Failed to save assignments", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStudentCard = (student, index) => (
    <Draggable key={student.id.toString()} draggableId={student.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 bg-white rounded-xl border ${snapshot.isDragging ? 'border-primary-500 shadow-lg scale-[1.02]' : 'border-gray-200 shadow-sm'} transition-all`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-gray-900">{student.first_name} {student.last_name}</p>
              <p className="text-xs text-gray-500 mt-1">{student.register_number}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  const filteredUnassigned = unassigned.filter(s => 
    (s.first_name + ' ' + s.last_name).toLowerCase().includes(searchUnassigned.toLowerCase()) ||
    s.register_number.toLowerCase().includes(searchUnassigned.toLowerCase())
  );

  const filteredAssigned = assigned.filter(s => 
    (s.first_name + ' ' + s.last_name).toLowerCase().includes(searchAssigned.toLowerCase()) ||
    s.register_number.toLowerCase().includes(searchAssigned.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Students to Section</h2>
            <p className="text-sm text-gray-500 mt-1">Section {section.name} (Year {section.year}, Batch {section.batch})</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Assignments'}
            </button>
            <button 
              onClick={onClose}
              disabled={saving}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Kanban Board Area */}
        <div className="flex-1 overflow-hidden p-6 bg-gray-50">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading students...</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-6 h-full">
                
                {/* Column 1: Unassigned */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-900">Unassigned Students</h3>
                      <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg">{unassigned.length}</span>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search unassigned..." 
                        value={searchUnassigned}
                        onChange={(e) => setSearchUnassigned(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <Droppable droppableId="unassigned">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-gray-50' : ''}`}
                      >
                        {filteredUnassigned.map((student, index) => renderStudentCard(student, index))}
                        {provided.placeholder}
                        {filteredUnassigned.length === 0 && unassigned.length > 0 && (
                          <div className="text-center text-gray-500 text-sm mt-8">No unassigned students match search</div>
                        )}
                        {unassigned.length === 0 && (
                          <div className="text-center text-gray-500 text-sm mt-8 border-2 border-dashed border-gray-200 rounded-xl py-8">
                            No more unassigned students!
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Column 2: Assigned */}
                <div className="flex-1 flex flex-col bg-primary-50/10 rounded-2xl border border-primary-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-primary-100 bg-primary-50/50">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-primary-900">Assigned to Section</h3>
                      <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-lg">{assigned.length}</span>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-primary-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text" 
                        placeholder="Search assigned..." 
                        value={searchAssigned}
                        onChange={(e) => setSearchAssigned(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-primary-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all placeholder:text-primary-300"
                      />
                    </div>
                  </div>
                  
                  <Droppable droppableId="assigned">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto p-4 transition-colors ${snapshot.isDraggingOver ? 'bg-primary-50/50' : ''}`}
                      >
                        {filteredAssigned.map((student, index) => renderStudentCard(student, index))}
                        {provided.placeholder}
                        {filteredAssigned.length === 0 && assigned.length > 0 && (
                          <div className="text-center text-primary-500 text-sm mt-8">No assigned students match search</div>
                        )}
                        {assigned.length === 0 && (
                          <div className="text-center text-primary-400 text-sm mt-8 border-2 border-dashed border-primary-200 rounded-xl py-8">
                            Drag students here to assign them to {section.name}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>

              </div>
            </DragDropContext>
          )}
        </div>

      </div>
    </div>
  );
}
