Admin Features
1. Dashboard
Features
Total Students
Total Faculty
Total Departments
Total Courses
Total HODs
Active Users
Institution Overview

2. Department Management
Features
Add Department
Edit Department
Delete Department
Activate/Deactivate Department
View Departments
Example:
CSE
ECE
MECH
CIVIL
IT
AI&DS

3. Faculty Management
Features
Add Faculty
Edit Faculty
Delete Faculty
View Faculty
Search Faculty
Assign Faculty Home Department
Activate/Deactivate Faculty
Example:
Dr. Kumar
Department : ECE
Designation : Assistant Professor
Admin only maintains faculty records.

4. Student Management
Features
Add Student
Edit Student
Delete Student
Search Student
Import Students
Activate/Deactivate Student
Student Information:
Register No
Name
Department
Year
Semester
Section

5. Batch Promotion
Features
Promote Students Semester-wise
Promote Entire Batch
Academic Year Update
Example:
II Year CSE
      ↓
III Year CSE

6. Course Management (NEW)
Purpose
Admin maintains all courses offered by every department.
HOD cannot create new courses.
HOD can only assign faculty to the courses already created by Admin.
Features
Add Course
Example:
Course Code : CS3301
Course Name : Data Structures
Department : CSE
Semester : III
Credits : 4
Edit Course
Update:
Course Name
Credits
Semester
Department
Status
Delete Course
Remove obsolete courses.
View Courses
Filter by:
Department
Semester
Regulation
Academic Year
Department-wise Course Management
Example:
CSE
 ├── Data Structures
 ├── DBMS
 ├── Operating Systems

ECE
 ├── Digital Electronics
 ├── Signals and Systems
 ├── Microprocessors
Workflow
Admin
   ↓
Course Management
   ↓
Select Department
   ↓
Add / Update / Delete Course
   ↓
Course Catalog Updated
Relationship with HOD
Admin
    ↓
Creates Courses

HOD
    ↓
Assigns Faculty

Faculty
    ↓
Handles Course
Example:
Admin Creates:
Digital Electronics

↓

CSE HOD Assigns:
Dr. Kumar (ECE Faculty)

↓

Target:
II CSE A

7. HOD Management
Features
Assign HOD
Change HOD
Remove HOD
View HOD Assignments
Example:
CSE → Dr. Kumar

ECE → Dr. Ramesh

8. High Authority Management
Roles
Dean
Principal
Vice Principal
OM
Features
Create Account
Edit Account
Reset Password
Activate/Deactivate Account

9. Announcement Management
Features
Create Announcement
Edit Announcement
Delete Announcement
Institution-wide Notices
Target:
Students
Faculty
HODs
Entire Institution

10. Audit Logs
Features
View Logs
Search Logs
Filter Logs
Log Fields:
Timestamp
User
Role
Action
Status

11. Role & Access Management
Roles
Admin
HOD
Faculty
Student
Dean
Principal
Vice Principal
OM
Features
Assign Roles
Modify Roles
Disable Roles
Reset Credentials

12. Discipline Management
Purpose
Provide centralized control over all student discipline and late-entry records across the college.
Admin acts as the final controller and correction authority for all discipline-related activities.

Features
1. Incident Report Management
Admin can:
View All Discipline Records
Search Discipline Records
Filter Discipline Records
Add New Discipline Records
Edit Existing Records
Delete Incorrect Records
Archive Old Records
Restore Archived Records

2. Late Entry Management
Admin can:
View All Late Entry Records
Search Late Records
Filter Late Records
Add Late Entry Records
Edit Late Entry Records
Delete Incorrect Late Records
Each late record contains:
Student Name

Register Number

Department

Year

Section

Date

Arrival Time

Informed Status

Letter Status

Remarks

Recorded By

3. Record Correction Authority
Only the Admin can modify submitted records.
Workflow:
Faculty / HOD / Higher Authority
                  ↓
Record Submitted
                  ↓
Record Locked
                  ↓
Admin Can Edit / Delete
Examples:
Wrong Student Selected

Incorrect Date Entered

Wrong Remarks Added

Duplicate Entry Created

4. Discipline Analytics Dashboard
Admin can view college-wide analytics.
Analytics Include
Department-wise Analysis
CSE

ECE

MECH

CIVIL

IT

Year-wise Analysis
I Year

II Year

III Year

IV Year

Section-wise Analysis
II CSE A

II CSE B

III ECE A

Trend Analysis
Daily Trends
Weekly Trends
Monthly Trends
Semester-wise Trends

