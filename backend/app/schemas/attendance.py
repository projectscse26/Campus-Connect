from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date

class OverviewStats(BaseModel):
    students_present: int
    students_absent: int
    faculty_present: int
    faculty_absent: int
    student_attendance_percentage: float
    faculty_attendance_percentage: float
    trend_indicator: str  # "up", "down", "stable"

class DonutData(BaseModel):
    name: str
    value: int
    color: str

class TrendData(BaseModel):
    date: str
    present: int
    absent: int
    percentage: float
    faculty_percentage: float

class SectionComparison(BaseModel):
    year: int
    section_name: str
    percentage: float
    students_below_75: int

class HeatmapData(BaseModel):
    day: str
    period: int
    absent_count: int

class FacultyAttendanceStats(BaseModel):
    faculty_name: str
    classes_handled: int
    avg_student_attendance: float
    absentee_count: int

class RiskDistribution(BaseModel):
    year: int
    safe: int      # > 85%
    warning: int   # 75% - 85%
    critical: int  # < 75%

class LiveStatus(BaseModel):
    ongoing_classes: int
    marked_classes: int
    present_now: int
    absent_now: int

class StudentTableData(BaseModel):
    student_id: int
    register_number: str
    name: str
    year: int
    section: str
    total_present: int
    total_absent: int
    percentage: float
    status: str # Safe, Warning, Critical

class AttendanceAnalyticsResponse(BaseModel):
    overview: OverviewStats
    student_donut: List[DonutData]
    faculty_donut: List[DonutData]
    trends: List[TrendData]
    section_comparison: List[SectionComparison]
    heatmap: List[HeatmapData]
    faculty_stats: List[FacultyAttendanceStats]
    risk_distribution: List[RiskDistribution]
    live_status: LiveStatus
    student_table: List[StudentTableData]
    insights: List[str]

    model_config = ConfigDict(from_attributes=True)
