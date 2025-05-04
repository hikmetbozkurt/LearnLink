--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.4 (Debian 17.4-1.pgdg120+2)

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
-- Name: ensure_user_order(); Type: FUNCTION; Schema: public; Owner: learnlink
--

CREATE FUNCTION public.ensure_user_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.user1_id > NEW.user2_id THEN
        NEW.user1_id := NEW.user2_id;
        NEW.user2_id := NEW.user1_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.ensure_user_order() OWNER TO learnlink;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: learnlink
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO learnlink;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.ai_recommendations (
    recommendation_id integer NOT NULL,
    content_id integer NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.ai_recommendations OWNER TO learnlink;

--
-- Name: ai_recommendations_recommendation_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.ai_recommendations_recommendation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_recommendations_recommendation_id_seq OWNER TO learnlink;

--
-- Name: ai_recommendations_recommendation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.ai_recommendations_recommendation_id_seq OWNED BY public.ai_recommendations.recommendation_id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.assignments (
    assignment_id integer NOT NULL,
    due_date timestamp without time zone NOT NULL,
    description text NOT NULL,
    course_id integer NOT NULL,
    title character varying(255) DEFAULT 'Assignment'::character varying NOT NULL,
    points integer DEFAULT 100,
    grading_criteria text,
    type character varying(20) DEFAULT 'assignment'::character varying
);


ALTER TABLE public.assignments OWNER TO learnlink;

--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assignments_assignment_id_seq OWNER TO learnlink;

--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.assignments_assignment_id_seq OWNED BY public.assignments.assignment_id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    chat_id integer,
    sender_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_messages OWNER TO learnlink;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO learnlink;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.chat_participants (
    chat_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_participants OWNER TO learnlink;

--
-- Name: chatroom_members; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.chatroom_members (
    chatroom_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chatroom_members OWNER TO learnlink;

--
-- Name: chatrooms; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.chatrooms (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_direct_message boolean DEFAULT false,
    last_message_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chatrooms OWNER TO learnlink;

--
-- Name: chatrooms_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.chatrooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chatrooms_id_seq OWNER TO learnlink;

--
-- Name: chatrooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.chatrooms_id_seq OWNED BY public.chatrooms.id;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    title character varying(100),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chats OWNER TO learnlink;

--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chats_id_seq OWNER TO learnlink;

--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.comments (
    comment_id integer NOT NULL,
    post_id integer,
    author_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.comments OWNER TO learnlink;

--
-- Name: comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_comment_id_seq OWNER TO learnlink;

--
-- Name: comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.comments_comment_id_seq OWNED BY public.comments.comment_id;


--
-- Name: course_contents; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.course_contents (
    content_id integer NOT NULL,
    file_type character varying(50) NOT NULL,
    submission_date date NOT NULL,
    course_id integer NOT NULL
);


ALTER TABLE public.course_contents OWNER TO learnlink;

--
-- Name: course_contents_content_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.course_contents_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_contents_content_id_seq OWNER TO learnlink;

--
-- Name: course_contents_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.course_contents_content_id_seq OWNED BY public.course_contents.content_id;


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.course_enrollments (
    enrollment_id integer NOT NULL,
    course_id integer,
    user_id integer,
    role character varying(20) DEFAULT 'student'::character varying,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_enrollments_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.course_enrollments OWNER TO learnlink;

--
-- Name: course_enrollments_enrollment_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.course_enrollments_enrollment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_enrollments_enrollment_id_seq OWNER TO learnlink;

--
-- Name: course_enrollments_enrollment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.course_enrollments_enrollment_id_seq OWNED BY public.course_enrollments.enrollment_id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.courses (
    course_id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    instructor_id integer,
    max_students integer DEFAULT 30,
    student_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.courses OWNER TO learnlink;

--
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.courses_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_course_id_seq OWNER TO learnlink;

--
-- Name: courses_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.courses_course_id_seq OWNED BY public.courses.course_id;


--
-- Name: direct_messages; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.direct_messages (
    id integer NOT NULL,
    user1_id integer,
    user2_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.direct_messages OWNER TO learnlink;

--
-- Name: direct_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.direct_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.direct_messages_id_seq OWNER TO learnlink;

--
-- Name: direct_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.direct_messages_id_seq OWNED BY public.direct_messages.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.enrollments (
    enrollment_id integer NOT NULL,
    course_id integer,
    user_id integer,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.enrollments OWNER TO learnlink;

--
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.enrollments_enrollment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_enrollment_id_seq OWNER TO learnlink;

--
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.enrollments_enrollment_id_seq OWNED BY public.enrollments.enrollment_id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    type character varying(50) NOT NULL,
    created_by integer NOT NULL,
    course_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.events OWNER TO learnlink;

--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_event_id_seq OWNER TO learnlink;

--
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.friend_requests (
    id integer NOT NULL,
    sender_id integer,
    receiver_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.friend_requests OWNER TO learnlink;

--
-- Name: friend_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.friend_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friend_requests_id_seq OWNER TO learnlink;

--
-- Name: friend_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.friend_requests_id_seq OWNED BY public.friend_requests.id;


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.friendships (
    id integer NOT NULL,
    user1_id integer,
    user2_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.friendships OWNER TO learnlink;

--
-- Name: friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friendships_id_seq OWNER TO learnlink;

--
-- Name: friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    content text NOT NULL,
    sender_id integer,
    chatroom_id integer,
    dm_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO learnlink;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO learnlink;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.notifications (
    notifications_id integer NOT NULL,
    sender_id integer,
    recipient_id integer,
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(50) DEFAULT 'friend_request'::character varying NOT NULL,
    reference_id integer,
    assignment_id integer,
    submission_id integer,
    course_id integer,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['friend_request'::character varying, 'message'::character varying, 'course'::character varying, 'comment'::character varying, 'post'::character varying, 'new_assignment'::character varying, 'assignment_submission'::character varying, 'chat_message'::character varying, 'private_message'::character varying, 'friend_accept'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO learnlink;

--
-- Name: notifications_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.notifications_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notifications_id_seq OWNER TO learnlink;

--
-- Name: notifications_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.notifications_notifications_id_seq OWNED BY public.notifications.notifications_id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.posts (
    post_id integer NOT NULL,
    course_id integer,
    author_id integer,
    content text NOT NULL,
    type character varying(50) NOT NULL,
    file_url text,
    video_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT posts_type_check CHECK (((type)::text = ANY ((ARRAY['text'::character varying, 'pdf'::character varying, 'video'::character varying, 'image'::character varying, 'file'::character varying, 'txt'::character varying, 'rar'::character varying, 'zip'::character varying, 'word'::character varying, 'excel'::character varying, 'powerpoint'::character varying])::text[])))
);


ALTER TABLE public.posts OWNER TO learnlink;

--
-- Name: posts_post_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.posts_post_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_post_id_seq OWNER TO learnlink;

--
-- Name: posts_post_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.posts_post_id_seq OWNED BY public.posts.post_id;


--
-- Name: progress_tracking; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.progress_tracking (
    progress_id integer NOT NULL,
    last_access timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completion boolean NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.progress_tracking OWNER TO learnlink;

--
-- Name: progress_tracking_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.progress_tracking_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progress_tracking_progress_id_seq OWNER TO learnlink;

--
-- Name: progress_tracking_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.progress_tracking_progress_id_seq OWNED BY public.progress_tracking.progress_id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.submissions (
    submission_id integer NOT NULL,
    submissiondate timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id integer NOT NULL,
    assignment_id integer NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    content text,
    file_url text,
    grade character varying(10),
    feedback text
);


ALTER TABLE public.submissions OWNER TO learnlink;

--
-- Name: submissions_submission_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.submissions_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submissions_submission_id_seq OWNER TO learnlink;

--
-- Name: submissions_submission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.submissions_submission_id_seq OWNED BY public.submissions.submission_id;


--
-- Name: user_courses; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.user_courses (
    user_id integer NOT NULL,
    course_id integer NOT NULL
);


ALTER TABLE public.user_courses OWNER TO learnlink;

--
-- Name: user_profile_pictures; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.user_profile_pictures (
    id integer NOT NULL,
    user_id integer NOT NULL,
    image_data bytea NOT NULL,
    mime_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_profile_pictures OWNER TO learnlink;

--
-- Name: user_profile_pictures_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.user_profile_pictures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_profile_pictures_id_seq OWNER TO learnlink;

--
-- Name: user_profile_pictures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.user_profile_pictures_id_seq OWNED BY public.user_profile_pictures.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: learnlink
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    role character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    reset_token character varying(6),
    reset_token_expiry timestamp without time zone,
    username character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    login_provider character varying(20),
    profile_pic text
);


ALTER TABLE public.users OWNER TO learnlink;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: learnlink
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO learnlink;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learnlink
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: ai_recommendations recommendation_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.ai_recommendations ALTER COLUMN recommendation_id SET DEFAULT nextval('public.ai_recommendations_recommendation_id_seq'::regclass);


--
-- Name: assignments assignment_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.assignments_assignment_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chatrooms id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chatrooms ALTER COLUMN id SET DEFAULT nextval('public.chatrooms_id_seq'::regclass);


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: comments comment_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.comments ALTER COLUMN comment_id SET DEFAULT nextval('public.comments_comment_id_seq'::regclass);


--
-- Name: course_contents content_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_contents ALTER COLUMN content_id SET DEFAULT nextval('public.course_contents_content_id_seq'::regclass);


--
-- Name: course_enrollments enrollment_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_enrollments ALTER COLUMN enrollment_id SET DEFAULT nextval('public.course_enrollments_enrollment_id_seq'::regclass);


--
-- Name: courses course_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.courses ALTER COLUMN course_id SET DEFAULT nextval('public.courses_course_id_seq'::regclass);


--
-- Name: direct_messages id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.direct_messages ALTER COLUMN id SET DEFAULT nextval('public.direct_messages_id_seq'::regclass);


--
-- Name: enrollments enrollment_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN enrollment_id SET DEFAULT nextval('public.enrollments_enrollment_id_seq'::regclass);


--
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- Name: friend_requests id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friend_requests ALTER COLUMN id SET DEFAULT nextval('public.friend_requests_id_seq'::regclass);


--
-- Name: friendships id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications notifications_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notifications_id SET DEFAULT nextval('public.notifications_notifications_id_seq'::regclass);


--
-- Name: posts post_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.posts ALTER COLUMN post_id SET DEFAULT nextval('public.posts_post_id_seq'::regclass);


--
-- Name: progress_tracking progress_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.progress_tracking ALTER COLUMN progress_id SET DEFAULT nextval('public.progress_tracking_progress_id_seq'::regclass);


--
-- Name: submissions submission_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.submissions ALTER COLUMN submission_id SET DEFAULT nextval('public.submissions_submission_id_seq'::regclass);


--
-- Name: user_profile_pictures id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.user_profile_pictures ALTER COLUMN id SET DEFAULT nextval('public.user_profile_pictures_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (recommendation_id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (assignment_id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_participants chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (chat_id, user_id);


--
-- Name: chatroom_members chatroom_members_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_pkey PRIMARY KEY (chatroom_id, user_id);


--
-- Name: chatrooms chatrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chatrooms
    ADD CONSTRAINT chatrooms_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (comment_id);


--
-- Name: course_contents course_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_contents
    ADD CONSTRAINT course_contents_pkey PRIMARY KEY (content_id);


--
-- Name: course_enrollments course_enrollments_course_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_user_id_key UNIQUE (course_id, user_id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (enrollment_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- Name: direct_messages direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_course_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_user_id_key UNIQUE (course_id, user_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (enrollment_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_sender_id_receiver_id_key; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_user1_id_user2_id_key; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user1_id_user2_id_key UNIQUE (user1_id, user2_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notifications_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (post_id);


--
-- Name: progress_tracking progress_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.progress_tracking
    ADD CONSTRAINT progress_tracking_pkey PRIMARY KEY (progress_id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (submission_id);


--
-- Name: user_profile_pictures unique_user_profile_picture; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.user_profile_pictures
    ADD CONSTRAINT unique_user_profile_picture UNIQUE (user_id);


--
-- Name: user_courses user_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.user_courses
    ADD CONSTRAINT user_courses_pkey PRIMARY KEY (user_id, course_id);


--
-- Name: user_profile_pictures user_profile_pictures_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.user_profile_pictures
    ADD CONSTRAINT user_profile_pictures_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_comments_author_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);


--
-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--
-- Name: idx_enrollments_course_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_enrollments_course_id ON public.enrollments USING btree (course_id);


--
-- Name: idx_enrollments_user_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_enrollments_user_id ON public.enrollments USING btree (user_id);


--
-- Name: idx_events_course_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_events_course_id ON public.events USING btree (course_id);


--
-- Name: idx_events_created_by; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);


--
-- Name: idx_events_date; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_events_date ON public.events USING btree (date);


--
-- Name: idx_notifications_assignment_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_notifications_assignment_id ON public.notifications USING btree (assignment_id);


--
-- Name: idx_notifications_course_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_notifications_course_id ON public.notifications USING btree (course_id);


--
-- Name: idx_notifications_submission_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_notifications_submission_id ON public.notifications USING btree (submission_id);


--
-- Name: idx_posts_author_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);


--
-- Name: idx_posts_course_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_posts_course_id ON public.posts USING btree (course_id);


--
-- Name: idx_profile_pictures_user_id; Type: INDEX; Schema: public; Owner: learnlink
--

CREATE INDEX idx_profile_pictures_user_id ON public.user_profile_pictures USING btree (user_id);


--
-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: learnlink
--

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: learnlink
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_recommendations ai_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: chat_messages chat_messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id);


--
-- Name: chat_participants chat_participants_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: chat_participants chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chatroom_members chatroom_members_chatroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_chatroom_id_fkey FOREIGN KEY (chatroom_id) REFERENCES public.chatrooms(id);


--
-- Name: chatroom_members chatroom_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chatrooms chatrooms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chatrooms
    ADD CONSTRAINT chatrooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: chats chats_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id);


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(post_id) ON DELETE CASCADE;


--
-- Name: course_contents course_contents_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_contents
    ADD CONSTRAINT course_contents_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id);


--
-- Name: direct_messages direct_messages_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(user_id);


--
-- Name: direct_messages direct_messages_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(user_id);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: events events_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: friend_requests friend_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: messages messages_chatroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chatroom_id_fkey FOREIGN KEY (chatroom_id) REFERENCES public.chatrooms(id) ON DELETE CASCADE;


--
-- Name: messages messages_dm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_dm_id_fkey FOREIGN KEY (dm_id) REFERENCES public.direct_messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(assignment_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(submission_id) ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: posts posts_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;


--
-- Name: progress_tracking progress_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.progress_tracking
    ADD CONSTRAINT progress_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(assignment_id);


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_courses user_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.user_courses
    ADD CONSTRAINT user_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: user_courses user_courses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.user_courses
    ADD CONSTRAINT user_courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_profile_pictures user_profile_pictures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learnlink
--

ALTER TABLE ONLY public.user_profile_pictures
    ADD CONSTRAINT user_profile_pictures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO learnlink;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO learnlink;


--
-- PostgreSQL database dump complete
--