Frequent Offender Analysis
Identify students repeatedly involved in disciplinary incidents.
Metrics:
Total Violations

Total Late Days

Risk Category

Repeat Offender Count

Violation Category Analysis
Examples:
Late Arrival

Mobile Usage

Dress Code Violation

Misbehavior

Class Disturbance

5. Professional Analytics & Visualization
The system should provide advanced visual dashboards using:
Interactive Bar Charts
Trend Line Charts
Heatmaps
Pie Charts
Distribution Charts
Stacked Charts
Drill-down Analytics

6. Reporting
Admin can generate:
Discipline Reports
Late Entry Reports
Frequent Offender Reports
Department-wise Reports
Year-wise Reports
Monthly Reports
Export Options
PDF

Excel

Permissions
Admin

✓ View Records

✓ Add Records

✓ Edit Records

✓ Delete Records

✓ Archive Records

✓ Generate Reports

Final Responsibilities Under Discipline Management
✅ College-wide Discipline Monitoring
✅ Incident Report Management
✅ Late Entry Management
✅ Record Correction Authority
✅ Department-wise Analytics
✅ Year-wise Analytics
✅ Frequent Offender Analysis
✅ Professional Visualization Dashboard
✅ Report Generation
This module should appear inside the Admin portal as:
Discipline Management
│
├── Incident Reports
├── Late Entry Management
├── Analytics Dashboard
└── Reports






Higher Authority Portal
Applicable Roles
Dean
Principal
Vice Principal
OM (Office Manager)
Difference: Login credentials and role identity only.
Same Features: Dashboard, Analytics, Monitoring, Reports, Announcements, Leave Monitoring.

1. Dashboard
Purpose
Provides an institution-wide overview.
Features
Total Students
Total Faculty
Total Departments
Active Courses
Attendance Overview
Academic Performance Overview
Pending Requests
Alerts & Notifications
Workflow
Login
   ↓
Dashboard
   ↓
View Institution Metrics
   ↓
Navigate To Module

2. Academic Performance Analytics
Purpose
Monitor academic performance across the college.
Features
Overall Pass Percentage
Department-wise Pass Percentage
Year-wise Performance
Semester-wise Performance
Subject-wise Analysis
Top Performing Departments
Low Performing Departments
Result Trend Analysis
Example
CSE  → 92%
ECE  → 88%
MECH → 79%
Workflow
Open Academic Analytics
       ↓
Select Semester/Year
       ↓
View Department Reports
       ↓
Generate Analysis

3. Attendance Analytics
Purpose
Monitor attendance across all departments.
Features
College Attendance %
Department Attendance %
Year-wise Attendance
Section-wise Attendance
Attendance Trend Analysis
Low Attendance Student List
Students Below Threshold
Example
College Attendance : 84%

CSE  : 89%
ECE  : 85%
MECH : 78%
Workflow
Open Attendance Analytics
         ↓
Select Department
         ↓
View Attendance Reports
         ↓
Identify Issues

4. Faculty Academic Monitoring
Purpose
Monitor academic activities performed by faculty.
Features
Attendance Submission Status
Marks Submission Status
Faculty Workload Monitoring
Faculty-wise Course Allocation
Pending Academic Tasks
Department-wise Faculty Performance
Example
Pending Attendance Entry : 5

Pending Marks Submission : 8

Pending Course Updates : 3
Workflow
Open Faculty Monitoring
         ↓
View Faculty Activities
         ↓
Identify Pending Tasks
         ↓
Take Administrative Action

5. Course Progress Monitoring
Purpose
Track syllabus and course completion.
Features
Unit Completion Tracking
Syllabus Completion %
Delayed Courses
Faculty-wise Progress
Department-wise Progress
Example
CSE : 84%

ECE : 76%

MECH : 70%
Workflow
Open Course Progress
         ↓
Select Department
         ↓
View Completion Status
         ↓
Identify Delays

6. Timetable & Resource Monitoring
Purpose
Monitor academic resources and schedules.
Features
Faculty Timetable View
Classroom Allocation
Lab Allocation
Conflict Detection
Resource Utilization Reports
Workflow
Open Timetable Monitoring
          ↓
View Allocations
          ↓
Check Conflicts
          ↓
Generate Report

7. Leave & Permission Monitoring
Purpose
Monitor leave-related activities across the institution.
Student Monitoring
Late Entry Requests
Early Exit Requests
Medical Leave Requests
On-Duty Requests
Frequent Permission Tracking
Faculty Monitoring
Casual Leave
On-Duty Leave
Permission Requests
Faculty Absence Monitoring
Features
View Pending Requests
View Approved Requests
View Rejected Requests
Leave Statistics
Permission Trends
Workflow
Leave Request Generated
          ↓
