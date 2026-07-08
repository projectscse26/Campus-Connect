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
      className="bg-[#ffffff] text-[#000000] p-8 font-sans mx-auto"
      style={{
        width: '1000px', // Fixed width to ensure consistent PDF rendering
        minHeight: '1414px', // A4 aspect ratio
        backgroundColor: '#ffffff',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b-2 border-[#000000] pb-4 mb-4">
        {/* Left Logo */}
        <div className="w-24 h-24 flex-shrink-0">
          <img src="/logo.png" alt="College Logo" className="w-full h-full object-contain" />
        </div>
        
        {/* Center Text */}
        <div className="flex-1 text-center px-4">
          <h1 className="text-3xl font-serif font-bold tracking-tight">srivenkateshwaraa</h1>
          <h2 className="text-xl font-serif font-semibold mt-1">College of Engineering & Technology</h2>
          <div className="bg-[#000000] text-[#ffffff] text-xs font-bold inline-block px-4 py-1 mt-2">
            ASPIRE TO EXCEL
          </div>
          <p className="text-xs font-bold mt-1">Ariyur, Puducherry-605 102.</p>
        </div>

        {/* Right Accreditations (Placeholder text if logos aren't available, but user said logo is at @logo.png) */}
        <div className="w-32 flex flex-col items-end justify-center space-y-2">
          <div className="text-[10px] font-bold text-center border-2 border-[#000000] rounded-full px-2 py-1">NAAC A</div>
          <div className="text-[10px] font-bold text-center">ISO 21001</div>
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
          <div className="flex"><span className="w-32 inline-block">CLASS ADVISOR</span> : _________________</div>
        </div>
        <div className="space-y-2">
          <div className="flex"><span className="w-32 inline-block">LECTURE HALL</span> : ______</div>
          <div className="flex"><span className="w-32 inline-block">BATCH</span> : ______</div>
        </div>
      </div>

      {/* TIMETABLE GRID */}
      <table className="w-full border-collapse border border-[#000000] text-center text-xs font-bold mb-8">
        <thead>
          <tr>
            <th className="border border-[#000000] p-2" rowSpan="2">DAY<br/>ORDER</th>
            {PERIODS.map(p => {
              if (p.type === 'break') {
                return (
                  <th key={p.id} className="border border-[#000000] p-1 w-8" rowSpan="7">
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
        </thead>
        <tbody>
          {DAYS.map((day, idx) => (
            <tr key={day.id}>
              <td className="border border-[#000000] p-2">{idx + 1}</td>
              {PERIODS.filter(p => p.type === 'period').map(period => {
                const assignment = grid[day.id][period.id];
                // Try to extract a short code from the course name (e.g. "Computer Networks (CN)" -> "CN")
                let shortName = '';
                if (assignment && assignment.course?.name) {
                  const match = assignment.course.name.match(/\((.*?)\)/);
                  shortName = match ? match[1] : assignment.course.name.split(' ').map(w => w[0]).join('').substring(0,3).toUpperCase();
                }
                
                return (
                  <td key={period.id} className="border border-[#000000] p-2 h-12">
                    {shortName || '-'}
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

      {/* SIGNATURES */}
      <div className="flex justify-between items-end mt-24 text-sm font-bold">
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
