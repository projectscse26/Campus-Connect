import React from 'react';

// Using forwardRef so we can pass the ref to html2canvas
export const PrintableTimetable = React.forwardRef(({ grid, assignments, sectionData, DAYS, PERIODS }, ref) => {
  if (!sectionData) return null;

  // Derive some placeholder or calculated data based on sectionData
  const yearText = sectionData.year === 1 ? 'I' : sectionData.year === 2 ? 'II' : sectionData.year === 3 ? 'III' : sectionData.year === 4 ? 'IV' : sectionData.year;
  const semester = sectionData.year * 2 - 1; // Assuming odd semester for now
  
  // Group assignments into Theory and Practical (based on course type or name, or just a simple split)
  const theoryAssignments = assignments.filter(a => !a.course?.name?.toLowerCase().includes('lab'));
  const practicalAssignments = assignments.filter(a => a.course?.name?.toLowerCase().includes('lab'));

  return (
    <div 
      ref={ref} 
      className="bg-[#ffffff] text-[#000000] p-8 font-sans mx-auto flex flex-col"
      style={{
        width: '1000px', // Fixed width to ensure consistent PDF rendering
        minHeight: '1414px', // A4 aspect ratio
        backgroundColor: '#ffffff',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER SECTION */}
      <div className="flex items-center justify-center border-b-2 border-[#000000] pb-4 mb-4">
        <div className="h-32 w-full flex-shrink-0">
          <img src="/logo.png" alt="College Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* DEPARTMENT & TITLE */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h2>
        <h3 className="text-md font-bold mt-1">ACADEMIC YEAR 2025 - 2026 (ODD SEMESTER) TIME TABLE</h3>
      </div>

      {/* DETAILS GRID */}
      <div className="flex justify-between text-sm font-bold mb-6">
        <div className="space-y-2">
          <div className="flex"><span className="w-32 inline-block">YEAR</span> : {yearText}</div>
          <div className="flex"><span className="w-32 inline-block">SEMESTER</span> : {semester}</div>
          <div className="flex"><span className="w-32 inline-block">SECTION</span> : {sectionData.name}</div>
        </div>
        <div className="space-y-2">
          <div className="flex"><span className="w-32 inline-block">BATCH</span> : {sectionData.batch || '______'}</div>
          <div className="flex"><span className="w-32 inline-block">CLASS ADVISOR</span> : {sectionData.class_advisor ? `${sectionData.class_advisor.first_name} ${sectionData.class_advisor.last_name}` : '_________________'}</div>
        </div>
      </div>

      {/* TIMETABLE GRID */}
      <div className="flex-1">
        <table className="w-full table-fixed border-collapse border border-[#000000] text-center text-xs font-bold mb-8">
          <tbody>
            <tr>
              <th className="border border-[#000000] p-2">DAY<br/>ORDER</th>
              {PERIODS.map(p => {
                if (p.type === 'break') {
                  return (
                    <th key={p.id} className="border border-[#000000] p-1 w-10" rowSpan="6">
                      <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="whitespace-nowrap h-40">
                        {p.label} {p.time}
                      </div>
                    </th>
                  );
                }
                return (
                  <th key={p.id} className="border border-[#000000] p-2">
                    <div className="mb-1">{p.label}</div>
                    <div className="text-[10px] whitespace-nowrap">{p.time}</div>
                  </th>
                );
              })}
            </tr>
            {DAYS.map((day, idx) => (
              <tr key={day.id}>
                <td className="border border-[#000000] p-2">{day.label}</td>
              {PERIODS.filter(p => p.type === 'period').map(period => {
                const assignment = grid[day.id][period.id];
                
                return (
                  <td key={period.id} className="border border-[#000000] p-1 h-16 align-top">
                    {assignment ? (
                      <div className="flex flex-col h-full w-full justify-center text-left px-1">
                        <span className="font-bold text-[10px] text-indigo-700 leading-tight block mb-[2px]">
                          {assignment.course?.code || assignment.course?.name || 'Course'}
                        </span>
                        <span className="text-[8px] text-gray-500 leading-tight block">
                          {assignment.faculty?.first_name} {assignment.faculty?.last_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300 flex items-center justify-center h-full">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* SUBJECTS & FACULTY TABLE */}
      <table className="w-full border-collapse border border-[#000000] text-xs mb-12">
        <thead>
          <tr className="bg-[#f3f4f6] font-bold">
            <th className="border border-[#000000] p-2 w-32">SUBJECT CODE</th>
            <th className="border border-[#000000] p-2 text-left">SUBJECT NAME</th>
            <th className="border border-[#000000] p-2 text-left">NAME OF THE FACULTY</th>
            <th className="border border-[#000000] p-2 w-24">NO. OF PERIODS</th>
          </tr>
        </thead>
        <tbody>
          {theoryAssignments.length > 0 && (
            <tr>
              <td colSpan="4" className="border border-[#000000] p-1 text-center font-bold bg-[#f9fafb]">Theory</td>
            </tr>
          )}
          {theoryAssignments.map(a => (
            <tr key={a.id}>
              <td className="border border-[#000000] p-2 text-center">{a.course?.code}</td>
              <td className="border border-[#000000] p-2">{a.course?.name}</td>
              <td className="border border-[#000000] p-2">{a.faculty?.first_name} {a.faculty?.last_name}</td>
              <td className="border border-[#000000] p-2 text-center">
                {/* Count occurrences of this assignment in the grid */}
                {DAYS.reduce((total, day) => {
                  return total + PERIODS.filter(p => p.type === 'period').filter(p => {
                    const cell = grid[day.id][p.id];
                    return cell && cell.id === a.id;
                  }).length;
                }, 0)}
              </td>
            </tr>
          ))}

          {practicalAssignments.length > 0 && (
            <tr>
              <td colSpan="4" className="border border-[#000000] p-1 text-center font-bold bg-[#f9fafb]">Practical</td>
            </tr>
          )}
          {practicalAssignments.map(a => (
            <tr key={a.id}>
              <td className="border border-[#000000] p-2 text-center">{a.course?.code}</td>
              <td className="border border-[#000000] p-2">{a.course?.name}</td>
              <td className="border border-[#000000] p-2">{a.faculty?.first_name} {a.faculty?.last_name}</td>
              <td className="border border-[#000000] p-2 text-center">
                {DAYS.reduce((total, day) => {
                  return total + PERIODS.filter(p => p.type === 'period').filter(p => {
                    const cell = grid[day.id][p.id];
                    return cell && cell.id === a.id;
                  }).length;
                }, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* SIGNATURES */}
      <div className="flex justify-between items-end mt-auto pt-8 text-sm font-bold">
        <div className="text-center">
          <div className="border-t border-[#000000] w-40 mb-2 mx-auto"></div>
          TIME TABLE COORDINATOR
        </div>
        <div className="text-center">
          <div className="border-t border-[#000000] w-48 mb-2 mx-auto"></div>
          DEAN-ACADEMICS / HOD
        </div>
        <div className="text-center">
          <div className="border-t border-[#000000] w-40 mb-2 mx-auto"></div>
          VICE PRINCIPAL
        </div>
        <div className="text-center">
          <div className="border-t border-[#000000] w-40 mb-2 mx-auto"></div>
          PRINCIPAL
        </div>
      </div>
    </div>
  );
});