Authority Reviews
          ↓
Monitor Status
          ↓
Generate Reports

8. Announcement & Circular Management
Purpose
Institution-level communication.
Features
Academic Circulars
Examination Notifications
Department-specific Announcements
Institution-wide Announcements
Priority Notifications
Target Audience
Students

Faculty

HODs

Departments

Entire Institution
Workflow
Create Announcement
          ↓
Select Audience
          ↓
Publish
          ↓
Visible To Users

9. Reports & Analytics
Purpose
Generate institutional reports.
Features
Academic Reports
Pass Percentage Report
Department Performance Report
Subject Analysis Report
Attendance Reports
College Attendance Report
Department Attendance Report
Low Attendance Report
Faculty Reports
Workload Report
Course Allocation Report
Leave Reports
Student Leave Report
Faculty Leave Report
Export Options
PDF
Excel
Workflow
Select Report
       ↓
Apply Filters
       ↓
Generate
       ↓
Export PDF/Excel

10. Discipline Management
Late Entry Management & Analytics
Purpose
Monitor, analyze, and track student late-entry patterns across the entire college.

Features
Late Entry Recording
Higher authorities can:
View all late entry records.
Add late entry records.
Search late entry records.
Each record contains:
Student Name

Register Number

Department

Year

Section

Date

Arrival Time

Informed Status

Letter Status

Remarks

Recorded By

Late Entry Status
Informed

Not Informed

Letter Submitted

No Letter Submitted

Analytics & Monitoring
Department-wise Late Analysis
CSE   → 120 Late Entries

ECE   → 95 Late Entries

MECH  → 70 Late Entries

Year-wise Late Analysis
I Year   → 25 Late Entries

II Year  → 60 Late Entries

III Year → 85 Late Entries

IV Year  → 40 Late Entries

Section-wise Late Analysis
II CSE A → 20 Late Entries

II CSE B → 18 Late Entries

III ECE A → 14 Late Entries

Frequent Late Students
Identify students who repeatedly arrive late.
Example:
Student Name

Department

Total Late Days

Risk Category

Professional Analytics Dashboard
The system should provide advanced visualizations such as:
Department-wise Comparison Charts
Year-wise Comparison Charts
Monthly Trend Analysis
Heatmaps for Peak Late Occurrences
Frequent Offender Charts
Distribution Analysis
Interactive Drill-down Reports

Filter Options
Department

Year

Semester

Section

Date Range

Permissions
Higher Authorities

✓ View Records

✓ Add Records

❌ Edit Records

❌ Delete Records

Important Rule
Once a discipline or late-entry record is submitted:
Record Submitted
        ↓
Record Locked
        ↓
Only Admin Can Modify
This entire feature should appear as:
Discipline Management
│
├── Incident Reports
│
├── Late Entry Management
│
└── Discipline Analytics


Final Responsibilities of Higher Authorities
✅ Institution-wide Dashboard
✅ Academic Performance Analytics
✅ Attendance Analytics
✅ Faculty Academic Monitoring
✅ Course Progress Monitoring
✅ Timetable & Resource Monitoring
✅ Leave & Permission Monitoring
✅ Announcement & Circular Management
✅ Reports & Analytics

Higher Authorities Do NOT Handle
❌ Add Students
❌ Add Faculty
❌ Create Departments
❌ Create Courses
❌ Assign HODs
❌ Assign Faculty to Courses
❌ Mentor Assignment
❌ Attendance Entry
❌ Marks Entry
❌ Course Resource Upload

















HOD Portal:
Purpose
The HOD acts as the Department Administrator and manages all academic and operational activities within their department.
The HOD controls:
Faculty allocation
Student monitoring
Course allocation
Mentor allocation
Timetable management
Attendance monitoring
Results monitoring
Faculty leave approvals
Department announcements
Student requests & grievances
Department reports & analytics

1. Dashboard
Features
Total Faculty
Total Students
Active Courses
Faculty Workload Summary
Attendance Overview
Result Statistics
Pending Requests
Recent Announcements
Timetable Summary
Workflow
HOD Login
    ↓
Dashboard
    ↓
View Department Overview

2. Faculty Management
Purpose
Monitor faculty associated with department activities.
Features
View Faculty List
Search Faculty
View Faculty Profile
View Assigned Courses
View Faculty Workload
View Mentorship Allocation
Important
Faculty are not restricted to their home department.
The HOD can assign any eligible faculty to courses within their department.
Example
Faculty : Dr. Kumar
Home Department : ECE

