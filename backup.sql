--
-- PostgreSQL database dump
--

\restrict nOifnMByegoZx9jLarVS6bgi4OsTingPyZc7hbaLLpo1BMlCysYxL44gwGi8KW1

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: actionstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.actionstatus AS ENUM (
    'INFORMED',
    'NOT_INFORMED',
    'LETTER_GIVEN'
);


ALTER TYPE public.actionstatus OWNER TO postgres;

--
-- Name: attendancestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendancestatus AS ENUM (
    'PRESENT',
    'ABSENT',
    'ON_DUTY',
    'LATE'
);


ALTER TYPE public.attendancestatus OWNER TO postgres;

--
-- Name: coursetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.coursetype AS ENUM (
    'THEORY',
    'LAB',
    'ELECTIVE',
    'PROJECT'
);


ALTER TYPE public.coursetype OWNER TO postgres;

--
-- Name: dayofweek; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.dayofweek AS ENUM (
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT'
);


ALTER TYPE public.dayofweek OWNER TO postgres;

--
-- Name: gradetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gradetype AS ENUM (
    'internal_1',
    'internal_2',
    'model_exam',
    'assignment',
    'lab',
    'external'
);


ALTER TYPE public.gradetype OWNER TO postgres;

--
-- Name: incidentcategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.incidentcategory AS ENUM (
    'NO_SHOE',
    'NO_ID_CARD',
    'IMPROPER_HAIRCUT',
    'IMPROPER_DRESS_CODE',
    'OTHER'
);


ALTER TYPE public.incidentcategory OWNER TO postgres;