Assigned To :
Digital Electronics

Target :
II CSE A
Faculty Information
Faculty ID
Name
Department
Designation
Assigned Courses
Mentorship Groups
Workload Hours

3. Student Management
Features
View Student Profiles
Search Students
Track Academic Performance
View Attendance Status
Monitor Discipline Records
View Mentor Information
Student Information
Register Number
Name
Department
Semester
Section
Mentor
Attendance %
Academic Performance
Remarks
Workflow
Student List
      ↓
Select Student
      ↓
View Profile
      ↓
Monitor Progress

4. Course Assignment Management
Purpose
Assign faculty to department courses.
Features
View Department Courses
Assign Faculty
Modify Assignment
Remove Assignment
View Teaching Load
Prevent Duplicate Assignment
Assignment Logic
Faculty
    +
Course
    +
Semester
    +
Section(s)
Examples
Digital Electronics
↓
Dr. Kumar (ECE)
↓
II CSE A
Digital Electronics
↓
Dr. Kumar (ECE)
↓
II CSE A & B
Workflow
Select Course
      ↓
Select Faculty
      ↓
Select Semester
      ↓
Select Section(s)
      ↓
Assign

5. Mentor Assignment Management
Features
Assign Mentor
Change Mentor
Remove Mentor
View Mentor Allocation
Track Student Distribution
Example
Faculty :
Dr. John

Students :
60

Section :
III CSE A
Workflow
Select Students
      ↓
Select Faculty
      ↓
Assign Mentor

6. Class Management
Purpose
Manage department classes, sections, and class advisor allocation.
The HOD can create and maintain all classes belonging to their department and assign a faculty member as the Class Advisor for each class.

Features
Class Creation
Create Class
Edit Class
Delete Class
Activate / Deactivate Class
Section Management
Add Sections
Edit Sections
Remove Sections
Year & Semester Mapping
Assign Academic Year
Assign Semester
Assign Department
Class Advisor Assignment
Assign Class Advisor
Change Class Advisor
Remove Class Advisor
View Class Advisor Allocation
Class Overview
View Student Count
View Assigned Mentor Distribution
View Attendance Summary
View Academic Performance Summary

Example Class Structure
Department : CSE

II Year
   ├── A Section
   └── B Section

III Year
   ├── A Section
   └── B Section

IV Year
   ├── A Section
   └── B Section

Example Class Creation
Class Name : II CSE A

Department : CSE

Year : II Year

Semester : III

Section : A

Class Advisor Assignment
Example
II CSE A
      ↓
Dr. Kumar
(Class Advisor)
II CSE B
      ↓
Dr. Ravi
(Class Advisor)

Assignment Rules
Only faculty assigned by the Admin can be selected.
Faculty from any department can be assigned as Class Advisor.
One faculty can be Class Advisor for multiple classes (if permitted by department policy).
A class can have only one active Class Advisor at a time.

Workflow
Create Class
      ↓
Assign Year
      ↓
Assign Semester
      ↓
Assign Section
      ↓
Assign Class Advisor
      ↓
Publish Class

Class Advisor Relationship
The assigned Class Advisor will automatically:
Class
    ↓
Class Advisor
    ↓
Receive Leave Requests
    ↓
Monitor Attendance
    ↓
Monitor Student Performance
    ↓
View Class Student List

Updated HOD Responsibilities (add these)
✅ Class Management
✅ Section Management
✅ Class Advisor Assignment
✅ Faculty-to-Class Assignment


7. Timetable Management
Purpose
Create and manage timetables for all classes in the department.
Features
Create Timetable
Edit Timetable
Delete Timetable
Semester-wise Timetable
Section-wise Timetable
Faculty Timetable View
Classroom Allocation
Conflict Detection
Auto Faculty Mapping
Drag & Drop Timetable Builder
II CSE A

Monday

Period 1 → Data Structures
Period 2 → DBMS
Period 3 → Digital Electronics
Faculty Auto-Linking
Digital Electronics
      ↓
Assigned Faculty
      ↓
Dr. Kumar (ECE)
      ↓
Monday Period 3
Supported Timetable Types
II CSE A

II CSE B

II CSE A & B

III CSE A

III CSE B
Workflow
Select Semester
      ↓
Select Section
      ↓
Drag Course
      ↓
Drop Into Period Slot
      ↓
Faculty Auto Linked
      ↓
Publish Timetable

8. Attendance Monitoring
Features
Department Attendance Dashboard
Class-wise Attendance
Semester-wise Attendance
Faculty Attendance Submission Status
Low Attendance Detection
Attendance Shortage Alerts
Reports
Class-wise Attendance

Semester-wise Attendance

Shortage Report

Low Attendance Students
Workflow
Faculty Marks Attendance
         ↓
System Updates Records
         ↓
HOD Reviews Reports

9. Results Monitoring
Features
Semester Result Overview
Subject Result Analysis
Student Performance Analysis
Faculty Performance Analysis
Pass Percentage Reports
Metrics
Pass Percentage

Fail Count

Top Performers

Subject Analysis
Workflow
Select Semester
      ↓
Select Subject/Class
      ↓
View Analytics
      ↓
Generate Report

10. Faculty Leave Approval
Features
View Leave Requests
Approve Leave
Reject Leave
Leave History
Faculty Absence Monitoring
Workflow
Faculty Applies Leave
         ↓
Request Sent To HOD
         ↓
Review Request
         ↓
Approve / Reject
         ↓
Notification Sent

11. Notification Center
Purpose
Receive notifications from higher authorities and system alerts.
Notifications Received From
Admin
Dean
Principal
Vice Principal
OM
System Alerts
Features
Unread Notifications
Read Notifications
Notification History
Priority Notifications
Mark as Read
Examples
Exam Circular Released

Attendance Review Meeting

Department Alert

Faculty Leave Escalation

Academic Review Notification
Workflow
Higher Authority Sends Notification
           ↓
Notification Center
           ↓
HOD Receives Notification
           ↓
View / Read

12. Department Announcements
Purpose
Communicate only within the HOD's department.
Features
Create Announcement
Edit Announcement
Delete Announcement
Schedule Announcement
Audience
All Students

All Faculty

Specific Semester

Specific Section

Specific Faculty Group
Restrictions
HOD cannot send announcements to:
Other Departments

Entire Institution

Dean

Principal

Vice Principal

OM
Workflow
Create Announcement
        ↓
Select Department Audience
        ↓
Publish

13. Student Requests & Grievance Management
Features
View Requests
Review Complaints
Approve Requests
Reject Requests
Provide Resolution
Track Request Status
Request Types
Bonafide Certificate

Recommendation Letter

Academic Requests

Complaint Submission

Discipline Issues
Workflow
Student Raises Request
          ↓
Sent To HOD
          ↓
Review
          ↓
Action Taken
          ↓
Status Updated

14. Reports & Analytics
Features
Faculty Reports
Faculty Workload Report
Faculty Performance Report
Course Reports
Course Allocation Report
Mentor Reports
Mentor Allocation Report
Attendance Reports
Department Attendance Report
Shortage Report
Results Reports
Pass Percentage Report
Subject Analysis Report
Export Options
PDF

Excel
Workflow
Select Report
      ↓
Apply Filters
      ↓
Generate
      ↓
Export

15. Discipline Management
Features
Department Discipline Monitoring
Department Discipline Dashboard
View All Department Records
View Repeat Offenders
Search Student History
Monitor Class-wise Cases
Late Monitoring
Frequent Late Students
Late Trend Analysis
Section-wise Late Analysis
Filters
Department

Year

Semester

Section

Date Range
Analytics
Professional dashboards using modern analytics:
Department-wise Comparison
Year-wise Comparison
Section-wise Comparison
Time Trend Analysis
Top Offenders
Heatmaps for Peak Late Occurrences
Example:
II Year CSE → 45 Late Entries

III Year CSE → 22 Late Entries

IV Year CSE → 10 Late Entries
Permissions
HOD

✓ View

✓ Add

❌ Edit

❌ Delete

Final Responsibilities of HOD
✅ Dashboard
✅ Faculty Management
✅ Student Management
✅ Faculty-to-Course Assignment
✅ Faculty-to-Section Assignment
✅ Cross-Department Faculty Assignment
✅ Mentor Assignment
✅ Timetable Management (Drag & Drop)
✅ Attendance Monitoring
✅ Results Monitoring
✅ Faculty Leave Approval
✅ Notification Center
✅ Department Announcements
✅ Student Requests & Grievances
✅ Reports & Analytics

HOD Does NOT Handle
❌ Create Departments
❌ Create Faculty Accounts
❌ Create Student Accounts
❌ Create Courses
❌ Assign HODs
❌ Institution-wide Announcements
❌ Institution-wide User Management
❌ System Role Management
These responsibilities belong to the Admin Portal.








Faculty Portal :
Purpose
Faculty members are responsible for:
Teaching assigned courses
Managing LMS content
Taking attendance
Managing assignments
Managing marks and assessments
Managing syllabus progress
Acting as Class Advisors
Acting as Mentors
Processing student requests
Applying for leave
Receiving notifications