--
-- Name: leavestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leavestatus AS ENUM (
    'PENDING',
    'APPROVED_MENTOR',
    'APPROVED_HOD',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public.leavestatus OWNER TO postgres;

--
-- Name: leavetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leavetype AS ENUM (
    'SICK',
    'PERSONAL',
    'ON_DUTY',
    'EMERGENCY'
);


ALTER TYPE public.leavetype OWNER TO postgres;

--
-- Name: resourcetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.resourcetype AS ENUM (
    'NOTES',
    'SYLLABUS',
    'ASSIGNMENT',
    'REFERENCE',
    'VIDEO'
);


ALTER TYPE public.resourcetype OWNER TO postgres;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userrole AS ENUM (
    'ADMIN',
    'HOD',
    'FACULTY',
    'STUDENT',
    'AUTHORITY',
    'late_tracker',
    'LATE_TRACKER'
);


ALTER TYPE public.userrole OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alumni; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alumni (
    id integer NOT NULL,
    user_id integer NOT NULL,
    department_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    register_number character varying(50) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    blood_group character varying(5),
    nationality character varying(50),
    community character varying(50),
    photo_url character varying(500),
    batch character varying(20) NOT NULL,
    graduation_year integer NOT NULL,
    college_email character varying(255) NOT NULL,
    personal_email character varying(255),
    phone character varying(15) NOT NULL,
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.alumni OWNER TO postgres;

--
-- Name: alumni_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alumni_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alumni_id_seq OWNER TO postgres;

--
-- Name: alumni_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alumni_id_seq OWNED BY public.alumni.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    course_id integer,
    department_id integer,
    posted_by_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    is_global boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    date date NOT NULL,
    hour integer,
    status public.attendancestatus NOT NULL,
    marked_by_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: authorities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.authorities (
    id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    title character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(15) NOT NULL,
    employee_id character varying(50) NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.authorities OWNER TO postgres;

--
-- Name: authorities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.authorities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.authorities_id_seq OWNER TO postgres;

--
-- Name: authorities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.authorities_id_seq OWNED BY public.authorities.id;


--
-- Name: course_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_assignments (
    id integer NOT NULL,
    faculty_id integer NOT NULL,
    course_id integer NOT NULL,
    section_id integer NOT NULL,
    academic_year character varying(20) NOT NULL,
    semester integer NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.course_assignments OWNER TO postgres;

--
-- Name: course_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_assignments_id_seq OWNER TO postgres;

--
-- Name: course_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_assignments_id_seq OWNED BY public.course_assignments.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    department_id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    credits integer NOT NULL,
    course_type public.coursetype,
    semester integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO postgres;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(20) NOT NULL,
    hod_id integer,
    vision character varying(500),
    mission character varying(500),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: discipline_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discipline_records (
    id integer NOT NULL,
    student_id integer NOT NULL,
    reported_by_id integer NOT NULL,
    incident_type public.incidentcategory NOT NULL,
    incident_date date NOT NULL,
    remarks text,
    action_status public.actionstatus,
    action_taken text,
    is_locked boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.discipline_records OWNER TO postgres;

--
-- Name: discipline_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.discipline_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.discipline_records_id_seq OWNER TO postgres;

--
-- Name: discipline_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.discipline_records_id_seq OWNED BY public.discipline_records.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    academic_year character varying(20) NOT NULL,
    semester integer NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_id_seq OWNER TO postgres;

--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: faculty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faculty (
    id integer NOT NULL,
    user_id integer NOT NULL,
    department_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    blood_group character varying(5),
    nationality character varying(50),
    community character varying(50),
    photo_url character varying(500),
    college_email character varying(255) NOT NULL,
    personal_email character varying(255),
    phone character varying(15) NOT NULL,
    alternate_phone character varying(15),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    employee_id character varying(50) NOT NULL,
    designation character varying(100),
    qualification character varying(200),
    specialization character varying(200),
    experience_years integer,
    date_of_joining date,
    employment_type character varying(50),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.faculty OWNER TO postgres;

--
-- Name: faculty_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faculty_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faculty_id_seq OWNER TO postgres;

--
-- Name: faculty_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faculty_id_seq OWNED BY public.faculty.id;


--
-- Name: grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grades (
    id integer NOT NULL,
    student_id integer NOT NULL,
    course_id integer NOT NULL,
    grade_type public.gradetype NOT NULL,
    marks_obtained numeric(6,2) NOT NULL,
    max_marks numeric(6,2) NOT NULL,
    academic_year character varying(20) NOT NULL,
    semester integer NOT NULL,
    graded_by_id integer,
    remarks text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.grades OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grades_id_seq OWNER TO postgres;

--
-- Name: grades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grades_id_seq OWNED BY public.grades.id;


--
-- Name: late_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.late_records (
    id integer NOT NULL,
    student_id integer NOT NULL,
    recorded_by_id integer NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    reason character varying(255),
    remarks text,
    created_at timestamp with time zone DEFAULT now(),
    action_status public.actionstatus DEFAULT 'NOT_INFORMED'::public.actionstatus
);


ALTER TABLE public.late_records OWNER TO postgres;

--
-- Name: late_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.late_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.late_records_id_seq OWNER TO postgres;

--
-- Name: late_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.late_records_id_seq OWNED BY public.late_records.id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id integer NOT NULL,
    student_id integer NOT NULL,
    leave_type public.leavetype NOT NULL,
    from_date date NOT NULL,
    to_date date NOT NULL,
    reason text NOT NULL,
    status public.leavestatus,
    mentor_approved_by integer,
    mentor_approved_at timestamp with time zone,
    hod_approved_by integer,
    hod_approved_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_id_seq OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- Name: lms_resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lms_resources (
    id integer NOT NULL,
    course_id integer NOT NULL,
    uploaded_by_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    resource_type public.resourcetype NOT NULL,
    file_url character varying(500),
    external_link character varying(500),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lms_resources OWNER TO postgres;

--
-- Name: lms_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lms_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lms_resources_id_seq OWNER TO postgres;

--
-- Name: lms_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lms_resources_id_seq OWNED BY public.lms_resources.id;


--
-- Name: mentor_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.mentor_assignments (
    id integer NOT NULL,
    mentor_id integer NOT NULL,
    student_id integer NOT NULL,
    academic_year character varying(20) NOT NULL,
    assigned_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.mentor_assignments OWNER TO postgres;

--
-- Name: mentor_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.mentor_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.mentor_assignments_id_seq OWNER TO postgres;

--
-- Name: mentor_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.mentor_assignments_id_seq OWNED BY public.mentor_assignments.id;


--
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    id integer NOT NULL,
    department_id integer NOT NULL,
    name character varying(10) NOT NULL,
    year integer NOT NULL,
    batch character varying(20) NOT NULL,
    class_advisor_id integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- Name: sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_id_seq OWNER TO postgres;

--
-- Name: sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sections_id_seq OWNED BY public.sections.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    user_id integer NOT NULL,
    department_id integer NOT NULL,
    section_id integer,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    register_number character varying(50) NOT NULL,
    gender character varying(10),
    date_of_birth date,
    blood_group character varying(5),
    nationality character varying(50),
    community character varying(50),
    photo_url character varying(500),
    batch character varying(20) NOT NULL,
    current_year integer,
    current_semester integer,
    college_email character varying(255) NOT NULL,
    personal_email character varying(255),
    phone character varying(15) NOT NULL,
    father_name character varying(150),
    father_phone character varying(15),
    father_occupation character varying(100),
    mother_name character varying(150),
    mother_phone character varying(15),
    mother_occupation character varying(100),
    annual_income numeric(12,2),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    pincode character varying(10),
    tenth_school character varying(255),
    tenth_board character varying(100),
    tenth_marks numeric(6,2),
    tenth_percentage numeric(5,2),
    twelfth_school character varying(255),
    twelfth_board character varying(100),
    twelfth_marks numeric(6,2),
    twelfth_percentage numeric(5,2),
    admission_date date,
    admission_type character varying(50),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: timetable_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timetable_slots (
    id integer NOT NULL,
    course_assignment_id integer NOT NULL,
    day public.dayofweek NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    room character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.timetable_slots OWNER TO postgres;

--
-- Name: timetable_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.timetable_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timetable_slots_id_seq OWNER TO postgres;

--
-- Name: timetable_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.timetable_slots_id_seq OWNED BY public.timetable_slots.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    role public.userrole NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: alumni id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumni ALTER COLUMN id SET DEFAULT nextval('public.alumni_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: authorities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorities ALTER COLUMN id SET DEFAULT nextval('public.authorities_id_seq'::regclass);


--
-- Name: course_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments ALTER COLUMN id SET DEFAULT nextval('public.course_assignments_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: discipline_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline_records ALTER COLUMN id SET DEFAULT nextval('public.discipline_records_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: faculty id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty ALTER COLUMN id SET DEFAULT nextval('public.faculty_id_seq'::regclass);


--
-- Name: grades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades ALTER COLUMN id SET DEFAULT nextval('public.grades_id_seq'::regclass);


--
-- Name: late_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.late_records ALTER COLUMN id SET DEFAULT nextval('public.late_records_id_seq'::regclass);


--
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- Name: lms_resources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lms_resources ALTER COLUMN id SET DEFAULT nextval('public.lms_resources_id_seq'::regclass);


--
-- Name: mentor_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mentor_assignments ALTER COLUMN id SET DEFAULT nextval('public.mentor_assignments_id_seq'::regclass);


--
-- Name: sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections ALTER COLUMN id SET DEFAULT nextval('public.sections_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: timetable_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable_slots ALTER COLUMN id SET DEFAULT nextval('public.timetable_slots_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alumni; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alumni (id, user_id, department_id, first_name, last_name, register_number, gender, date_of_birth, blood_group, nationality, community, photo_url, batch, graduation_year, college_email, personal_email, phone, address_line1, address_line2, city, state, pincode, created_at) FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, course_id, department_id, posted_by_id, title, content, is_global, created_at) FROM stdin;
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, student_id, course_id, date, hour, status, marked_by_id, created_at) FROM stdin;
\.


--
-- Data for Name: authorities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.authorities (id, user_id, first_name, last_name, title, email, phone, employee_id, is_active, created_at, updated_at) FROM stdin;
1	10	balaji	n	Dean	dean@svcet.ac.in	9344793685	emp123	t	2026-06-27 08:30:15.732067+05:30	\N
3	769	pradeep 	devaneyan	Principal	principal@svcet.ac.in	9632587412	123	t	2026-06-28 16:32:58.189521+05:30	\N
\.


--
-- Data for Name: course_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_assignments (id, faculty_id, course_id, section_id, academic_year, semester, is_active, created_at) FROM stdin;
14	2	67	7	2026-2027	7	t	2026-06-28 09:05:59.440391+05:30
15	3	68	7	2026-2027	7	t	2026-06-28 09:06:05.446764+05:30
16	8	69	7	2026-2027	7	t	2026-06-28 09:06:14.482027+05:30
17	9	70	7	2026-2027	7	t	2026-06-28 09:06:20.872408+05:30
18	10	71	7	2026-2027	7	t	2026-06-28 09:06:27.114024+05:30
19	11	72	7	2026-2027	7	t	2026-06-28 09:06:34.586604+05:30
20	13	73	7	2026-2027	7	t	2026-06-28 09:06:38.851696+05:30
21	13	67	8	2026-2027	7	t	2026-06-29 10:25:01.07929+05:30
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, department_id, code, name, credits, course_type, semester, is_active, created_at) FROM stdin;
15	1	CSBS101	Mathematics-I	4	THEORY	1	t	2026-06-28 08:42:33.2096+05:30
16	1	CSBS102	Physics	3	THEORY	1	t	2026-06-28 08:42:33.2096+05:30
17	1	CSES103	Basic Electronics Engineering	3	THEORY	1	t	2026-06-28 08:42:33.2096+05:30
18	1	CSBL101	Physics Lab	2	LAB	1	t	2026-06-28 08:42:33.2096+05:30
19	1	CSEL102	Basic Electronics Lab	2	LAB	1	t	2026-06-28 08:42:33.2096+05:30
20	1	CSEL103	Engineering Graphics & Design Lab	3	LAB	1	t	2026-06-28 08:42:33.2096+05:30
21	1	CSHL104	Design Thinking	1	LAB	1	t	2026-06-28 08:42:33.2096+05:30
22	1	CSAU105	IDEA Lab Workshop	0	LAB	1	t	2026-06-28 08:42:33.2096+05:30
23	1	CSHS201	English	3	THEORY	2	t	2026-06-28 08:42:33.2096+05:30
24	1	CSBS202	Mathematics-II	4	THEORY	2	t	2026-06-28 08:42:33.2096+05:30
25	1	CSBS203	Chemistry	3	THEORY	2	t	2026-06-28 08:42:33.2096+05:30
26	1	CSES204	Programming for Problem Solving	3	THEORY	2	t	2026-06-28 08:42:33.2096+05:30
27	1	CSHS205	Universal Human Values-II	3	THEORY	2	t	2026-06-28 08:42:33.2096+05:30
28	1	CSBL201	Chemistry Lab	2	LAB	2	t	2026-06-28 08:42:33.2096+05:30
29	1	CSEL202	Programming for Problem Solving Lab	2	LAB	2	t	2026-06-28 08:42:33.2096+05:30
30	1	CSEL203	Workshop/Manufacturing Lab	3	LAB	2	t	2026-06-28 08:42:33.2096+05:30
31	1	CSAU204	Sports and Yoga	0	LAB	2	t	2026-06-28 08:42:33.2096+05:30
32	1	CSES301	Microprocessor and Microcontroller	3	THEORY	3	t	2026-06-28 08:42:33.2096+05:30
33	1	CSPC302	Data Structures and Algorithms	3	THEORY	3	t	2026-06-28 08:42:33.2096+05:30
34	1	CSES303	Digital Electronics and Systems	3	THEORY	3	t	2026-06-28 08:42:33.2096+05:30
35	1	CSBS304	Mathematics-III	3	THEORY	3	t	2026-06-28 08:42:33.2096+05:30
36	1	CSHS305	Principles of Management	3	THEORY	3	t	2026-06-28 08:42:33.2096+05:30
37	1	CSEL301	Microprocessor and Microcontroller Lab	2	LAB	3	t	2026-06-28 08:42:33.2096+05:30
38	1	CSPL302	Data Structure and Algorithms Lab	2	LAB	3	t	2026-06-28 08:42:33.2096+05:30
39	1	CSEL303	Digital Electronics and System Lab	2	LAB	3	t	2026-06-28 08:42:33.2096+05:30
40	1	CSPL304	IT Workshop (SciLab/MATLAB)	3	LAB	3	t	2026-06-28 08:42:33.2096+05:30
41	1	CSPC401	Discrete Mathematics	4	THEORY	4	t	2026-06-28 08:42:33.2096+05:30
42	1	CSPC402	Computer Organization & Architecture	3	THEORY	4	t	2026-06-28 08:42:33.2096+05:30
43	1	CSPC403	Design & Analysis of Algorithms	3	THEORY	4	t	2026-06-28 08:42:33.2096+05:30
44	1	CSPC404	Advanced Programming in JAVA	3	THEORY	4	t	2026-06-28 08:42:33.2096+05:30
45	1	CSHS405	Organizational Behaviour	3	THEORY	4	t	2026-06-28 08:42:33.2096+05:30
46	1	CSMC406	Environmental Sciences	0	THEORY	4	t	2026-06-28 08:42:33.2096+05:30
47	1	CSPL401	Computer Organization & Architecture Lab	2	LAB	4	t	2026-06-28 08:42:33.2096+05:30
48	1	CSPL402	Design & Analysis of Algorithms Lab	2	LAB	4	t	2026-06-28 08:42:33.2096+05:30
49	1	CSPL403	JAVA Programming Lab	2	LAB	4	t	2026-06-28 08:42:33.2096+05:30
50	1	CSPC501	Computer Networks	3	THEORY	5	t	2026-06-28 08:42:33.2096+05:30
51	1	CSPC502	Database Systems	3	THEORY	5	t	2026-06-28 08:42:33.2096+05:30
52	1	CSPC503	Theory of Computation	4	THEORY	5	t	2026-06-28 08:42:33.2096+05:30
53	1	CSPC504	Operating System	3	THEORY	5	t	2026-06-28 08:42:33.2096+05:30
54	1	CSPE505	Professional Elective-I	3	ELECTIVE	5	t	2026-06-28 08:42:33.2096+05:30
55	1	CSMC505	Constitution of India	0	THEORY	5	t	2026-06-28 08:42:33.2096+05:30
56	1	CSPL501	Computer Networks Lab	2	LAB	5	t	2026-06-28 08:42:33.2096+05:30
57	1	CSPL502	Database Systems Lab	2	LAB	5	t	2026-06-28 08:42:33.2096+05:30
58	1	CSPL503	Operating Systems Lab	2	LAB	5	t	2026-06-28 08:42:33.2096+05:30
59	1	CSPC601	Web Technology	3	THEORY	6	t	2026-06-28 08:42:33.2096+05:30
60	1	CSPC602	Compiler Design	3	THEORY	6	t	2026-06-28 08:42:33.2096+05:30
61	1	CSPC603	Distributed Computing System	3	THEORY	6	t	2026-06-28 08:42:33.2096+05:30
62	1	CSPC604	Artificial Intelligence and Machine Learning	4	THEORY	6	t	2026-06-28 08:42:33.2096+05:30
63	1	CSPE605	Professional Elective-II	3	ELECTIVE	6	t	2026-06-28 08:42:33.2096+05:30
64	1	CSPL601	Web Technology Lab	2	LAB	6	t	2026-06-28 08:42:33.2096+05:30
65	1	CSPL602	Compiler Design Lab	2	LAB	6	t	2026-06-28 08:42:33.2096+05:30
66	1	CSPROJ603	Mini Project	3	PROJECT	6	t	2026-06-28 08:42:33.2096+05:30
67	1	CSPC701	Cyber Security	3	THEORY	7	t	2026-06-28 08:42:33.2096+05:30
68	1	CSBS702	Biology	3	THEORY	7	t	2026-06-28 08:42:33.2096+05:30
69	1	CSPE703	Professional Elective-III	3	ELECTIVE	7	t	2026-06-28 08:42:33.2096+05:30
70	1	CSOE704	Open Elective-I	3	ELECTIVE	7	t	2026-06-28 08:42:33.2096+05:30
71	1	CSPL701	Cyber Security Lab	2	LAB	7	t	2026-06-28 08:42:33.2096+05:30
72	1	CSPROJ702	Seminar	1	PROJECT	7	t	2026-06-28 08:42:33.2096+05:30
73	1	CSPROJ703	Capstone Project-I	6	PROJECT	7	t	2026-06-28 08:42:33.2096+05:30
74	1	CSPE801	Professional Elective-IV	3	ELECTIVE	8	t	2026-06-28 08:42:33.2096+05:30
75	1	CSOE802	Open Elective-II	3	ELECTIVE	8	t	2026-06-28 08:42:33.2096+05:30
76	1	CSOE803	Open Elective-III	3	ELECTIVE	8	t	2026-06-28 08:42:33.2096+05:30
77	1	CSPROJ801	Capstone Project-II	6	PROJECT	8	t	2026-06-28 08:42:33.2096+05:30
78	1	CSPROJ802	Internship	1	PROJECT	8	t	2026-06-28 08:42:33.2096+05:30
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, code, hod_id, vision, mission, is_active, created_at, updated_at) FROM stdin;
1	Computer Science and Engineering	CSE	7	\N	\N	t	2026-06-27 07:49:51.945224+05:30	2026-06-27 11:47:08.827876+05:30
5	Electrical and Electronics Engineering	EEE	\N		\N	t	2026-06-28 08:05:49.400562+05:30	\N
2	Electronics and Communication Engineering	ECE	4		\N	t	2026-06-27 07:53:47.316533+05:30	2026-06-28 08:06:44.810643+05:30
3	Mechanical Engineering	MECH	5	\N	\N	t	2026-06-27 07:56:10.278526+05:30	2026-06-28 08:07:10.348386+05:30
4	Biomedical Engineering	BME	15		\N	t	2026-06-28 08:05:31.543616+05:30	2026-06-29 10:30:24.240261+05:30
\.


--
-- Data for Name: discipline_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discipline_records (id, student_id, reported_by_id, incident_type, incident_date, remarks, action_status, action_taken, is_locked, created_at, updated_at) FROM stdin;
6	509	16	NO_ID_CARD	2026-06-28		NOT_INFORMED	\N	t	2026-06-28 15:13:14.965125+05:30	\N
7	509	16	NO_SHOE	2026-06-28		NOT_INFORMED	\N	t	2026-06-28 18:27:56.572785+05:30	\N
8	521	770	NO_SHOE	2026-06-29		NOT_INFORMED	\N	t	2026-06-29 06:38:21.725445+05:30	\N
9	649	770	NO_ID_CARD	2026-06-29		NOT_INFORMED	\N	t	2026-06-29 06:38:53.087908+05:30	\N
41	630	16	NO_ID_CARD	2026-06-29		NOT_INFORMED	\N	t	2026-06-29 10:26:13.827183+05:30	\N
42	509	16	NO_SHOE	2026-06-29		NOT_INFORMED	\N	t	2026-06-29 10:26:42.85683+05:30	\N
\.


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, student_id, course_id, academic_year, semester, enrolled_at) FROM stdin;
\.


--
-- Data for Name: faculty; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faculty (id, user_id, department_id, first_name, last_name, gender, date_of_birth, blood_group, nationality, community, photo_url, college_email, personal_email, phone, alternate_phone, address_line1, address_line2, city, state, pincode, employee_id, designation, qualification, specialization, experience_years, date_of_joining, employment_type, is_active, created_at, updated_at) FROM stdin;
1	6	3	Vishwa	BR	\N	\N	\N	Indian	\N	\N	Vishwacse@svcet.ac.in	\N	9344793687	\N	\N	\N	\N	\N	\N	SVCET001	Professor	\N		\N	\N	\N	t	2026-06-27 08:12:11.662346+05:30	\N
2	7	1	Jane	Doe	\N	\N	\N	Indian	\N	\N	jane.doe@svcet.edu	\N	1234567890	\N	\N	\N	\N	\N	\N	EMP001	Professor	\N	\N	\N	\N	\N	t	2026-06-27 08:13:34.998959+05:30	\N
3	8	1	John	Smith	\N	\N	\N	Indian	\N	\N	john.smith@svcet.edu	\N	0987654321	\N	\N	\N	\N	\N	\N	EMP002	Assistant Professor	\N	\N	\N	\N	\N	t	2026-06-27 08:13:34.998959+05:30	\N
7	16	1	Balaji	N	\N	\N	\N	Indian	\N	\N	csehod@svcet.ac.in	\N	9344793688	\N	\N	\N	\N	\N	\N	cse123	HOD	\N		\N	\N	\N	t	2026-06-27 11:47:08.827876+05:30	\N
8	17	1	Alice	Smith	\N	\N	\N	Indian	\N	\N	alice.smith@svcet.ac.in	\N	9876543210	\N	\N	\N	\N	\N	\N	F101	Assistant Professor	\N	\N	\N	\N	\N	t	2026-06-27 21:33:04.590772+05:30	\N
9	18	1	Bob	Jones	\N	\N	\N	Indian	\N	\N	bob.jones@svcet.ac.in	\N	9876543211	\N	\N	\N	\N	\N	\N	F102	Associate Professor	\N	\N	\N	\N	\N	t	2026-06-27 21:33:04.590772+05:30	\N
10	19	1	Charlie	Brown	\N	\N	\N	Indian	\N	\N	charlie.brown@svcet.ac.in	\N	9876543212	\N	\N	\N	\N	\N	\N	F103	Assistant Professor	\N	\N	\N	\N	\N	t	2026-06-27 21:33:04.590772+05:30	\N
11	24	1	Sarah	Miller	\N	\N	\N	Indian	\N	\N	sarah.miller104@svcet.ac.in	\N	9876568034	\N	\N	\N	\N	\N	\N	F104	Associate Professor	\N	\N	\N	\N	\N	t	2026-06-27 21:35:24.56713+05:30	\N
12	25	1	Jessica	Harris	\N	\N	\N	Indian	\N	\N	jessica.harris105@svcet.ac.in	\N	9876587881	\N	\N	\N	\N	\N	\N	F105	Assistant Professor	\N	\N	\N	\N	\N	t	2026-06-27 21:35:24.56713+05:30	\N
13	26	1	Sarah	Lee	\N	\N	\N	Indian	\N	\N	sarah.lee106@svcet.ac.in	\N	9876557803	\N	\N	\N	\N	\N	\N	F106	Professor	\N	\N	\N	\N	\N	t	2026-06-27 21:35:24.56713+05:30	\N
4	9	2	Alice	Johnson	\N	\N	\N	Indian	\N	\N	alice.j@svcet.edu	\N	5555555555	\N	\N	\N	\N	\N	\N	EMP003	HOD	\N		\N	\N	\N	t	2026-06-27 08:13:34.998959+05:30	2026-06-28 08:06:44.810643+05:30
5	14	3	ashwin	t	\N	\N	\N	Indian	\N	\N	ashwin@svcet.ac.in	\N	93447856	\N	\N	\N	\N	\N	\N	1234ed	HOD	\N		\N	\N	\N	t	2026-06-27 11:33:52.482114+05:30	2026-06-28 08:07:10.348386+05:30
14	770	1	VISHWA	BR	\N	\N	\N	Indian	\N	\N	vishwa.labs@gmail.com	\N	7894561233	\N	\N	\N	\N	\N	\N	2345	Professor	\N		\N	\N	\N	t	2026-06-28 18:12:03.335656+05:30	\N
15	771	4	gopi	h	\N	\N	\N	Indian	\N	\N	gopi@gmail.com	\N	6383262279	\N	\N	\N	\N	\N	\N	1234ee	HOD	\N		\N	\N	\N	t	2026-06-29 10:30:24.240261+05:30	\N
\.


--
-- Data for Name: grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grades (id, student_id, course_id, grade_type, marks_obtained, max_marks, academic_year, semester, graded_by_id, remarks, created_at) FROM stdin;
\.


--
-- Data for Name: late_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.late_records (id, student_id, recorded_by_id, date, "time", reason, remarks, created_at, action_status) FROM stdin;
1	508	767	2026-06-28	15:45:14.015452	Traffic	Very late today	2026-06-28 15:45:14.013898+05:30	NOT_INFORMED
2	508	767	2026-06-28	15:46:16.099825	Bus Delay		2026-06-28 15:46:16.085594+05:30	NOT_INFORMED
3	508	767	2026-06-28	15:50:54.713509	Bus Delay	Testing drill down update	2026-06-28 15:50:54.703712+05:30	LETTER_GIVEN
4	511	767	2026-06-28	16:11:24.658508	\N	\N	2026-06-28 16:11:24.655945+05:30	INFORMED
5	573	767	2026-06-29	06:46:20.931285	\N	\N	2026-06-29 06:46:20.927642+05:30	INFORMED
6	509	767	2026-06-29	10:27:47.44034	\N	\N	2026-06-29 10:27:47.438137+05:30	INFORMED
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, student_id, leave_type, from_date, to_date, reason, status, mentor_approved_by, mentor_approved_at, hod_approved_by, hod_approved_at, rejection_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lms_resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lms_resources (id, course_id, uploaded_by_id, title, description, resource_type, file_url, external_link, created_at) FROM stdin;
\.


--
-- Data for Name: mentor_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.mentor_assignments (id, mentor_id, student_id, academic_year, assigned_at) FROM stdin;
7	2	508	2026-2027	2026-06-28 14:34:41.865478+05:30
8	2	509	2026-2027	2026-06-28 14:34:44.093173+05:30
9	2	510	2026-2027	2026-06-28 14:34:49.647128+05:30
10	2	511	2026-2027	2026-06-28 14:34:51.418584+05:30
11	2	512	2026-2027	2026-06-28 14:34:53.111366+05:30
12	2	513	2026-2027	2026-06-28 14:34:54.846927+05:30
13	2	514	2026-2027	2026-06-28 14:34:56.910656+05:30
14	2	515	2026-2027	2026-06-28 14:34:58.592269+05:30
15	2	516	2026-2027	2026-06-28 14:35:00.098362+05:30
16	2	517	2026-2027	2026-06-28 14:35:01.861348+05:30
17	3	518	2026-2027	2026-06-28 14:35:07.382523+05:30
18	3	519	2026-2027	2026-06-28 14:35:09.18839+05:30
19	3	520	2026-2027	2026-06-28 14:35:10.713192+05:30
20	3	521	2026-2027	2026-06-28 14:35:12.208212+05:30
21	3	522	2026-2027	2026-06-28 14:35:13.830906+05:30
22	3	538	2026-2027	2026-06-28 14:35:15.406066+05:30
23	3	539	2026-2027	2026-06-28 14:35:17.155866+05:30
24	3	540	2026-2027	2026-06-28 14:35:18.82603+05:30
25	3	541	2026-2027	2026-06-28 14:35:20.629209+05:30
26	3	542	2026-2027	2026-06-28 14:35:22.40657+05:30
27	8	543	2026-2027	2026-06-28 14:35:25.318105+05:30
28	8	544	2026-2027	2026-06-28 14:35:26.734404+05:30
29	8	545	2026-2027	2026-06-28 14:35:28.529282+05:30
30	8	546	2026-2027	2026-06-28 14:35:29.999797+05:30
31	8	547	2026-2027	2026-06-28 14:35:31.690215+05:30
32	8	548	2026-2027	2026-06-28 14:35:35.974063+05:30
33	8	549	2026-2027	2026-06-28 14:35:37.704464+05:30
34	8	550	2026-2027	2026-06-28 14:35:39.513259+05:30
35	8	551	2026-2027	2026-06-28 14:35:41.627029+05:30
36	8	552	2026-2027	2026-06-28 14:35:43.340702+05:30
37	10	583	2026-2027	2026-06-29 10:25:27.794267+05:30
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (id, department_id, name, year, batch, class_advisor_id, is_active, created_at) FROM stdin;
8	1	B	4	2023-2027	\N	t	2026-06-28 07:41:10.525452+05:30
9	1	A	3	2024-2028	\N	t	2026-06-28 07:41:10.52776+05:30
10	1	B	3	2024-2028	\N	t	2026-06-28 07:41:10.529657+05:30
11	1	A	2	2025-2029	\N	t	2026-06-28 07:41:10.531299+05:30
12	1	B	2	2025-2029	\N	t	2026-06-28 07:41:10.533128+05:30
13	1	A	1	2026-2030	\N	t	2026-06-28 07:41:10.534902+05:30
14	1	B	1	2026-2030	\N	t	2026-06-28 07:41:10.536652+05:30
7	1	A	4	2023-2027	2	t	2026-06-28 07:41:10.522625+05:30
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, user_id, department_id, section_id, first_name, last_name, register_number, gender, date_of_birth, blood_group, nationality, community, photo_url, batch, current_year, current_semester, college_email, personal_email, phone, father_name, father_phone, father_occupation, mother_name, mother_phone, mother_occupation, annual_income, address_line1, address_line2, city, state, pincode, tenth_school, tenth_board, tenth_marks, tenth_percentage, twelfth_school, twelfth_board, twelfth_marks, twelfth_percentage, admission_date, admission_type, is_active, created_at, updated_at) FROM stdin;
508	527	1	7	Krishna	Kumar	23CSE001A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	krishna.kumar231@svcet.edu	\N	9862004049	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
509	528	1	7	Riya	Kumar	23CSE002A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	riya.kumar232@svcet.edu	\N	9883943885	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
510	529	1	7	Isha	Kumar	23CSE003A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	isha.kumar233@svcet.edu	\N	9815983147	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
511	530	1	7	Aarohi	Nair	23CSE004A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aarohi.nair234@svcet.edu	\N	9896472219	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
512	531	1	7	Pooja	Bose	23CSE005A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	pooja.bose235@svcet.edu	\N	9856489170	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
513	532	1	7	Sai	Kumar	23CSE006A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sai.kumar236@svcet.edu	\N	9888768786	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
514	533	1	7	Reyansh	Nair	23CSE007A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	reyansh.nair237@svcet.edu	\N	9814390517	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
515	534	1	7	Isha	Nair	23CSE008A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	isha.nair238@svcet.edu	\N	9845735183	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
516	535	1	7	Sanya	Rao	23CSE009A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sanya.rao239@svcet.edu	\N	9817392782	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
517	536	1	7	Kavya	Kumar	23CSE010A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	kavya.kumar2310@svcet.edu	\N	9833898367	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
518	537	1	7	Pooja	Rao	23CSE011A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	pooja.rao2311@svcet.edu	\N	9877815338	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
519	538	1	7	Aarav	Nair	23CSE012A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aarav.nair2312@svcet.edu	\N	9884319359	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
520	539	1	7	Arjun	Sharma	23CSE013A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	arjun.sharma2313@svcet.edu	\N	9835882202	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
521	540	1	7	Ayaan	Kumar	23CSE014A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	ayaan.kumar2314@svcet.edu	\N	9840676152	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
522	541	1	7	Sanya	Menon	23CSE015A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sanya.menon2315@svcet.edu	\N	9869756126	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
523	542	1	8	Sai	Singh	23CSE016A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sai.singh2316@svcet.edu	\N	9813813745	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
524	543	1	8	Vihaan	Menon	23CSE017A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	vihaan.menon2317@svcet.edu	\N	9843839489	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
525	544	1	8	Reyansh	Kumar	23CSE018A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	reyansh.kumar2318@svcet.edu	\N	9877243499	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
526	545	1	8	Arjun	Menon	23CSE019A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	arjun.menon2319@svcet.edu	\N	9842953035	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
527	546	1	8	Aarohi	Sharma	23CSE020A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aarohi.sharma2320@svcet.edu	\N	9823807579	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
528	547	1	8	Aditya	Sharma	23CSE021A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aditya.sharma2321@svcet.edu	\N	9810559155	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
529	548	1	8	Ananya	Gupta	23CSE022A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	ananya.gupta2322@svcet.edu	\N	9813327859	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
530	549	1	8	Neha	Das	23CSE023A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	neha.das2323@svcet.edu	\N	9879119022	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
531	550	1	8	Vivaan	Reddy	23CSE024A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	vivaan.reddy2324@svcet.edu	\N	9885583157	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
532	551	1	8	Ishaan	Nair	23CSE025A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	ishaan.nair2325@svcet.edu	\N	9851199081	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
533	552	1	8	Neha	Menon	23CSE026A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	neha.menon2326@svcet.edu	\N	9869855013	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
534	553	1	8	Arjun	Patel	23CSE027A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	arjun.patel2327@svcet.edu	\N	9877603243	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
535	554	1	8	Vihaan	Nair	23CSE028A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	vihaan.nair2328@svcet.edu	\N	9855234404	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
536	555	1	8	Aarohi	Verma	23CSE029A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aarohi.verma2329@svcet.edu	\N	9841285738	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
537	556	1	8	Riya	Nair	23CSE030A	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	riya.nair2330@svcet.edu	\N	9886849363	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
538	557	1	7	Vivaan	Pillai	23CSE001B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	vivaan.pillai231@svcet.edu	\N	9857309009	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
539	558	1	7	Sanya	Singh	23CSE002B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sanya.singh232@svcet.edu	\N	9871300603	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
540	559	1	7	Ishaan	Sharma	23CSE003B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	ishaan.sharma233@svcet.edu	\N	9825578822	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
541	560	1	7	Sneha	Patel	23CSE004B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sneha.patel234@svcet.edu	\N	9831730518	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
542	561	1	7	Reyansh	Gupta	23CSE005B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	reyansh.gupta235@svcet.edu	\N	9841681132	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
543	562	1	7	Neha	Reddy	23CSE006B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	neha.reddy236@svcet.edu	\N	9882739403	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
544	563	1	7	Isha	Das	23CSE007B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	isha.das237@svcet.edu	\N	9899786367	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
545	564	1	7	Kavya	Bose	23CSE008B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	kavya.bose238@svcet.edu	\N	9882483499	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
546	565	1	7	Kavya	Sharma	23CSE009B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	kavya.sharma239@svcet.edu	\N	9820530903	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
547	566	1	7	Aditya	Verma	23CSE010B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aditya.verma2310@svcet.edu	\N	9875845053	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
548	567	1	7	Arjun	Patel	23CSE011B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	arjun.patel2311@svcet.edu	\N	9892238922	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
549	568	1	7	Sanya	Nair	23CSE012B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sanya.nair2312@svcet.edu	\N	9820093921	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
550	569	1	7	Neha	Pillai	23CSE013B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	neha.pillai2313@svcet.edu	\N	9876043472	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
551	570	1	7	Sneha	Menon	23CSE014B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sneha.menon2314@svcet.edu	\N	9866491852	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
552	571	1	7	Krishna	Sharma	23CSE015B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	krishna.sharma2315@svcet.edu	\N	9816147568	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
553	572	1	8	Ananya	Reddy	23CSE016B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	ananya.reddy2316@svcet.edu	\N	9845851841	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
554	573	1	8	Vihaan	Bose	23CSE017B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	vihaan.bose2317@svcet.edu	\N	9821682098	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
555	574	1	8	Ishaan	Das	23CSE018B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	ishaan.das2318@svcet.edu	\N	9884729838	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
556	575	1	8	Krishna	Verma	23CSE019B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	krishna.verma2319@svcet.edu	\N	9871075244	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
557	576	1	8	Sai	Gupta	23CSE020B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sai.gupta2320@svcet.edu	\N	9888503724	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
558	577	1	8	Neha	Patel	23CSE021B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	neha.patel2321@svcet.edu	\N	9896068034	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
559	578	1	8	Aarav	Verma	23CSE022B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aarav.verma2322@svcet.edu	\N	9883471065	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
560	579	1	8	Sai	Bose	23CSE023B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sai.bose2323@svcet.edu	\N	9863984501	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
561	580	1	8	Krishna	Bose	23CSE024B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	krishna.bose2324@svcet.edu	\N	9895003030	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
562	581	1	8	Kavya	Sharma	23CSE025B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	kavya.sharma2325@svcet.edu	\N	9861543308	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
563	582	1	8	Isha	Menon	23CSE026B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	isha.menon2326@svcet.edu	\N	9815689752	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
564	583	1	8	Ishaan	Patel	23CSE027B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	ishaan.patel2327@svcet.edu	\N	9852591359	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
565	584	1	8	Riya	Rao	23CSE028B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	riya.rao2328@svcet.edu	\N	9881338481	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
566	585	1	8	Sanya	Reddy	23CSE029B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	sanya.reddy2329@svcet.edu	\N	9851038630	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
567	586	1	8	Aditya	Sharma	23CSE030B	\N	\N	\N	Indian	\N	\N	2023-2027	4	7	aditya.sharma2330@svcet.edu	\N	9823370342	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
568	587	1	9	Ishaan	Das	24CSE001A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ishaan.das241@svcet.edu	\N	9888268305	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
569	588	1	9	Isha	Kumar	24CSE002A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	isha.kumar242@svcet.edu	\N	9810166846	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
570	589	1	9	Reyansh	Sharma	24CSE003A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	reyansh.sharma243@svcet.edu	\N	9817680370	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
571	590	1	9	Isha	Reddy	24CSE004A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	isha.reddy244@svcet.edu	\N	9820980259	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
572	591	1	9	Kavya	Patel	24CSE005A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	kavya.patel245@svcet.edu	\N	9838546409	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
573	592	1	9	Sneha	Verma	24CSE006A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	sneha.verma246@svcet.edu	\N	9823011016	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
574	593	1	9	Krishna	Nair	24CSE007A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	krishna.nair247@svcet.edu	\N	9859449265	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
575	594	1	9	Sai	Rao	24CSE008A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	sai.rao248@svcet.edu	\N	9819411797	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
576	595	1	9	Arjun	Patel	24CSE009A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	arjun.patel249@svcet.edu	\N	9892739321	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
577	596	1	9	Ayaan	Patel	24CSE010A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ayaan.patel2410@svcet.edu	\N	9811740221	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
578	597	1	9	Isha	Menon	24CSE011A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	isha.menon2411@svcet.edu	\N	9853457480	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
579	598	1	9	Ishaan	Kumar	24CSE012A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ishaan.kumar2412@svcet.edu	\N	9824957377	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
580	599	1	9	Neha	Singh	24CSE013A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	neha.singh2413@svcet.edu	\N	9880684542	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
581	600	1	9	Arjun	Kumar	24CSE014A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	arjun.kumar2414@svcet.edu	\N	9883657125	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
582	601	1	9	Reyansh	Pillai	24CSE015A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	reyansh.pillai2415@svcet.edu	\N	9877147181	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
583	602	1	10	Vivaan	Kumar	24CSE016A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	vivaan.kumar2416@svcet.edu	\N	9813579603	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
584	603	1	10	Vihaan	Nair	24CSE017A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	vihaan.nair2417@svcet.edu	\N	9889393132	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
585	604	1	10	Sneha	Nair	24CSE018A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	sneha.nair2418@svcet.edu	\N	9832801011	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
586	605	1	10	Ananya	Bose	24CSE019A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ananya.bose2419@svcet.edu	\N	9849841419	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
587	606	1	10	Pooja	Sharma	24CSE020A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	pooja.sharma2420@svcet.edu	\N	9842812618	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
588	607	1	10	Sanya	Gupta	24CSE021A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	sanya.gupta2421@svcet.edu	\N	9896957391	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
589	608	1	10	Reyansh	Gupta	24CSE022A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	reyansh.gupta2422@svcet.edu	\N	9847295198	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
590	609	1	10	Isha	Bose	24CSE023A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	isha.bose2423@svcet.edu	\N	9882713780	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
591	610	1	10	Ishaan	Verma	24CSE024A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ishaan.verma2424@svcet.edu	\N	9887644151	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
592	611	1	10	Diya	Bose	24CSE025A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	diya.bose2425@svcet.edu	\N	9813981096	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
593	612	1	10	Riya	Bose	24CSE026A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	riya.bose2426@svcet.edu	\N	9867307414	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
594	613	1	10	Isha	Reddy	24CSE027A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	isha.reddy2427@svcet.edu	\N	9834366394	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
595	614	1	10	Arjun	Pillai	24CSE028A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	arjun.pillai2428@svcet.edu	\N	9814753009	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
596	615	1	10	Ayaan	Menon	24CSE029A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ayaan.menon2429@svcet.edu	\N	9850955062	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
597	616	1	10	Ayaan	Das	24CSE030A	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ayaan.das2430@svcet.edu	\N	9855386202	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
598	617	1	9	Aditya	Rao	24CSE001B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	aditya.rao241@svcet.edu	\N	9834651400	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
599	618	1	9	Ayaan	Kumar	24CSE002B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ayaan.kumar242@svcet.edu	\N	9824534296	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
600	619	1	9	Aarohi	Verma	24CSE003B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	aarohi.verma243@svcet.edu	\N	9879252390	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
601	620	1	9	Sanya	Gupta	24CSE004B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	sanya.gupta244@svcet.edu	\N	9868631073	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
602	621	1	9	Ishaan	Menon	24CSE005B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ishaan.menon245@svcet.edu	\N	9885356918	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
603	622	1	9	Aarohi	Nair	24CSE006B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	aarohi.nair246@svcet.edu	\N	9830979299	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
604	623	1	9	Riya	Nair	24CSE007B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	riya.nair247@svcet.edu	\N	9849051729	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
605	624	1	9	Vivaan	Singh	24CSE008B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	vivaan.singh248@svcet.edu	\N	9859813687	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
606	625	1	9	Vihaan	Kumar	24CSE009B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	vihaan.kumar249@svcet.edu	\N	9840800441	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
607	626	1	9	Isha	Sharma	24CSE010B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	isha.sharma2410@svcet.edu	\N	9841830752	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
608	627	1	9	Kavya	Patel	24CSE011B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	kavya.patel2411@svcet.edu	\N	9841668021	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
609	628	1	9	Diya	Nair	24CSE012B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	diya.nair2412@svcet.edu	\N	9875880712	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
610	629	1	9	Neha	Sharma	24CSE013B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	neha.sharma2413@svcet.edu	\N	9855556196	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
611	630	1	9	Aarohi	Nair	24CSE014B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	aarohi.nair2414@svcet.edu	\N	9892114949	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
612	631	1	9	Krishna	Reddy	24CSE015B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	krishna.reddy2415@svcet.edu	\N	9869133649	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
613	632	1	10	Ishaan	Verma	24CSE016B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	ishaan.verma2416@svcet.edu	\N	9888318518	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
614	633	1	10	Aarav	Patel	24CSE017B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	aarav.patel2417@svcet.edu	\N	9885032191	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
615	634	1	10	Sai	Das	24CSE018B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	sai.das2418@svcet.edu	\N	9815302299	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
616	635	1	10	Neha	Das	24CSE019B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	neha.das2419@svcet.edu	\N	9844335814	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
617	636	1	10	Riya	Gupta	24CSE020B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	riya.gupta2420@svcet.edu	\N	9829553702	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
618	637	1	10	Pooja	Kumar	24CSE021B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	pooja.kumar2421@svcet.edu	\N	9828883682	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
619	638	1	10	Vihaan	Reddy	24CSE022B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	vihaan.reddy2422@svcet.edu	\N	9847232366	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
620	639	1	10	Vihaan	Menon	24CSE023B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	vihaan.menon2423@svcet.edu	\N	9844225265	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
621	640	1	10	Krishna	Das	24CSE024B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	krishna.das2424@svcet.edu	\N	9828236619	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
622	641	1	10	Riya	Sharma	24CSE025B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	riya.sharma2425@svcet.edu	\N	9829565410	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
623	642	1	10	Kavya	Menon	24CSE026B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	kavya.menon2426@svcet.edu	\N	9872307355	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
624	643	1	10	Reyansh	Menon	24CSE027B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	reyansh.menon2427@svcet.edu	\N	9859151951	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
625	644	1	10	Reyansh	Patel	24CSE028B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	reyansh.patel2428@svcet.edu	\N	9843826681	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
626	645	1	10	Kavya	Kumar	24CSE029B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	kavya.kumar2429@svcet.edu	\N	9871736489	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
627	646	1	10	Pooja	Pillai	24CSE030B	\N	\N	\N	Indian	\N	\N	2024-2028	3	5	pooja.pillai2430@svcet.edu	\N	9893574032	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
628	647	1	11	Ananya	Pillai	25CSE001A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ananya.pillai251@svcet.edu	\N	9860462571	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
629	648	1	11	Sneha	Reddy	25CSE002A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	sneha.reddy252@svcet.edu	\N	9894573332	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
630	649	1	11	Reyansh	Bose	25CSE003A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	reyansh.bose253@svcet.edu	\N	9814157670	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
631	650	1	11	Sneha	Menon	25CSE004A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	sneha.menon254@svcet.edu	\N	9886449361	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
632	651	1	11	Ishaan	Patel	25CSE005A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ishaan.patel255@svcet.edu	\N	9868547714	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
633	652	1	11	Vihaan	Gupta	25CSE006A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vihaan.gupta256@svcet.edu	\N	9846826771	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
634	653	1	11	Ishaan	Singh	25CSE007A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ishaan.singh257@svcet.edu	\N	9875822591	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
635	654	1	11	Isha	Singh	25CSE008A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	isha.singh258@svcet.edu	\N	9815620094	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
636	655	1	11	Riya	Singh	25CSE009A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	riya.singh259@svcet.edu	\N	9852249329	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
637	656	1	11	Aditya	Nair	25CSE010A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aditya.nair2510@svcet.edu	\N	9851227235	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
638	657	1	11	Ishaan	Gupta	25CSE011A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ishaan.gupta2511@svcet.edu	\N	9844124166	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
639	658	1	11	Diya	Nair	25CSE012A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	diya.nair2512@svcet.edu	\N	9887256459	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
640	659	1	11	Aarav	Bose	25CSE013A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aarav.bose2513@svcet.edu	\N	9856661394	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
641	660	1	11	Ishaan	Menon	25CSE014A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ishaan.menon2514@svcet.edu	\N	9868205610	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
642	661	1	11	Kavya	Patel	25CSE015A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	kavya.patel2515@svcet.edu	\N	9815663605	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
643	662	1	12	Ayaan	Patel	25CSE016A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ayaan.patel2516@svcet.edu	\N	9811455541	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
644	663	1	12	Sai	Menon	25CSE017A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	sai.menon2517@svcet.edu	\N	9878921696	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
645	664	1	12	Vivaan	Nair	25CSE018A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vivaan.nair2518@svcet.edu	\N	9896840809	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
646	665	1	12	Pooja	Bose	25CSE019A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	pooja.bose2519@svcet.edu	\N	9825927411	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
647	666	1	12	Vivaan	Rao	25CSE020A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vivaan.rao2520@svcet.edu	\N	9832042366	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
648	667	1	12	Pooja	Sharma	25CSE021A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	pooja.sharma2521@svcet.edu	\N	9833370142	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
649	668	1	12	Vivaan	Verma	25CSE022A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vivaan.verma2522@svcet.edu	\N	9822764810	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
650	669	1	12	Kavya	Singh	25CSE023A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	kavya.singh2523@svcet.edu	\N	9856865327	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
651	670	1	12	Aarav	Nair	25CSE024A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aarav.nair2524@svcet.edu	\N	9836960436	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
652	671	1	12	Neha	Bose	25CSE025A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	neha.bose2525@svcet.edu	\N	9838185320	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
653	672	1	12	Aditya	Sharma	25CSE026A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aditya.sharma2526@svcet.edu	\N	9836993200	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
654	673	1	12	Arjun	Patel	25CSE027A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	arjun.patel2527@svcet.edu	\N	9845667861	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
655	674	1	12	Isha	Verma	25CSE028A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	isha.verma2528@svcet.edu	\N	9822263731	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
656	675	1	12	Diya	Pillai	25CSE029A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	diya.pillai2529@svcet.edu	\N	9881112151	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
657	676	1	12	Diya	Singh	25CSE030A	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	diya.singh2530@svcet.edu	\N	9838557695	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
658	677	1	11	Aarohi	Gupta	25CSE001B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aarohi.gupta251@svcet.edu	\N	9875684510	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
659	678	1	11	Sanya	Rao	25CSE002B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	sanya.rao252@svcet.edu	\N	9867167157	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
660	679	1	11	Aarohi	Reddy	25CSE003B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aarohi.reddy253@svcet.edu	\N	9875632683	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
661	680	1	11	Reyansh	Patel	25CSE004B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	reyansh.patel254@svcet.edu	\N	9846383207	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
662	681	1	11	Sanya	Pillai	25CSE005B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	sanya.pillai255@svcet.edu	\N	9877002900	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
663	682	1	11	Sai	Reddy	25CSE006B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	sai.reddy256@svcet.edu	\N	9896724048	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
664	683	1	11	Vihaan	Rao	25CSE007B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vihaan.rao257@svcet.edu	\N	9819470804	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
665	684	1	11	Krishna	Gupta	25CSE008B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	krishna.gupta258@svcet.edu	\N	9876182870	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
666	685	1	11	Vivaan	Rao	25CSE009B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vivaan.rao259@svcet.edu	\N	9818510663	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
667	686	1	11	Aarav	Sharma	25CSE010B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aarav.sharma2510@svcet.edu	\N	9865377661	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
668	687	1	11	Neha	Patel	25CSE011B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	neha.patel2511@svcet.edu	\N	9843653805	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
669	688	1	11	Arjun	Verma	25CSE012B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	arjun.verma2512@svcet.edu	\N	9814237739	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
670	689	1	11	Ananya	Das	25CSE013B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ananya.das2513@svcet.edu	\N	9836924711	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
671	690	1	11	Diya	Bose	25CSE014B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	diya.bose2514@svcet.edu	\N	9894634957	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
672	691	1	11	Ayaan	Bose	25CSE015B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ayaan.bose2515@svcet.edu	\N	9890970955	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
673	692	1	12	Aditya	Gupta	25CSE016B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aditya.gupta2516@svcet.edu	\N	9840405284	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
674	693	1	12	Neha	Sharma	25CSE017B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	neha.sharma2517@svcet.edu	\N	9848988636	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
675	694	1	12	Vivaan	Bose	25CSE018B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vivaan.bose2518@svcet.edu	\N	9899386729	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
676	695	1	12	Vivaan	Gupta	25CSE019B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vivaan.gupta2519@svcet.edu	\N	9815058240	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
677	696	1	12	Diya	Singh	25CSE020B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	diya.singh2520@svcet.edu	\N	9892148647	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
678	697	1	12	Ishaan	Singh	25CSE021B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ishaan.singh2521@svcet.edu	\N	9878237753	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
679	698	1	12	Ishaan	Gupta	25CSE022B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	ishaan.gupta2522@svcet.edu	\N	9819184428	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
680	699	1	12	Isha	Gupta	25CSE023B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	isha.gupta2523@svcet.edu	\N	9869405360	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
681	700	1	12	Reyansh	Gupta	25CSE024B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	reyansh.gupta2524@svcet.edu	\N	9857093852	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
682	701	1	12	Vivaan	Reddy	25CSE025B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	vivaan.reddy2525@svcet.edu	\N	9864522668	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
683	702	1	12	Krishna	Sharma	25CSE026B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	krishna.sharma2526@svcet.edu	\N	9847929435	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
684	703	1	12	Aarohi	Patel	25CSE027B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aarohi.patel2527@svcet.edu	\N	9858472077	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
685	704	1	12	Aarav	Sharma	25CSE028B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aarav.sharma2528@svcet.edu	\N	9894759251	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
686	705	1	12	Aditya	Singh	25CSE029B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	aditya.singh2529@svcet.edu	\N	9835862723	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
687	706	1	12	Sanya	Sharma	25CSE030B	\N	\N	\N	Indian	\N	\N	2025-2029	2	3	sanya.sharma2530@svcet.edu	\N	9896401055	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
688	707	1	13	Sai	Das	26CSE001A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sai.das261@svcet.edu	\N	9889247677	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
689	708	1	13	Neha	Verma	26CSE002A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.verma262@svcet.edu	\N	9817154160	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
690	709	1	13	Kavya	Reddy	26CSE003A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	kavya.reddy263@svcet.edu	\N	9851139239	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
691	710	1	13	Isha	Kumar	26CSE004A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	isha.kumar264@svcet.edu	\N	9856565629	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
692	711	1	13	Aditya	Verma	26CSE005A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aditya.verma265@svcet.edu	\N	9848570554	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
693	712	1	13	Arjun	Das	26CSE006A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	arjun.das266@svcet.edu	\N	9837082467	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
694	713	1	13	Isha	Menon	26CSE007A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	isha.menon267@svcet.edu	\N	9813093158	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
695	714	1	13	Aarohi	Gupta	26CSE008A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aarohi.gupta268@svcet.edu	\N	9846789884	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
696	715	1	13	Aditya	Das	26CSE009A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aditya.das269@svcet.edu	\N	9890971192	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
697	716	1	13	Sanya	Patel	26CSE010A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sanya.patel2610@svcet.edu	\N	9818550782	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
698	717	1	13	Sai	Kumar	26CSE011A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sai.kumar2611@svcet.edu	\N	9878282250	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
699	718	1	13	Krishna	Gupta	26CSE012A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	krishna.gupta2612@svcet.edu	\N	9832153599	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
700	719	1	13	Aditya	Rao	26CSE013A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aditya.rao2613@svcet.edu	\N	9865798104	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
701	720	1	13	Aditya	Das	26CSE014A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aditya.das2614@svcet.edu	\N	9898766390	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
702	721	1	13	Neha	Nair	26CSE015A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.nair2615@svcet.edu	\N	9875254042	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
703	722	1	14	Neha	Nair	26CSE016A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.nair2616@svcet.edu	\N	9892565031	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
704	723	1	14	Neha	Verma	26CSE017A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.verma2617@svcet.edu	\N	9846836540	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
705	724	1	14	Krishna	Rao	26CSE018A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	krishna.rao2618@svcet.edu	\N	9834248708	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
706	725	1	14	Neha	Nair	26CSE019A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.nair2619@svcet.edu	\N	9818045926	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
707	726	1	14	Riya	Bose	26CSE020A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	riya.bose2620@svcet.edu	\N	9870764568	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
708	727	1	14	Kavya	Patel	26CSE021A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	kavya.patel2621@svcet.edu	\N	9853850402	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
709	728	1	14	Sneha	Menon	26CSE022A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sneha.menon2622@svcet.edu	\N	9818211960	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
710	729	1	14	Sanya	Patel	26CSE023A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sanya.patel2623@svcet.edu	\N	9821208119	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
711	730	1	14	Kavya	Gupta	26CSE024A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	kavya.gupta2624@svcet.edu	\N	9876210588	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
712	731	1	14	Pooja	Menon	26CSE025A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	pooja.menon2625@svcet.edu	\N	9832011812	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
713	732	1	14	Neha	Pillai	26CSE026A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.pillai2626@svcet.edu	\N	9846909729	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
714	733	1	14	Diya	Menon	26CSE027A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	diya.menon2627@svcet.edu	\N	9850198567	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
715	734	1	14	Isha	Rao	26CSE028A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	isha.rao2628@svcet.edu	\N	9835366872	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
716	735	1	14	Sai	Rao	26CSE029A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sai.rao2629@svcet.edu	\N	9867078749	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
717	736	1	14	Isha	Das	26CSE030A	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	isha.das2630@svcet.edu	\N	9883978150	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
718	737	1	13	Krishna	Singh	26CSE001B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	krishna.singh261@svcet.edu	\N	9868348306	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
719	738	1	13	Neha	Reddy	26CSE002B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.reddy262@svcet.edu	\N	9895577571	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
720	739	1	13	Reyansh	Bose	26CSE003B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	reyansh.bose263@svcet.edu	\N	9848497740	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
721	740	1	13	Neha	Bose	26CSE004B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.bose264@svcet.edu	\N	9824805441	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
722	741	1	13	Pooja	Bose	26CSE005B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	pooja.bose265@svcet.edu	\N	9875467287	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
723	742	1	13	Aarohi	Gupta	26CSE006B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aarohi.gupta266@svcet.edu	\N	9819641459	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
724	743	1	13	Sanya	Pillai	26CSE007B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sanya.pillai267@svcet.edu	\N	9822184049	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
725	744	1	13	Pooja	Patel	26CSE008B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	pooja.patel268@svcet.edu	\N	9861143555	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
726	745	1	13	Aarav	Menon	26CSE009B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aarav.menon269@svcet.edu	\N	9860003995	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
727	746	1	13	Neha	Rao	26CSE010B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.rao2610@svcet.edu	\N	9860649260	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
728	747	1	13	Krishna	Rao	26CSE011B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	krishna.rao2611@svcet.edu	\N	9824532619	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
729	748	1	13	Diya	Nair	26CSE012B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	diya.nair2612@svcet.edu	\N	9865094232	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
730	749	1	13	Arjun	Das	26CSE013B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	arjun.das2613@svcet.edu	\N	9863946137	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
731	750	1	13	Isha	Singh	26CSE014B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	isha.singh2614@svcet.edu	\N	9872151343	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
732	751	1	13	Pooja	Menon	26CSE015B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	pooja.menon2615@svcet.edu	\N	9854891946	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
733	752	1	14	Diya	Sharma	26CSE016B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	diya.sharma2616@svcet.edu	\N	9886141416	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
734	753	1	14	Neha	Bose	26CSE017B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.bose2617@svcet.edu	\N	9847214315	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
735	754	1	14	Aditya	Nair	26CSE018B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aditya.nair2618@svcet.edu	\N	9841756319	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
736	755	1	14	Sneha	Menon	26CSE019B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	sneha.menon2619@svcet.edu	\N	9852433073	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
737	756	1	14	Krishna	Das	26CSE020B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	krishna.das2620@svcet.edu	\N	9888286613	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
738	757	1	14	Isha	Nair	26CSE021B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	isha.nair2621@svcet.edu	\N	9873382024	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
739	758	1	14	Riya	Sharma	26CSE022B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	riya.sharma2622@svcet.edu	\N	9887125760	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
740	759	1	14	Reyansh	Das	26CSE023B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	reyansh.das2623@svcet.edu	\N	9898057025	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
741	760	1	14	Neha	Singh	26CSE024B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	neha.singh2624@svcet.edu	\N	9890786901	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
742	761	1	14	Krishna	Menon	26CSE025B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	krishna.menon2625@svcet.edu	\N	9846164202	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
743	762	1	14	Vivaan	Nair	26CSE026B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	vivaan.nair2626@svcet.edu	\N	9810474709	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
744	763	1	14	Aditya	Das	26CSE027B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aditya.das2627@svcet.edu	\N	9879015328	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
745	764	1	14	Diya	Bose	26CSE028B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	diya.bose2628@svcet.edu	\N	9852526073	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
746	765	1	14	Ayaan	Singh	26CSE029B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	ayaan.singh2629@svcet.edu	\N	9813737036	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
747	766	1	14	Aarohi	Singh	26CSE030B	\N	\N	\N	Indian	\N	\N	2026-2030	1	1	aarohi.singh2630@svcet.edu	\N	9830782766	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-06-28 08:18:53.174874+05:30	2026-06-28 08:22:06.836657+05:30
\.


--
-- Data for Name: timetable_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.timetable_slots (id, course_assignment_id, day, start_time, end_time, room, created_at) FROM stdin;
41	14	MON	08:45:00	09:30:00		2026-06-29 10:24:18.734334+05:30
42	15	MON	09:30:00	10:20:00		2026-06-29 10:24:18.734334+05:30
43	16	TUE	08:45:00	09:30:00		2026-06-29 10:24:18.734334+05:30
44	16	TUE	11:25:00	12:15:00		2026-06-29 10:24:18.734334+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, hashed_password, role, is_active, created_at, updated_at) FROM stdin;
1	admin@svcet.edu	$2b$12$ZOWo/98uAfU7MMr5DUslbuUENKG9T6GG820lj5I22BaCrzAm0O0/2	ADMIN	t	2026-06-26 18:18:23.030257+05:30	\N
2	hod@svcet.edu	$2b$12$a14Yq7ijEU972FSDeNwBS.cMhp1XMmpnXvp443N4eP6eNhh8Tu2KC	HOD	t	2026-06-26 18:18:23.030257+05:30	\N
3	faculty@svcet.edu	$2b$12$qeYBYZiI3mBvT3zvgivJDOCSb0wukPilspARuFuc.AXGPTHR2BeIK	FACULTY	t	2026-06-26 18:18:23.030257+05:30	\N
4	student@svcet.edu	$2b$12$jjl0lSlwROg7UmVZ9ArgbO2ARxqWbfTmnkY6F2/GQU3B2b2wL7Pq2	STUDENT	t	2026-06-26 18:18:23.030257+05:30	\N
5	authority@svcet.edu	$2b$12$4HBGVrlSe5reDhvUzgt78.dDkfTNOkKUjV2pYTpzeKqQ4aG.UKeW6	AUTHORITY	t	2026-06-26 18:18:23.030257+05:30	\N
6	Vishwacse@svcet.ac.in	$2b$12$elF0nlwbbLKRD0YxhDMH.eDmfjdStcDchGN/rmMf6dFlOR2.Lofya	FACULTY	t	2026-06-27 08:12:11.662346+05:30	\N
7	jane.doe@svcet.edu	$2b$12$sSJin3JkEVpkyayNrWroLed0snFL9Jxp1yiEDxh4zNjWWblYMBA6W	FACULTY	t	2026-06-27 08:13:34.998959+05:30	\N
8	john.smith@svcet.edu	$2b$12$m.1m..RhCqGZo8iuN/Dcl.zm/EwFPyJJA6ppRu9AbdUOX5uTr/vE2	FACULTY	t	2026-06-27 08:13:34.998959+05:30	\N
527	krishna.kumar231@svcet.edu	$2b$12$TWVc2vimaehU26haStxmDOaR6wX10zN57vnzsPnf/dZpnXEUpGrL.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
10	dean@svcet.ac.in	$2b$12$6YAQ4xXxtM32g2gEcFV9Iuy5/0mejbHGeMm98HILsWpQzqcKFtPg2	AUTHORITY	t	2026-06-27 08:30:15.732067+05:30	\N
528	riya.kumar232@svcet.edu	$2b$12$QXVS7Q.b3XeOd/hGKR7fQetEdeTaE66U/iP7nG6CmMOYtQZYMp7Xm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
529	isha.kumar233@svcet.edu	$2b$12$bEu8xW9cO8yLpD0l3536/.MiceRPIaQrf0aTJ21VwRRFYJkaTx2Le	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
530	aarohi.nair234@svcet.edu	$2b$12$PaoKRTA5206TSnB2B1//MOnvh5qjVc.HDhTKIh1ISitzocJ/Bzfpq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
531	pooja.bose235@svcet.edu	$2b$12$Ar1wB6ROvtzpiE7Z1j2BEegjnG1OTOnmUERWmgKM/L.3eKEJ5kWQG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
16	csehod@svcet.ac.in	$2b$12$0wzJvzoWjFu8oI3lLS88Beg9nz0wmwWhI6NZXjzI0rnWljfXaooui	HOD	t	2026-06-27 11:47:08.827876+05:30	\N
17	alice.smith@svcet.ac.in	$2b$12$jfVlxGyZZHVhK3h6tdxon.dd5jffHL4shUz8aSM6H50GNxkEj/YRq	FACULTY	t	2026-06-27 21:33:04.590772+05:30	\N
18	bob.jones@svcet.ac.in	$2b$12$jfVlxGyZZHVhK3h6tdxon.dd5jffHL4shUz8aSM6H50GNxkEj/YRq	FACULTY	t	2026-06-27 21:33:04.590772+05:30	\N
19	charlie.brown@svcet.ac.in	$2b$12$jfVlxGyZZHVhK3h6tdxon.dd5jffHL4shUz8aSM6H50GNxkEj/YRq	FACULTY	t	2026-06-27 21:33:04.590772+05:30	\N
532	sai.kumar236@svcet.edu	$2b$12$Mscm0wKrszVbGweBOStcNOif61Wt//mbMfquYZfTPk/8wvGCMIL4q	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
533	reyansh.nair237@svcet.edu	$2b$12$FsYKrhKhxHNBW51NT8h8R.GntM3cfUUM6e.32Gbcfv1AnpW0UsbGC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
534	isha.nair238@svcet.edu	$2b$12$pl7OMsdY3raAXeR7lur.JuajgK.BfF3aq6x7afLkVjzB/fleiYQzm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
535	sanya.rao239@svcet.edu	$2b$12$ft3Hm2jmRaqSN41MiJELPObhnAkZrtvEjBPPZREkSowU1ByFJEiyi	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
24	sarah.miller104@svcet.ac.in	$2b$12$.yrEfDERnpFm/0tUjLAA9eyttzqjZVV1DpPWfnWVaWXILqH9ArCB6	FACULTY	t	2026-06-27 21:35:24.56713+05:30	\N
25	jessica.harris105@svcet.ac.in	$2b$12$.yrEfDERnpFm/0tUjLAA9eyttzqjZVV1DpPWfnWVaWXILqH9ArCB6	FACULTY	t	2026-06-27 21:35:24.56713+05:30	\N
26	sarah.lee106@svcet.ac.in	$2b$12$.yrEfDERnpFm/0tUjLAA9eyttzqjZVV1DpPWfnWVaWXILqH9ArCB6	FACULTY	t	2026-06-27 21:35:24.56713+05:30	\N
536	kavya.kumar2310@svcet.edu	$2b$12$LaFXVPet8y84J65oS4O1MuWo.0D4MIzL7ojkrl.gHAfGaQPKfWQW6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
537	pooja.rao2311@svcet.edu	$2b$12$pGzQz0RFPj90Xml9cZOj2.ICYaut7CWFuLQjCMj23Piu1qr82gnB2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
538	aarav.nair2312@svcet.edu	$2b$12$4GAc6HWlWbGpefk4E6Bo.OioL9U9q5Vhv98tUmnZMVcZzMIzjmkCu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
539	arjun.sharma2313@svcet.edu	$2b$12$3kkwiO1xhbVLIxo4QxCGyeVuuDECe1peYojYkGqM2fWdEdrjVKf3C	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
540	ayaan.kumar2314@svcet.edu	$2b$12$a2xGbLx7.jzD3t6riXURteKjys.R2UwgYKf7ewAOg7NFBUy0rwYe.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
541	sanya.menon2315@svcet.edu	$2b$12$ZnH/Q/RIhmCXch8Kvx8FPe.VvvN7sgoSbymSPxzF59cHlvUTD0WVa	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
542	sai.singh2316@svcet.edu	$2b$12$yLw9loJ0AU/vWuovdyTrFuBBJ9EiNgsjQ6.nBblc4hTSGyS1oLajy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
543	vihaan.menon2317@svcet.edu	$2b$12$Xjr0.qtGNbo1.4GiMgAkDuWuHDtm4ujm347EbddiFGJIZVM6OaPCK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
544	reyansh.kumar2318@svcet.edu	$2b$12$X/VVlcknyPZbsgG5Q/G6Q.91HWHrTQhKxUbhRsBiiiaCLmm1eUAh2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
545	arjun.menon2319@svcet.edu	$2b$12$M8NWzjqogvxQi2qFWnP5VuUe2xUbvHVrS91iGUGNlb.UQ4d9gMiQy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
546	aarohi.sharma2320@svcet.edu	$2b$12$9bU5HWAUnrPqAROVoQHFyOipffm/aa/CHxruVL8xCz305Tu8WNWQe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
547	aditya.sharma2321@svcet.edu	$2b$12$14LfUsrI4I4dEGHNOXFgU.CAFvsNPdZgzTKy1F1yPofLdutbKgMba	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
548	ananya.gupta2322@svcet.edu	$2b$12$Olv9MGWfoiETnSAJo3Rb4.aMz8O45Qje8WJDGaguW5shRnqLmcRju	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
549	neha.das2323@svcet.edu	$2b$12$JH.jN1K0Bf8bGhK5.fGsx.yCwXycccB4iIYXJgT7tBfwfccuah5tO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
550	vivaan.reddy2324@svcet.edu	$2b$12$dZon9JTcIl1jmK11CmgR..GUMHS79IN1uzkq3KTWXfBRuOUQDLeWO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
551	ishaan.nair2325@svcet.edu	$2b$12$5xh6.OeM4F7i7nEL6Jpe6OAHg9hZ9Q7zJqK6erhdK/acE4YJetyHO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
552	neha.menon2326@svcet.edu	$2b$12$6q5OhZeRChrKKAf9TwW63eWtONerVUNvcm.uKc8StKL5mL/tHjFIa	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
553	arjun.patel2327@svcet.edu	$2b$12$KqcL538m8OYp9zo.wZ0veunS78HgmJkAmwz7bHiKOwKfVtWfa7XVW	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
554	vihaan.nair2328@svcet.edu	$2b$12$XecsjMs7eLS5jOlQEiHk.eEsGbbW34MZmT/LPyrPABAAj0aMiJdvO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
555	aarohi.verma2329@svcet.edu	$2b$12$mP2E7syKE9/41r3polbmguiWNst90HSfOaL3zyMXJZulBn75CHvJK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
556	riya.nair2330@svcet.edu	$2b$12$rYkBU6pZoDvJkslhFZ0G/ewAHV6teXesECqHiA0JxCja4dgBX.qEC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
557	vivaan.pillai231@svcet.edu	$2b$12$dvYml.Q4iTVgVylrv7cAU.d98XLT278i6aXhEPrm4/Ba8twDzGA/K	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
558	sanya.singh232@svcet.edu	$2b$12$AZJlPlpfFp3bkA0g.7tF1uxJoFkRwKT1.j3IdkZgxT4.GJSoKZN8C	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
559	ishaan.sharma233@svcet.edu	$2b$12$TNbnwz80.lCvt2bwQ2MBQeHR5QE3f0QFOWyll.cnUvnYPSUF/eR8C	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
560	sneha.patel234@svcet.edu	$2b$12$Ok1DFjKzLhTj1W3Z2o5nQexcHGFwwUAet4bY53o9sCL/jYUyGf6oS	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
561	reyansh.gupta235@svcet.edu	$2b$12$C4qz2lweqdyGz4yxwPnI3OzBkv7BNJVG8ih6QC6yy3Cg1Mmr6hDnG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
562	neha.reddy236@svcet.edu	$2b$12$P65IPRYwwWeIGS4HVzTADuq63PJS/sWcBrm/x3YP4sOiba1GApgq2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
563	isha.das237@svcet.edu	$2b$12$LLvz7wC2bktoXZb4rIFm7uE/7GNWsB3ndaYUi1Wro/yhPrpp7A67u	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
564	kavya.bose238@svcet.edu	$2b$12$ll8.ImhD/q/PJw9Wgv9wCuljRcz.BXLiDmU4tKO25EMfD3XfvlEDG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
565	kavya.sharma239@svcet.edu	$2b$12$ZUo8bW8zuXFHkd2Weiw8c.bvGMdN9grCemRKBIdnTiDVTgS3ZH7wq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
566	aditya.verma2310@svcet.edu	$2b$12$5dC8f7f1IvEqv/VIMZRtteUWx6RNPVM4YbOs4QxKUeW73EGNYiGMS	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
567	arjun.patel2311@svcet.edu	$2b$12$pIWoN.GBHhwBsPRk9yiqtensMWvGtiEOCFU45YbY8dmHIEKpXdm.C	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
14	ashwin@svcet.ac.in	$2b$12$DnNvLiRhl/gF8ZupPlWVf.7mhJ2hsPqaBJmIpXqwX/E8pw6/sbiKu	HOD	t	2026-06-27 11:33:52.482114+05:30	2026-06-28 08:07:10.348386+05:30
568	sanya.nair2312@svcet.edu	$2b$12$L9ZOjjQwGJjMyzw65gi6ue1tpIKzAp02LJbaZZzm1p5orWZPWLkti	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
569	neha.pillai2313@svcet.edu	$2b$12$1b4Y4SiWTkfPU68LL04YoO8C6rl1opekRUngF17/I.1XU9hYLQlMy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
570	sneha.menon2314@svcet.edu	$2b$12$KDJU4KFKGLGiWWzZh3YytOY60n3LCDsX3o1kw4LejaHc.4NIGjDh6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
571	krishna.sharma2315@svcet.edu	$2b$12$VahhQc9WxlwiAZEXmyhIw.HeRYCzJZomRX1AAnrLd2YJ6kddbb00e	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
572	ananya.reddy2316@svcet.edu	$2b$12$CwWYiVdhyOICAdXAzmqiFutI2AM.O83pZ98DnnMeQwmk8k7sf0Rxa	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
573	vihaan.bose2317@svcet.edu	$2b$12$YH0nsvTUJsPvUPsnei.9Su9W2xkeuya7n0AFuRFgQZX2Gk00iQDFm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
574	ishaan.das2318@svcet.edu	$2b$12$5r9.vemIVVF5db5XwYFDeu2UoAJCetv.76X51TZuuoEyNszBDQYf2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
575	krishna.verma2319@svcet.edu	$2b$12$kKX7M2v0N80yYnKNlQXil./6iOIF2wtHOXZt6UJIrQT5nYPYEFiuq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
576	sai.gupta2320@svcet.edu	$2b$12$oKuXSupRRoIBDtyMlxyqyOSeQ.RfDWApS30QbJcJHEANTd5Wl39g.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
577	neha.patel2321@svcet.edu	$2b$12$.8HKivQW192RNxyltSiiC.gV5CdGJ67EAq6jDTYfIcx9sO4SsZA86	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
578	aarav.verma2322@svcet.edu	$2b$12$rZ1kAAONWGtdyqgSxxJXcuXRO/J99vJx4b93YnZcAM/yZ6/O.ZQzK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
579	sai.bose2323@svcet.edu	$2b$12$1gKUIIDK4vjnuVBYBbwzce95s/RPPbkRbwd9CcZqyN.sNqPvrJwU6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
580	krishna.bose2324@svcet.edu	$2b$12$e.SkfO0opH77BAvVO7idH.dYcOxX16qo.aOO7pXwtxpNe00EdMjLG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
581	kavya.sharma2325@svcet.edu	$2b$12$y4bjfivBxvU0s9p2wGRDC.1Brkfg2/AlCZZmgE2sZrYx3PN69LW3W	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
582	isha.menon2326@svcet.edu	$2b$12$w41f7wJZx1GHIJSDuGIwzuvGSQcKpZBc0gK/P1ztVj0R8JJr5TKRi	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
583	ishaan.patel2327@svcet.edu	$2b$12$YbPxXxTaYCozwlmEsN70lui/rCl63WPvN.WuHqxhJ32sIS6oPUtJ6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
584	riya.rao2328@svcet.edu	$2b$12$cALkpUFu0DlXq/WFwI1BvO1/yGcX/5XYvI.8tFZoAtZjgP/NdiH8O	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
585	sanya.reddy2329@svcet.edu	$2b$12$9ngwKZyUsdIjm1E4JkTGPO4CNClnS.FKJkPWBdmwnC7YykNv2u9ay	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
586	aditya.sharma2330@svcet.edu	$2b$12$lqES3VoJbaI6jm8A1hxKI.4E3kKD5OJXSxAijxvTanFQT7IuIkyxm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
587	ishaan.das241@svcet.edu	$2b$12$ja7KSHVtdVT0iwQBVeNzNu6oNdpc7azNUwSloIIw5.UOchpmq8fAG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
588	isha.kumar242@svcet.edu	$2b$12$NoNSYrKV7Y/JDcNSP84ZLeeyucFud9xzdZ9X.zdrJ6vRteH8wn0XK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
589	reyansh.sharma243@svcet.edu	$2b$12$WKAqv1g.dUQZ5D2izh/M7uRcC0fz9j74DuSyriig7VkuCXOH3Q46q	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
590	isha.reddy244@svcet.edu	$2b$12$S/FNGK3SjMK65TOK5dQcGO5KeL.ZlPzaE9B1upUPdO8H6RAwFA0OK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
591	kavya.patel245@svcet.edu	$2b$12$I.lTjKww47RgVmt1lBtQmOIIt9Tmo08zSjqNf3MmCTTnRb9eEPREK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
592	sneha.verma246@svcet.edu	$2b$12$QZfJtij74RtrK7copLtcdOhP6iwAG52W396C7IaM.2XtSxijBGupq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
593	krishna.nair247@svcet.edu	$2b$12$DSDQqv8uHDsI7NtWKpb/lu.aC/H4qW07I.tdhwzMHHqIiVg9jQi/2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
594	sai.rao248@svcet.edu	$2b$12$L5zz6SNW9I7gypWkmVKoGOqOauE0HoS.YNWRBtg8kFEn77UNkrsYC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
595	arjun.patel249@svcet.edu	$2b$12$EPvw7zQU185H.SzgjmlvKOpM4BADt1hzNHkbgVzFE3WL0ybDD0lR2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
596	ayaan.patel2410@svcet.edu	$2b$12$OfPto6.2UadU/xh6sByOle9PqcHPiUTipxEuJL0q4BSRxSC3uGxr2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
597	isha.menon2411@svcet.edu	$2b$12$XG1SYDmWmcZmjSsrPnffqeDjmGJ84cMgSRC8wNBuWvNSXa2DRw56O	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
598	ishaan.kumar2412@svcet.edu	$2b$12$OZf.mnreH4nTXM4U3IWw7emgfN/3J4tuKS2NlmRaD6ZsntVh2HNnK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
599	neha.singh2413@svcet.edu	$2b$12$78pFSK6d2QlqGRaAIrSlou1s./QqC2lTRDP8Nl7DOnE4K5MasNE/2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
600	arjun.kumar2414@svcet.edu	$2b$12$VA1ifsR2p0rdOXDmb728xe9mtqJHjxRiss6xoU5sVxU2ZQh.vB/92	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
601	reyansh.pillai2415@svcet.edu	$2b$12$HnZHokgxBDJzsTgd8ItgKegokq5LLlls50TdX3nPg7Dz0iJytsZgy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
602	vivaan.kumar2416@svcet.edu	$2b$12$LUHpA2sV4QLFvFwUh3cUS.8q6zBzYCZSZkyEnq0cVdOjarMpx0uby	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
603	vihaan.nair2417@svcet.edu	$2b$12$6bquKKBFeKiN4unav/t97upsj7tQU2qb/HfimGpCfTT8HDI/zcSHS	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
604	sneha.nair2418@svcet.edu	$2b$12$IGasBwtTVGNtlFaLgIdduOr6WbpDwJdA9dxjbbA3NdpRi3Y11/Q9q	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
605	ananya.bose2419@svcet.edu	$2b$12$DCphsN.0abglvMwI6nql1.5w8ojz0OTKF3JfpuEBJUClW35owmMxu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
606	pooja.sharma2420@svcet.edu	$2b$12$blTRSNp8hv3y8TJzK5rv1uKPGc4esM2c1lHIpHjcZtaFFje4TXV6e	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
607	sanya.gupta2421@svcet.edu	$2b$12$AwG6Ak8FZXc/BIvr22Q.se2bllhOoSQjQO2ApGWzlH4esDJB.47.a	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
608	reyansh.gupta2422@svcet.edu	$2b$12$47niYPrdiotTErprcyB.1uACmvKV.Pt/FHH6nGTzJPKqTkOKDESEW	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
609	isha.bose2423@svcet.edu	$2b$12$vNlleOsHvQ8OQuZaJ24YzupMqRnqWpyLhCt5uRN1LLQHKLRYBKRIm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
610	ishaan.verma2424@svcet.edu	$2b$12$BlRFPLM5E.Z54pggzlhsgeJBfFtj0/61I5cFqb3A7A7er1J3KQWwe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
611	diya.bose2425@svcet.edu	$2b$12$uFMv9AIl4kMXcuLPFT2x7OUmf72X/B/LSfPNx6ATpgiumZ5izglte	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
612	riya.bose2426@svcet.edu	$2b$12$0MKqCip7xyA.QlO8AYiGvOqL2x22V/cKoxG1fXZ8eJCnuWTcqhj0G	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
613	isha.reddy2427@svcet.edu	$2b$12$8QC2OCwBDXuOdsQhgRfRXu78bKAKdGXQgkhQGywZMBDTTkTHLDCfq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
614	arjun.pillai2428@svcet.edu	$2b$12$.w6cRgMCW1JXn0mdK9pXwuXV91/0JmuEcYTeb11aCmcsKxuRvmwmK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
615	ayaan.menon2429@svcet.edu	$2b$12$fwfiSSd6XeV3sJ1UrPQXaudNjzk6XjobHDnOEdcHHWSPEfWVfNKYe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
616	ayaan.das2430@svcet.edu	$2b$12$IeJiO8KC7XqG/ddKS79ZbeWt2mI.pWdWZE/mF4jmwUSVFMq8z6PC6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
617	aditya.rao241@svcet.edu	$2b$12$/q5UTT3JNSVwUn1X6MyQ3Of.s2yiVqtAoRupMrGYifqp/.r0LgHbi	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
618	ayaan.kumar242@svcet.edu	$2b$12$a.ur3WLFWyYPG5icjYobg.E9lTM/pAaWPdw0n9ImTqSmUgIs9o0OC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
619	aarohi.verma243@svcet.edu	$2b$12$.8JYpD1gq38/UGoA9u63FuEM1DysoSFTcdaS1ECK/c77hGJ.J2CRG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
620	sanya.gupta244@svcet.edu	$2b$12$CKy2mh25QHL8FLzaSGqrM.YBI6A966Lm4qRjbFfep.g4E46XDK9hy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
621	ishaan.menon245@svcet.edu	$2b$12$8HNBh8i1g7nkp8tczCic5.OaKfi6eOJoxaxhNjLYHSKKha04jV6bC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
622	aarohi.nair246@svcet.edu	$2b$12$6EHC6gHACsenO9/9XdNO/uw1C8LM1ehNMbOr9Vj1tlHHSPD6V2ZsG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
623	riya.nair247@svcet.edu	$2b$12$oK0ZN3PIMZLNc2xqa/ZrV.ssYsYSvhFdWp3ozkf2gW4eID7Kn22ae	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
624	vivaan.singh248@svcet.edu	$2b$12$kLxeZAETcUBzqT3sSHLpXe17.r7vdYHX93H9GWhnWvaFYLY6yYGNC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
625	vihaan.kumar249@svcet.edu	$2b$12$W6HFWWgG60xvymdaZ.IdpudT1MGo8XyfecMnchJOpLWU1BKD.F5pa	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
626	isha.sharma2410@svcet.edu	$2b$12$Q7EdDflLKAf3e2bcrlfMBOLrTPLJ1ZZsBxAU1aEc8IiCKsmpz9e/u	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
627	kavya.patel2411@svcet.edu	$2b$12$teR3SFN2k3oHOlArV5i/LecwqQnsRUuSid0fC/HXV4Nz4iijbHrIC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
628	diya.nair2412@svcet.edu	$2b$12$0chvsYHD0M.Imr0oHWABEe.i4c8V1cTDYOMRLjGiwN4hG1.eNLDra	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
629	neha.sharma2413@svcet.edu	$2b$12$oKAO9D5IbCGvmzAUUUdXKuWMVKS/u7RGcrW5UUxW2nvXAjEJ4i0ge	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
630	aarohi.nair2414@svcet.edu	$2b$12$ly6S5Wi69V4JvZxG0LNuw.nxxNoiUOV4m8wCdPmfxH1855fax8zBq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
631	krishna.reddy2415@svcet.edu	$2b$12$9FD0eoNeb5hKmT3ttLkXV.TPAMRtKNuX/GJIhJ33ULqXxjOtgqsiW	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
632	ishaan.verma2416@svcet.edu	$2b$12$sEG2B9EsvB3bW7qCr2Ulz.dYikwwk0aNBF1y0dTwoaNjblP7tw2Ke	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
633	aarav.patel2417@svcet.edu	$2b$12$2f/65YVNnWcLy6JrcQIjD.EtcekObcV1ZnynT/TvoJeecuAIcFNQG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
634	sai.das2418@svcet.edu	$2b$12$okl0N7yc/gXKbT71sra7cupMLbZBuYLfaUC9JA8VPKxBnvLNS7.HK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
635	neha.das2419@svcet.edu	$2b$12$jwhUj2jesAWoK/7Y3f0TZONZweqnKsa5BedXkOGRguCHqCtkMfXAa	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
636	riya.gupta2420@svcet.edu	$2b$12$YbPcCgCkbtXzj02x39x1GeMWnzAW/7nwwYgXECiuC3CAEPqwiyuza	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
637	pooja.kumar2421@svcet.edu	$2b$12$WMRMXAno17pxAjlYCBJG6ewNqZ1gE7G/yFB7858pgdSCmQWN943I6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
638	vihaan.reddy2422@svcet.edu	$2b$12$nGKnbD.6BuNl5XC9ZUDGf.m250vj0w2JawW8fOl6q.iLVyBFRtURO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
639	vihaan.menon2423@svcet.edu	$2b$12$6aJ3AGwgU/UE55mRptn1W.fkAoPsh.S0jfeBTlGv3dEbUkcdfg1F2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
640	krishna.das2424@svcet.edu	$2b$12$HiM9NKWWBXKsWidWJL7fkOCCJO.eSB1epRXDBU5PBIyuhLHIruoXO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
641	riya.sharma2425@svcet.edu	$2b$12$swb6UfyoEAy5jlUZWbvq9.0TR5P1c4W0QlR288XAvgyfSSs9XfFSi	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
642	kavya.menon2426@svcet.edu	$2b$12$owGDRezBaPQOxcmOUBARqOqBYTvD8Qs/enufduMZcYrpNKEsf9yCm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
643	reyansh.menon2427@svcet.edu	$2b$12$MVstQcfOKMVwLnQcS6/qpeyjfJE59vFHhVQA93g27ZyNEAaWueV6.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
644	reyansh.patel2428@svcet.edu	$2b$12$OW.8n7ehA5c08aWEGtP4GeOWkJR5VnS8ev.77cq7tG3YPRMQBkNQm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
645	kavya.kumar2429@svcet.edu	$2b$12$ua7gMpd7lLKP34KKyfHbIecgKbTYJTjwT.KGxcvTQIVrBeMAJ3ifa	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
646	pooja.pillai2430@svcet.edu	$2b$12$so2U3sJe7Cv8k3yHR.DPYOeJ8YUF2ieF9v5g6UEJo2MNW/mXYVUle	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
647	ananya.pillai251@svcet.edu	$2b$12$469QzeRd4QBqNmyGgqv/weJphcit1cmn.poLIVnDCqOSfmivs01Aq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
648	sneha.reddy252@svcet.edu	$2b$12$VMxnWaegFDr.XaPo2VsP/u.wojfa6A1JWErzpA/JPyzjQqtz5Zp1y	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
649	reyansh.bose253@svcet.edu	$2b$12$6XPY3zfC4RMZG.JI6mA/UOvBvfLM6mYIXd5hPxc9oNmEAOcF9HFCC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
650	sneha.menon254@svcet.edu	$2b$12$puYZZIdHiO7Au2wRvYEcu.C/MAAePOPxlPl/QZKw8X1XWTO2OREtq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
651	ishaan.patel255@svcet.edu	$2b$12$96GAN7evZSdZPebpjJcKFOyuY8xtsD50JEKDI7ZWYbZFw6WXjGJLu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
652	vihaan.gupta256@svcet.edu	$2b$12$gQ9qX80r6.jr/53KLiW4K.YS29Dg6ro4dgTjjcswvXZoQdUWAcGcy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
653	ishaan.singh257@svcet.edu	$2b$12$Q8RI8/p1EOrpjKAti38/7uNBToMO3dI1p5BJUWuOkaFcuju0ikefG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
654	isha.singh258@svcet.edu	$2b$12$xePWjRLENpnkHvUf.7qmU.EZNV4ApKIdcpIosa0LMNLxEOYcqwZFu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
655	riya.singh259@svcet.edu	$2b$12$KQnr6x3/GvmCi2UM7SO4LuTfoWU0EzQWQ6zeGMOnyK1mI3pxB/UqW	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
656	aditya.nair2510@svcet.edu	$2b$12$tejTTUGpSes86kOBQLbTWujLMP4G1kpGuzAGTPnBGeHHTr/anD2sy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
657	ishaan.gupta2511@svcet.edu	$2b$12$xSoog32qKkUlmHJHNS2fEelgjrZPeLVlNJGrbEBWWjhA8RG1L1u/m	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
658	diya.nair2512@svcet.edu	$2b$12$lyAs4oURXk1YrhMYUDpOjee2saLOilr2bYGFDfuLUU9kVTxj4LOEe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
659	aarav.bose2513@svcet.edu	$2b$12$WGIU53s74NYvm81dz2N4.OYM7ao4rfEu3MwqfemeCjp1fvhXSWEl.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
660	ishaan.menon2514@svcet.edu	$2b$12$Ejuy8q3D5A5ntlRpq01eYeCPtAYbRcid74gIazzXQENLJCX7BoNxO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
661	kavya.patel2515@svcet.edu	$2b$12$sPNkID9jQtQzJg5zWN.vSemRgE/wd2AxrYIV8uXB0i0WniUiUMe4i	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
662	ayaan.patel2516@svcet.edu	$2b$12$EQY9trQWtjsjPjYOEP1BCOxbFGjTNe3ZCbOV5PoY87d7jKDNb5xFS	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
663	sai.menon2517@svcet.edu	$2b$12$9NuPSEMmyDrLZ9O3TDOLy.jVt27czHm6dGrUPVsAHZnT3loC/o5fC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
664	vivaan.nair2518@svcet.edu	$2b$12$kpthvA4y34J.WylIKiSTZ.h2dv7lKkEZpjHoB3YlIQRIecwJm3SiC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
665	pooja.bose2519@svcet.edu	$2b$12$uPQjt6pEKCVxeOhpsZNiGOX.0GibIyJ3SCoUDvy9/lZDZOFpv5cIK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
666	vivaan.rao2520@svcet.edu	$2b$12$sj.xHPERFmc0x1mBkoacQOOH7W8mt/1MVTYzr/eYrTqSPyOir7L6m	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
667	pooja.sharma2521@svcet.edu	$2b$12$z.N41q.6fhBHzssyK7w3DuLTRm3ltAIySdOxaMW9CWq02WOaCN5A6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
668	vivaan.verma2522@svcet.edu	$2b$12$VJJdjTME.jOvzjo0NWsEgOn7AIsYicJ9Qf.fwjvrR.aEPA.3hmmAq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
669	kavya.singh2523@svcet.edu	$2b$12$Vu77Wg7avODrijmMcOKMXOhBrt90WwrdsrZQFw.H1UEcUGg4rACoe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
670	aarav.nair2524@svcet.edu	$2b$12$mQJVNipSd9gHyyCNB8V/i.IZMK4CuuPRWXlXzd32f6EXWlOAOfA06	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
671	neha.bose2525@svcet.edu	$2b$12$yp.dtK6bYKXd0TQg2x4hn.fvrUJdov5aqzxO0WHMpFfhmvvRy2DLe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
672	aditya.sharma2526@svcet.edu	$2b$12$cfUSRkgwQUS9dFRF5vSBouUlCattmznl9phbLVTehjsPyk7AajyT6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
673	arjun.patel2527@svcet.edu	$2b$12$GOlMeX048k0.IB6Ruzh/MOoQZF5HLl8qXRmpCTwt/w/zVE0H0NpF2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
674	isha.verma2528@svcet.edu	$2b$12$91p9yrSLduKG95fyF4MegOeV1v6hnE.w3uuEZ65rtHWU45ldQ/yXC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
675	diya.pillai2529@svcet.edu	$2b$12$Gv9eEjnmWDqtepYutaL3Nu.HD9LybH8YPpGzG9Gh.ZVZg/mhTXGQ2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
676	diya.singh2530@svcet.edu	$2b$12$cVbtzrXr0peQ./kKpOsRnOIexEe/WaTNxisgYgQaEzrxdgdnOJw02	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
677	aarohi.gupta251@svcet.edu	$2b$12$96Jw.b8u9ATqRIpp1el5GesUuavW6dwGdy0SS0ahwMKWXpHskORqu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
678	sanya.rao252@svcet.edu	$2b$12$.vnzR7G0hdhIUMfloACalulzoZoNXHmmk0J1EAN/xafoZYNZfUv1i	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
679	aarohi.reddy253@svcet.edu	$2b$12$FPLteYqJbxU8cfdPYHacWOcOScMNS5tbW8OUGvn37vFa8YY33Pfuu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
680	reyansh.patel254@svcet.edu	$2b$12$pXDw0Qp2DZfDC543OFyq6.bHaXzYfcqkWB1wX.KVuF6XqoIvhtNc2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
681	sanya.pillai255@svcet.edu	$2b$12$2gytGKjx4aSpmJO4kAE2IekXEQTckDrAv0Id89BxqC5ltKa3YWNDa	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
682	sai.reddy256@svcet.edu	$2b$12$BFspVkgKxwaqnF3wyH96Z.b5ICFDoNkFUllDIF1JCUqtoM2P.J9ye	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
683	vihaan.rao257@svcet.edu	$2b$12$Wzcb9xLVKvdC3g0qaJGtR.UMI1GHc.adq2e3LXeLS/uExlejIjOjq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
684	krishna.gupta258@svcet.edu	$2b$12$ArbEwrUIdE4hdelDfixHBesT0n6iaS5Q5ftXbjJBd37e/aCsIhcDm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
685	vivaan.rao259@svcet.edu	$2b$12$xRP66g2W7y3Wk8JDziEt6O1sl4U1yPkcNJdJ4u6hiWsheLh9ZUiuK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
686	aarav.sharma2510@svcet.edu	$2b$12$ANLAuRQHvLxQABQUdP2Jd.lacPgP/XYI7ngLNnc6fPntahFU86g0y	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
687	neha.patel2511@svcet.edu	$2b$12$jiuKOSXxharI7U7iVpTdbe/nZsIk5BNRAbafbHz79CYz7A6S4G0Xy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
688	arjun.verma2512@svcet.edu	$2b$12$2yRfAdD8ywYmcJeW7i362.8djzdGbCkpm/xo7MIYkJ7l54oK1TCC6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
689	ananya.das2513@svcet.edu	$2b$12$VdMv521lQJSR3P42lYEcJOPUA.iwqaZ6Rs6x98vskTVg9jhiY5swS	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
690	diya.bose2514@svcet.edu	$2b$12$dVq6/.OhHmFcqIxc0sEEm.fNpcAps3e3gRkwsCMLFKhwlZf/FnYqG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
691	ayaan.bose2515@svcet.edu	$2b$12$Qw9hizhJvSY7qkPTxG9unuK9xV0H5p6yxj/4kCDedhAen9P07Tyye	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
692	aditya.gupta2516@svcet.edu	$2b$12$z2VktaOYSYht2ruwwSuvk.oHp62QmxpQ1QIH1Eys41ZLjaVrO9PQm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
693	neha.sharma2517@svcet.edu	$2b$12$S0kUcfpkOnF9KWVFVx4J/OTrBp2ti06pIih8Y3xzmEBOqQZ8odPX.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
694	vivaan.bose2518@svcet.edu	$2b$12$DWJPadcpjKvmrIdD89hUx.i7CHwGCrqwWxN4CQ8WOAqleLyf0XUiO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
695	vivaan.gupta2519@svcet.edu	$2b$12$a8xNaXwjwYOczobrk9/OU.bX75P1Rxp6WJ7OW.oVt4d.O7P9xsK1y	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
696	diya.singh2520@svcet.edu	$2b$12$GtY8U2Pa4OAcFmZnI0cns.1KaLR98Ff/VMAQcxbedmlh5OeeGIpay	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
697	ishaan.singh2521@svcet.edu	$2b$12$6T5XS8FgMTWAd9arpFctv.rPgi/ExJeZX21Xsbqai2u3kPiGoZXI.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
698	ishaan.gupta2522@svcet.edu	$2b$12$FH/wdJahY3OpC9srzPDAr...6ueD9la6JMQu.DUC8eU/CSvrssmKy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
699	isha.gupta2523@svcet.edu	$2b$12$8dfRyXYsEXN/2z9vdaH6y.iVcRQwoBI4lA6I0xjQIuZmW1vKBTKhC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
700	reyansh.gupta2524@svcet.edu	$2b$12$.o6iEAKGJ0ogwQgv1AQwu.4QrldZuiyaResu2VU/ElZGqUn0kth8S	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
701	vivaan.reddy2525@svcet.edu	$2b$12$m5vApjOO2dxQ6xLg58TXL.R/uO6tDsoF936JUoUBfFQsrtv42Xrme	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
702	krishna.sharma2526@svcet.edu	$2b$12$l4Tcx60ISvfJdb/7L6jlo.ThC3U21EsTSfchE.j6jtp.ZILsMSCgu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
703	aarohi.patel2527@svcet.edu	$2b$12$jnrMVWRhTikKnLYE/9pTKOLqiFYMa8OLsjL/OFGBrGQs565kM7TeK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
704	aarav.sharma2528@svcet.edu	$2b$12$zwoDlkatYlu6VqJI1tahme30L8EheYdSEBGpvp1j0Z8cvT6AllOu.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
705	aditya.singh2529@svcet.edu	$2b$12$CRoFepxGQlgM4PSMUsvU/elLRlvfvveogLt1fIrPup.x0Dv9BwJjG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
706	sanya.sharma2530@svcet.edu	$2b$12$AXZv4xqwE3GbPoAz8yZ0oOtR4omeK6hv.aE5xT.OPg4n1Mt.z9HXG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
707	sai.das261@svcet.edu	$2b$12$4yAEQIoIjUpWyfJ1YZ.LWeop1W25U5v/3Czc5esbydAaovzidCrnC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
708	neha.verma262@svcet.edu	$2b$12$IZ6zrmrLTZ8S5ZyM7VSQ1uhsouEaLTTkhenBMTlC0KFvAe30oiuMe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
709	kavya.reddy263@svcet.edu	$2b$12$4VJO31Xhn2ItuyloMmbVme5mY6KTzwrl58.H/HbWq/DAzaFN3WyI6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
710	isha.kumar264@svcet.edu	$2b$12$22EpaCUaGholHaaC97L8zuHbLOWSR9FuOMmGYb93RkTrho6iSjpPK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
711	aditya.verma265@svcet.edu	$2b$12$wsqWqnKs0TPFAw4LgrEl1elQjp14Os2CliuNCWyQzq8kK0ZpQwmQm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
712	arjun.das266@svcet.edu	$2b$12$cZa8e6ISeofUi2vAWNpMM.HPaNoMolUr/B6P2W1c.okdWYKBv/lOu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
713	isha.menon267@svcet.edu	$2b$12$s4DU3A1utpkX8bNjBtPzL.SHUjkYOAm1grIxQGuc7WPw/0r3enOkK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
714	aarohi.gupta268@svcet.edu	$2b$12$LMmBKYmwl3vxzFJ.e8JuOewSRB1YeRfmE51o2f3gRf2KEr0SSQXJS	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
715	aditya.das269@svcet.edu	$2b$12$cL23mOd4Z4l0/EDb5JrCs.79g4Mi/W3rWZWo25uQOZY6C3CZKymVG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
716	sanya.patel2610@svcet.edu	$2b$12$Aj4RQCltWS2pm5VNSTA77uga.50gT0gNxyIZxwKIAa9n/qvP4UiWG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
717	sai.kumar2611@svcet.edu	$2b$12$XE47/JfaRupfAYvJjxqcUu2QEHo838cBbKiDxefdxam/I0m7WE2qW	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
718	krishna.gupta2612@svcet.edu	$2b$12$nfJ3gHbYUwscMss8TlfCtOh/RsHHXy17nmnbfxdeLWN3vgxEMtKQO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
719	aditya.rao2613@svcet.edu	$2b$12$m5iBaadSGqAi1eHyeI6Mme.UzSU4itLzZp/tzNGxsgRmnkME0RSWC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
720	aditya.das2614@svcet.edu	$2b$12$P.Qm2jkncs9OK.gDuVIfJOGfpwIJ5NsiaL0afC9DRDM2sd5W/N43i	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
721	neha.nair2615@svcet.edu	$2b$12$3k0k5.ahRyZvmYF7Q7p4Xeqk8BuLl8vatQImc5wHTcvVcWBf6p2I.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
722	neha.nair2616@svcet.edu	$2b$12$Xo765NHUsU4Cz7ZAOtNs4.99qpToiFDiANeVGSW/T95tNSa.gQBku	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
723	neha.verma2617@svcet.edu	$2b$12$k3.cAziqjYaRTAwWmAkPVe2Olf3VTEiDXj7Np685e.iMAPkArEsr2	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
724	krishna.rao2618@svcet.edu	$2b$12$DKy/TTg3YEitdEzk7qEzpe8P48qcfTFB.jscJhNy.cZTYNySBNHXm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
725	neha.nair2619@svcet.edu	$2b$12$nlZ/58JhxYxiB.hy/mUulO2unOSkVfzGfG8dAUCNlo5morjw6fmhG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
726	riya.bose2620@svcet.edu	$2b$12$aXh3qW1ueH47rlMzoQ8bFOTrrB7Nsd.KsljrF4taexGTHWyJyE1TG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
727	kavya.patel2621@svcet.edu	$2b$12$eLertHh0zt.v/72EaDA8FOFGcpaCvnJYScgoAFO7yu3.70Yaf9LB.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
728	sneha.menon2622@svcet.edu	$2b$12$Zn0VnTgLW3Yoo1tldGOx3e9DULC7H/gmI/3IkwlscGy.kgpWWiiEq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
729	sanya.patel2623@svcet.edu	$2b$12$Kok8WV/IrSgNGuIRu29Rouu2k7Bo8FWINwBS2Nci281I0v.0ybqsm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
730	kavya.gupta2624@svcet.edu	$2b$12$tGCyBbpLOOf6/WRqtGG40ui5rstjVmlfl5DLiwkwNCr/vIzmBcBxe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
731	pooja.menon2625@svcet.edu	$2b$12$baLtdVaw1JuevoLiV8kSaucCis6t/wp/RKB3qwcVzhrvE1gih/NCu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
732	neha.pillai2626@svcet.edu	$2b$12$yodU0bzOLVeo0CEzAlMB/ewu7vuR9BTSp.0/CGp38DQqH4Wg7/Z3m	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
733	diya.menon2627@svcet.edu	$2b$12$y65epy..U8.9RDk0WO5qAeUbMjWwS70v7qczEc9DXwdhytAQ1r34C	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
734	isha.rao2628@svcet.edu	$2b$12$bH2FIhTJPfmaxcRGCjI.2OX6GqSdaPduKh23X.zTVVYBu60DD0EdC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
735	sai.rao2629@svcet.edu	$2b$12$CeRyjpgOh9CudXpKvRd2aeku1y8d3XCL4/Y4Cm2MqU4.z9HH.CVGq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
736	isha.das2630@svcet.edu	$2b$12$e.MIi58fRUw69xY3WcN5tuuXmNiGBtfHv0.DFuNS0FszvfEd55cNC	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
737	krishna.singh261@svcet.edu	$2b$12$DHvlFgXd2YLoNAgT3K3fR.eFRZim0X.JE1MLQkn654I3eegWxm8Zy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
738	neha.reddy262@svcet.edu	$2b$12$BQ/L4XA/m/4jEAFTok81Au8o1JYxT9grOj.sZwofZ0NtLVzMYBkUm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
739	reyansh.bose263@svcet.edu	$2b$12$fr01qLBGblVCX/77TLirou/olza2.U57Jh285GqR6OlyYZ/Zn3zry	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
740	neha.bose264@svcet.edu	$2b$12$vryLoNG6B2o091yfyqncdOhJbHCIoEvjaJXXGXEE3V44Z2iPSshJe	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
741	pooja.bose265@svcet.edu	$2b$12$KU3zXiU9RJTieONDLbgE/.5VVv7f93/oa1e.fhiOUnu70RVnRxBaq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
742	aarohi.gupta266@svcet.edu	$2b$12$ThreeYrWzG48pdvC5sZSSegbPPTL.nq3HHu4p6U.7JPyHYmv.xfm6	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
743	sanya.pillai267@svcet.edu	$2b$12$6bnyP/jJG0WHihO1iiQFfOlUw1QiXdxNe8jfndeRjUR3AcVqst5Ee	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
744	pooja.patel268@svcet.edu	$2b$12$veXs8S3.3R9wEVN7mHu1fOW8cKRd2aW7BA//8roTY0l69mwtbdlKq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
745	aarav.menon269@svcet.edu	$2b$12$yTEsD1lpIkK9OKgIG3dBqOLSDLzmJo9mrSUPrPmZOXpO.xMdlwYOK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
746	neha.rao2610@svcet.edu	$2b$12$61gV/GgYXYqf.nsfGV5N4O57Atm.NiBjrSoW0.MpqzL43PI5HtpUG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
747	krishna.rao2611@svcet.edu	$2b$12$PbmxuENhIXK2ayvAm3brJOlj5x0b7FNsVuInpJtAU4M1UYhrQ5cHG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
748	diya.nair2612@svcet.edu	$2b$12$c2jWLkHoeKg6a.0b8m9wJeEZzvFbllVq99NpbFmlTAhVlHmoFMJSW	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
749	arjun.das2613@svcet.edu	$2b$12$XAg0CWcEGxaNWaSRdud1h.qQm51CZv57fcUh.wDe00baZ7FDFWply	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
750	isha.singh2614@svcet.edu	$2b$12$xf08cGcskDjZmM1jqhueq.Ve4pqCpZGb1Osb3Z8YmylnwWQL/n8QG	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
751	pooja.menon2615@svcet.edu	$2b$12$akJ8mestACt7i5w0QThCzOUkNshoAASLrwuhsOfhZQvtBRRhj47Y.	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
752	diya.sharma2616@svcet.edu	$2b$12$67shEzlhuxDcSjYuhTWwwuY/.Z3KKkD8UufkU59E7yuu9xUcY0qtK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
753	neha.bose2617@svcet.edu	$2b$12$B2COmLaWq/bXHeSGalrqSuJCeqKp5KjuJ0GyztG8buQ9NNngaPzse	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
754	aditya.nair2618@svcet.edu	$2b$12$nONeOQk0CQjMzZsVDGmd/.4QkqNKM6dE8krAfqM4Vowur3ywzRd82	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
755	sneha.menon2619@svcet.edu	$2b$12$H2mpq8lM0oQr58H5IxVvWuLdUvVCHZnMFt0wXIAoUNFhVTtchvoyu	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
756	krishna.das2620@svcet.edu	$2b$12$LwSPNbqSl8RvbZ1uq.Mg6esq6fvy5jLC7kG9TjnVtRG/Jmj8yrOlq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
757	isha.nair2621@svcet.edu	$2b$12$zbQRU0sGPW8seyg7anUgXuIAS2zyB2X9X8QhsFNWZvjPKHg07v0vi	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
758	riya.sharma2622@svcet.edu	$2b$12$oZ26gjhDWYbVbLdK/lAOuOePuAf0CCczIsVwumMfOWsU5BdLvKtwO	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
759	reyansh.das2623@svcet.edu	$2b$12$tePAg2sOUFw6QkNOJnfeeuleu7fymRF91UjXHzHRUduoyKWP.81wm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
760	neha.singh2624@svcet.edu	$2b$12$ia2bPHx.I/xF9iS6K8xaLuQ0RIq1P8RMcl6cjOYkV/cSPlqIZDMMq	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
761	krishna.menon2625@svcet.edu	$2b$12$hw3dUnLM2uPpoOJrz0g8GuL808sRPsWeW6bvePpNBIViAqJ92WvdK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
762	vivaan.nair2626@svcet.edu	$2b$12$mbW7b2.OLT/xof0sN8GdaurOm4nhGg848kLz6VroqUOCEzbGbVEOy	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
763	aditya.das2627@svcet.edu	$2b$12$zRog6hax2KzsQQ8PcIfSFuxRQZxdjVJhtu6WwPaHi011p2i/3RDIK	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
764	diya.bose2628@svcet.edu	$2b$12$Kd/wHPSQdeaGl53N91aEHO6BY4xZWdEkGsgrvfvhTZAbBaVsg5Xgm	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
765	ayaan.singh2629@svcet.edu	$2b$12$.nO2XVL0/zrrJf/lnH9Q6eo2DmS6HDYsnSYs7f2pCzTuKTLDnX6/i	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
766	aarohi.singh2630@svcet.edu	$2b$12$g36SHKgJbxkiElJHKf1eK.Hp8f2QmFw1M2I5bPJTDrq5mD/1F3a3m	STUDENT	t	2026-06-28 08:18:53.174874+05:30	\N
767	latetracker@svcet.ac.in	$2b$12$HiDCuaWV9yTKA8J6boSUrO95QLj5k2v9uB35P9u8LCQz/Rq.u/MjG	LATE_TRACKER	t	2026-06-28 15:40:05.686615+05:30	\N
9	alice.j@svcet.edu	$2b$12$glRp.xnulIf.lJfq9rTlh.HCJid3Txr/0BqlkXSaiNmnSWX34Uf4O	HOD	t	2026-06-27 08:13:34.998959+05:30	2026-06-28 08:06:44.810643+05:30
769	principal@svcet.ac.in	$2b$12$leQcjbKjbTcmkAeI79q7nerlJlWoge82cztvFffPp9z3TnHDrBmom	AUTHORITY	t	2026-06-28 16:32:58.189521+05:30	\N
770	vishwa.labs@gmail.com	$2b$12$EG7/qcOqQzxDzSzARET/hejjKMN.u5XmjqazYCqEcgFLoQSaSRq8S	FACULTY	t	2026-06-28 18:12:03.335656+05:30	\N
771	gopi@gmail.com	$2b$12$AAuSoLKtQjDkU8cKsmFAbexgwO.rXa01557hxXMDKoNxurZljIUWa	HOD	t	2026-06-29 10:30:24.240261+05:30	\N
\.


--
-- Name: alumni_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alumni_id_seq', 1, false);


--
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 1, false);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- Name: authorities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.authorities_id_seq', 3, true);


--
-- Name: course_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_assignments_id_seq', 21, true);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_id_seq', 78, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 5, true);


--
-- Name: discipline_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.discipline_records_id_seq', 42, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, false);


--
-- Name: faculty_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faculty_id_seq', 15, true);


--
-- Name: grades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.grades_id_seq', 1, false);


--
-- Name: late_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.late_records_id_seq', 6, true);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 1, false);


--
-- Name: lms_resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lms_resources_id_seq', 1, false);


--
-- Name: mentor_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.mentor_assignments_id_seq', 37, true);


--
-- Name: sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sections_id_seq', 14, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 747, true);


--
-- Name: timetable_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.timetable_slots_id_seq', 44, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 771, true);


--
-- Name: alumni alumni_college_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_college_email_key UNIQUE (college_email);


--
-- Name: alumni alumni_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_pkey PRIMARY KEY (id);


--
-- Name: alumni alumni_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_user_id_key UNIQUE (user_id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: authorities authorities_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorities
    ADD CONSTRAINT authorities_email_key UNIQUE (email);


--
-- Name: authorities authorities_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorities
    ADD CONSTRAINT authorities_employee_id_key UNIQUE (employee_id);


--
-- Name: authorities authorities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorities
    ADD CONSTRAINT authorities_pkey PRIMARY KEY (id);


--
-- Name: authorities authorities_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorities
    ADD CONSTRAINT authorities_user_id_key UNIQUE (user_id);


--
-- Name: course_assignments course_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_pkey PRIMARY KEY (id);


--
-- Name: courses courses_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_code_key UNIQUE (code);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: discipline_records discipline_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline_records
    ADD CONSTRAINT discipline_records_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: faculty faculty_college_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_college_email_key UNIQUE (college_email);


--
-- Name: faculty faculty_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_employee_id_key UNIQUE (employee_id);


--
-- Name: faculty faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_pkey PRIMARY KEY (id);


--
-- Name: faculty faculty_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_user_id_key UNIQUE (user_id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: late_records late_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.late_records
    ADD CONSTRAINT late_records_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: lms_resources lms_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lms_resources
    ADD CONSTRAINT lms_resources_pkey PRIMARY KEY (id);


--
-- Name: mentor_assignments mentor_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mentor_assignments
    ADD CONSTRAINT mentor_assignments_pkey PRIMARY KEY (id);


--
-- Name: mentor_assignments mentor_assignments_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mentor_assignments
    ADD CONSTRAINT mentor_assignments_student_id_key UNIQUE (student_id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (id);


--
-- Name: students students_college_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_college_email_key UNIQUE (college_email);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- Name: timetable_slots timetable_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT timetable_slots_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_alumni_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_alumni_id ON public.alumni USING btree (id);


--
-- Name: ix_alumni_register_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_alumni_register_number ON public.alumni USING btree (register_number);


--
-- Name: ix_announcements_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_announcements_id ON public.announcements USING btree (id);


--
-- Name: ix_attendance_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_attendance_id ON public.attendance USING btree (id);


--
-- Name: ix_authorities_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_authorities_id ON public.authorities USING btree (id);


--
-- Name: ix_course_assignments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_course_assignments_id ON public.course_assignments USING btree (id);


--
-- Name: ix_courses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_courses_id ON public.courses USING btree (id);


--
-- Name: ix_departments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_departments_id ON public.departments USING btree (id);


--
-- Name: ix_discipline_records_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_discipline_records_id ON public.discipline_records USING btree (id);


--
-- Name: ix_enrollments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_enrollments_id ON public.enrollments USING btree (id);


--
-- Name: ix_faculty_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_faculty_id ON public.faculty USING btree (id);


--
-- Name: ix_grades_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_grades_id ON public.grades USING btree (id);


--
-- Name: ix_late_records_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_late_records_id ON public.late_records USING btree (id);


--
-- Name: ix_leave_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_requests_id ON public.leave_requests USING btree (id);


--
-- Name: ix_lms_resources_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_lms_resources_id ON public.lms_resources USING btree (id);


--
-- Name: ix_mentor_assignments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_mentor_assignments_id ON public.mentor_assignments USING btree (id);


--
-- Name: ix_sections_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_sections_id ON public.sections USING btree (id);


--
-- Name: ix_students_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_students_id ON public.students USING btree (id);


--
-- Name: ix_students_register_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_students_register_number ON public.students USING btree (register_number);


--
-- Name: ix_timetable_slots_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_timetable_slots_id ON public.timetable_slots USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: alumni alumni_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: alumni alumni_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumni
    ADD CONSTRAINT alumni_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: announcements announcements_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: announcements announcements_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: announcements announcements_posted_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_posted_by_id_fkey FOREIGN KEY (posted_by_id) REFERENCES public.users(id);


--
-- Name: attendance attendance_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: attendance attendance_marked_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_marked_by_id_fkey FOREIGN KEY (marked_by_id) REFERENCES public.faculty(id);


--
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: authorities authorities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorities
    ADD CONSTRAINT authorities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: course_assignments course_assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_assignments course_assignments_faculty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculty(id);


--
-- Name: course_assignments course_assignments_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_assignments
    ADD CONSTRAINT course_assignments_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: courses courses_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: departments departments_hod_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_hod_id_fkey FOREIGN KEY (hod_id) REFERENCES public.faculty(id);


--
-- Name: discipline_records discipline_records_reported_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline_records
    ADD CONSTRAINT discipline_records_reported_by_id_fkey FOREIGN KEY (reported_by_id) REFERENCES public.users(id);


--
-- Name: discipline_records discipline_records_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discipline_records
    ADD CONSTRAINT discipline_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: faculty faculty_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: faculty faculty_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: grades grades_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: grades grades_graded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_graded_by_id_fkey FOREIGN KEY (graded_by_id) REFERENCES public.faculty(id);


--
-- Name: grades grades_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: late_records late_records_recorded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.late_records
    ADD CONSTRAINT late_records_recorded_by_id_fkey FOREIGN KEY (recorded_by_id) REFERENCES public.users(id);


--
-- Name: late_records late_records_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.late_records
    ADD CONSTRAINT late_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: leave_requests leave_requests_hod_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_hod_approved_by_fkey FOREIGN KEY (hod_approved_by) REFERENCES public.faculty(id);


--
-- Name: leave_requests leave_requests_mentor_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_mentor_approved_by_fkey FOREIGN KEY (mentor_approved_by) REFERENCES public.faculty(id);


--
-- Name: leave_requests leave_requests_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: lms_resources lms_resources_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lms_resources
    ADD CONSTRAINT lms_resources_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: lms_resources lms_resources_uploaded_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lms_resources
    ADD CONSTRAINT lms_resources_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.faculty(id);


--
-- Name: mentor_assignments mentor_assignments_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mentor_assignments
    ADD CONSTRAINT mentor_assignments_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.faculty(id);


--
-- Name: mentor_assignments mentor_assignments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.mentor_assignments
    ADD CONSTRAINT mentor_assignments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: sections sections_class_advisor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_class_advisor_id_fkey FOREIGN KEY (class_advisor_id) REFERENCES public.faculty(id);


--
-- Name: sections sections_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: students students_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: students students_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.sections(id);


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: timetable_slots timetable_slots_course_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT timetable_slots_course_assignment_id_fkey FOREIGN KEY (course_assignment_id) REFERENCES public.course_assignments(id);


--
-- PostgreSQL database dump complete
--

\unrestrict nOifnMByegoZx9jLarVS6bgi4OsTingPyZc7hbaLLpo1BMlCysYxL44gwGi8KW1