1. Dashboard
Features
Academic Overview
Assigned Courses
Total Students Teaching
Today's Classes
Pending Evaluations
Pending Assignment Reviews
Analytics
Attendance Trajectory
Assignment Completion Rate
Class Performance Overview
At-Risk Students
Timetable Summary
Today's Schedule
Upcoming Classes
Notifications Summary
Unread Notifications
Important Alerts

2. My Courses
Purpose
Displays all courses assigned by the HOD.
Course Card Information
Course Code
Course Name
Department
Semester
Credits
Assigned Section(s)
Student Count
Actions
View Roster
Shows:
Student List
Register Number
Attendance %
Assignment Status
Marks Summary
Open LMS Course Manager

3. LMS Course Manager
Each course contains:
Resources
Assignments
Announcements
Syllabus

A. Resources
Features
Upload PDF
Upload PPT
Upload Notes
Upload Lab Manuals
Upload External Links
Edit Resources
Delete Resources
Workflow
Faculty
   ↓
Select Course
   ↓
Resources
   ↓
Upload Material

B. Assignments
Features
Create Assignment
Edit Assignment
Delete Assignment
Set Due Date
Set Marks
View Submissions
Grade Submissions
Publish Marks
Workflow
Create Assignment
      ↓
Student Submission
      ↓
Evaluation
      ↓
Publish Marks

C. Course Announcements
Purpose
Communicate with students enrolled in that course.
Features
Post Announcement
Edit Announcement
Delete Announcement
Pin Important Notice
Examples
Quiz Tomorrow

Assignment Deadline Extended

Lab Schedule Updated

D. Syllabus Tracking (Updated)
Purpose
Track syllabus completion transparently.
Visible To
Faculty
Can:
View Syllabus
Mark Units Completed
Update Progress
HOD
Can:
Monitor Completion Percentage
Track Faculty Progress
Identify Delayed Courses
Students
Can:
View Completion Status
View Completed Units
Track Pending Units
Cannot edit.

Features
View Complete Syllabus
Unit-wise Progress
Mark Unit Completed
Completion Percentage
Example
Unit 1 ✔

Unit 2 ✔

Unit 3 ✔

Unit 4 ✔

Unit 5 ⏳
Completion Indicator
80% Completed
Workflow
Faculty Completes Unit
          ↓
Marks Unit Complete
          ↓
Progress Updated
          ↓
Visible To Students
          ↓
Visible To HOD

4. Attendance Management
Features
Mark Attendance
Edit Attendance
View Attendance History
Session-wise Records
Daily Attendance
Analytics
Attendance %
Present / Absent Count
Low Attendance Students
Attendance Trends
Workflow
Select Course
      ↓
Select Session
      ↓
Mark Attendance
      ↓
Save

5. Grade Book
Features
CIA Marks Entry
Model Exam Marks Entry
Retest Marks Entry
Internal Assessment Tracking
Update Marks
Export CSV
Assessment Types
CIA 1
CIA 2
Model Exam
Retest
Workflow
Select Assessment
       ↓
Enter Marks
       ↓
Save
       ↓
Publish

6. Results Management
Features
Student-wise Results
Class-wise Results
Subject-wise Results
Pass Percentage
Top Performers
Weak Student Identification
Analytics
Pass %

Fail %

Average Marks

Top Students

At-Risk Students

7. Class Advisor Module
Visible only if assigned as Class Advisor by the HOD.
Responsibilities
Manage students belonging to the assigned class.
Features
View Assigned Class
View Student Profiles
Monitor Attendance
Monitor Results
Monitor Discipline
Process Student Requests

Class Advisor Request Center
Features
View Leave Requests
Approve Requests
Reject Requests
Add Remarks
Request History
Scope
Receives requests from:
All Students
of Assigned Class
Example:
II CSE A

Class Advisor:
Dr. Kumar

8. Mentorship Module
Visible only if assigned as Mentor by the HOD.
Features
My Mentees
View Student Profile
View Attendance
View Marks
View Discipline Records
View Leave History
Track Student Progress

Mentorship Request Center
Features
View Mentee Requests
Approve Requests
Reject Requests
Add Remarks
Request History
Scope
Receives requests only from assigned mentees.

9. Student Leave Workflow
Case 1
Class Advisor ≠ Mentor
Student
    ↓
Class Advisor
    ↓
Mentor
    ↓
HOD
Workflow
Student Applies Leave
          ↓
Class Advisor Approval
          ↓
Mentor Approval
          ↓
HOD Approval

Case 2
Class Advisor = Mentor
Dr. Kumar

Class Advisor
+
Mentor
Workflow
Student Applies Leave
          ↓
Class Advisor Approval
          ↓
Mentor Auto Approved
          ↓
Forward To HOD
This avoids duplicate approvals.

10. Faculty Leave Management
Features
Apply Leave
Cancel Leave Request
Leave History
Track Approval Status
Duty Arrangement Submission
Workflow
Faculty Applies Leave
          ↓
Submit Duty Arrangement
          ↓
Sent To HOD
          ↓
Approve / Reject

11. Timetable
Features
Weekly Timetable
Daily Timetable
Assigned Classes
Assigned Subjects
Classroom Details
Note
Faculty can only view timetable.
Timetable creation belongs to the HOD.

12. Notification Center
Notifications From
Admin
HOD
Dean
Principal
Vice Principal
OM
System Alerts
Features
Unread Notifications
Read Notifications
Notification History
Priority Alerts
Mark as Read

13. Messages
Features
Internal communication system.
Can communicate with:
HOD
Students
Mentees
Class Students
Other Faculty

14. Calendar
Features
Academic Events
Exam Dates
Meetings
Assignment Deadlines
Leave Calendar

15. Doubt Solver
Features
Student Questions
Faculty Responses
Course-wise Doubts
Discussion History

16. Faculty Profile
Features
Personal Information
Name
Faculty ID
Department
Designation
Academic Information
Qualification
Experience
Skills
Certifications
Portfolio
Publications
Research
Achievements

17. Discipline Module
Features
Incident Reporting
Create Discipline Report
View Student History
View Reported Cases
Late Entry Management
Faculty can record:
Student Name

Date

Arrival Time

Informed : Yes / No

Letter : Yes / No

Remarks
Permissions
Faculty

✓ View

✓ Add

❌ Edit

❌ Delete
Analytics
Faculty can view:
Class-wise Late Analysis
Section-wise Discipline Analysis
Frequent Late Students
Frequent Offenders
Filter Options:
Course

Section

Semester

Date Range

Final Responsibilities of Faculty
✅ Dashboard
✅ My Courses
✅ LMS Course Manager
✅ Resources
✅ Assignments
✅ Course Announcements
✅ Syllabus Tracking
✅ Attendance Management
✅ Grade Book
✅ Results Management
✅ Class Advisor Module
✅ Mentorship Module
✅ Student Leave Processing
✅ Faculty Leave Management
✅ Timetable View
✅ Notification Center
✅ Messages
✅ Calendar
✅ Doubt Solver
✅ Faculty Profile

Faculty Does NOT Handle
❌ Create Courses
❌ Create Departments
❌ Create Student Accounts
❌ Create Faculty Accounts
❌ Assign Faculty to Courses
❌ Assign Mentors
❌ Assign Class Advisors
❌ Create Timetables
❌ Institution-wide Announcements
❌ Role Management
These responsibilities belong to the Admin, HOD, and Higher Authority portals.




Student Portal
Purpose
The Student Portal acts as a centralized academic, communication, and self-service platform where students can access learning materials, track academic progress, interact with mentors, apply for leave, and monitor their discipline and attendance records.

1. Dashboard
Features
Academic Overview
Current Semester
Department
Year
Section
Mentor Information
Class Advisor Information
Quick Statistics
Overall Attendance Percentage
Total Courses
Pending Assignments
Upcoming Assessments
Recent Announcements
Total Late Days
Dashboard Widgets
Current Semester

Attendance %

Pending Assignments

Upcoming Deadlines

Recent Notifications

Course Completion Summary

2. Profile
Features
Personal Information
Student Name
Register Number
Department
Year
Semester
Section
Email
Phone Number
Academic Information
Mentor Details
Class Advisor Details
Batch Information
Additional Features
Update Personal Information
Change Password
Profile Picture Upload

3. Notification Center
Purpose
Receive notifications from:
Admin
HOD
Faculty
Mentor
Class Advisor
Dean
Principal
Vice Principal
OM
System Alerts
Features
Unread Notifications
Read Notifications
Notification History
Mark as Read
Priority Notifications

4. Courses
Purpose
View all enrolled semester courses.
Each course acts as an LMS workspace.

Course Card Information
Course Code

Course Name

Faculty Name

Credits

Semester

Section

5. LMS Course Manager
Each course contains four tabs.
Resources

Assignments

Announcements

Syllabus

A. Resources
Features
Download PDFs
Download PPTs
Download Notes
Access Lab Manuals
Access External Links
View Syllabus Files

B. Assignments
Features
View Assignments
Submit Assignment
Re-submit Assignment (if allowed)
View Submission Status
View Assignment Marks
Status Examples
Pending

Submitted

Late Submission

Graded

C. Course Announcements
Features
View Course Announcements
View Important Notices
View Deadline Updates
Examples:
Quiz Tomorrow

Assignment Deadline Extended

Lab Schedule Updated

D. Syllabus Tracking
Purpose
Allow students to transparently track syllabus completion.
Features
View Complete Syllabus
View Completed Units
View Pending Units
View Course Completion Percentage
Example
Unit 1 ✔

Unit 2 ✔

Unit 3 ✔

Unit 4 ✔

Unit 5 ⏳
Completion Indicator
80% Completed
Students cannot modify progress.

6. Attendance
Features
Overall Attendance
Overall Attendance Percentage
Monthly Attendance Trend
Subject-wise Attendance
Course-wise Attendance Percentage
Session-wise Attendance History
Present/Absent Records
Analytics
Attendance Trend Analysis
Attendance Shortage Alerts
Low Attendance Warnings

7. Results
Features
Internal Assessments
CIA 1 Marks
CIA 2 Marks
CIA 3 Marks
Model Exam Marks
Retest Marks
Semester Results
Subject-wise Marks
Grade Details
GPA/CGPA Information
Analytics
Subject Performance Analysis
Marks Trend Analysis
Strength & Weakness Identification

8. Mentor & Class Advisor Information
Features
Students can view:
Mentor Information
Faculty Name

Department

Email

Phone Number
Class Advisor Information
Faculty Name

Department

Email

Phone Number

9. Leave Management
Features
Apply Leave
Students can submit:
Casual Leave
Medical Leave
On-Duty Leave
Permission Request
Leave Form
Reason

From Date

To Date

Leave Type

Attachment Upload

Leave Tracking
Students can track approval status.
Workflow
Case 1
When Class Advisor ≠ Mentor
Student
    ↓
Class Advisor
    ↓
Mentor
    ↓
HOD

Case 2
When Class Advisor = Mentor
Student
    ↓
Class Advisor Approval
    ↓
Mentor Auto Approval
    ↓
HOD

Approval Tracking Panel
Students can view:
Submitted

Class Advisor Approved

Mentor Approved

HOD Approved

Rejected
Along with:
Timestamp
Remarks
Current Approval Stage

10. Discipline Management (View Only)
Purpose
Allow students to monitor their own discipline and late-entry records.
Students cannot create, edit, or delete records.

A. My Discipline Records
Features
View Incident History
View Reported Date
View Incident Type
View Remarks
View Reported By
View Action Taken
Examples
Mobile Usage

Dress Code Violation

Class Disturbance

Misbehavior

B. My Late Entry Records
Features
View Total Late Days
View Monthly Late Count
View Late Entry History
View Informed Status
View Letter Status
Example
Date : 12/08/2026

Arrival Time : 09:20 AM

Informed : No

Letter : Yes

C. Personal Discipline Analytics
Students can view professional visualizations.
Analytics Include
Monthly Late Trend
Total Late Days
Discipline Category Distribution
Semester-wise Discipline Trend
Example Metrics
Total Late Days : 12

This Month : 3

Total Discipline Cases : 2
Students can only view their own records.

11. Mentorship
Features
View Mentor Profile
View Mentor Contact Information
View Meeting History
View Academic Guidance Notes

12. Student Requests & Grievances
Features
Students can raise:
Bonafide Certificate Request
Recommendation Letter Request
Academic Requests
Complaint Submission
General Grievances
Workflow
Student Raises Request
          ↓
Sent To HOD
          ↓
Review
          ↓
Status Updated

Final Responsibilities of Students
✅ Dashboard
✅ Profile Management
✅ Notification Center
✅ Courses
✅ LMS Course Manager
✅ Resources Access
✅ Assignment Submission
✅ Course Announcements
✅ Syllabus Tracking
✅ Attendance Tracking
✅ Results Monitoring
✅ Mentor & Class Advisor Information
✅ Leave Management
✅ Discipline Monitoring (View Only)
✅ Mentorship
✅ Student Requests & Grievances

Students Cannot
❌ Create Courses
❌ Upload Academic Resources
❌ Mark Attendance
❌ Assign Mentors
❌ Approve Leave
❌ Create Discipline Records
❌ Edit Discipline Records
❌ Create Timetables
❌ Manage Users
❌ Access Other Students' Data
These responsibilities belong to Faculty, HOD, Higher Authorities, and Admin.





