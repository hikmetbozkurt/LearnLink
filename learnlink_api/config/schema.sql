--
-- PostgreSQL database dump
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



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.ai_recommendations (
    recommendation_id integer NOT NULL,
    content_id integer NOT NULL,
    user_id integer NOT NULL
);




--
-- Name: ai_recommendations_recommendation_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.ai_recommendations_recommendation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: ai_recommendations_recommendation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.ai_recommendations_recommendation_id_seq OWNED BY public.ai_recommendations.recommendation_id;


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.assignments (
    assignment_id integer NOT NULL,
    due_date date NOT NULL,
    description text NOT NULL,
    course_id integer NOT NULL
);




--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.assignments_assignment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.assignments_assignment_id_seq OWNED BY public.assignments.assignment_id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    chat_id integer,
    sender_id integer,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.chat_participants (
    chat_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: chatroom_members; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.chatroom_members (
    chatroom_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: chatrooms; Type: TABLE; Schema: public; Owner: keremtegiz
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




--
-- Name: chatrooms_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.chatrooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: chatrooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.chatrooms_id_seq OWNED BY public.chatrooms.id;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    title character varying(100),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: course_contents; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.course_contents (
    content_id integer NOT NULL,
    file_type character varying(50) NOT NULL,
    submission_date date NOT NULL,
    course_id integer NOT NULL
);




--
-- Name: course_contents_content_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.course_contents_content_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: course_contents_content_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.course_contents_content_id_seq OWNED BY public.course_contents.content_id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.courses (
    course_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    instructor_id integer,
    category character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.courses_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: courses_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.courses_course_id_seq OWNED BY public.courses.course_id;


--
-- Name: direct_messages; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.direct_messages (
    id integer NOT NULL,
    user1_id integer,
    user2_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: direct_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.direct_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: direct_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.direct_messages_id_seq OWNED BY public.direct_messages.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.enrollments (
    enrollment_id integer NOT NULL,
    course_id integer,
    user_id integer,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.enrollments_enrollment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.enrollments_enrollment_id_seq OWNED BY public.enrollments.enrollment_id;


--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.friend_requests (
    id integer NOT NULL,
    sender_id integer,
    receiver_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: friend_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.friend_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: friend_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.friend_requests_id_seq OWNED BY public.friend_requests.id;


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.friendships (
    id integer NOT NULL,
    user1_id integer,
    user2_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: friendships_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.friendships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: friendships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.friendships_id_seq OWNED BY public.friendships.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    content text NOT NULL,
    sender_id integer,
    chatroom_id integer,
    dm_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: keremtegiz
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
    reference_id integer
);




--
-- Name: notifications_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.notifications_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: notifications_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.notifications_notifications_id_seq OWNED BY public.notifications.notifications_id;


--
-- Name: progress_tracking; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.progress_tracking (
    progress_id integer NOT NULL,
    last_access timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completion boolean NOT NULL,
    user_id integer NOT NULL
);




--
-- Name: progress_tracking_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.progress_tracking_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: progress_tracking_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.progress_tracking_progress_id_seq OWNED BY public.progress_tracking.progress_id;


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.submissions (
    submission_id integer NOT NULL,
    submissiondate timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id integer NOT NULL,
    assignment_id integer NOT NULL
);




--
-- Name: submissions_submission_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.submissions_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: submissions_submission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.submissions_submission_id_seq OWNED BY public.submissions.submission_id;


--
-- Name: user_courses; Type: TABLE; Schema: public; Owner: keremtegiz
--

CREATE TABLE public.user_courses (
    user_id integer NOT NULL,
    course_id integer NOT NULL
);




--
-- Name: users; Type: TABLE; Schema: public; Owner: keremtegiz
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
    username character varying(255)
);




--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: keremtegiz
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;




--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: keremtegiz
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: ai_recommendations recommendation_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.ai_recommendations ALTER COLUMN recommendation_id SET DEFAULT nextval('public.ai_recommendations_recommendation_id_seq'::regclass);


--
-- Name: assignments assignment_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.assignments_assignment_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chatrooms id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chatrooms ALTER COLUMN id SET DEFAULT nextval('public.chatrooms_id_seq'::regclass);


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: course_contents content_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.course_contents ALTER COLUMN content_id SET DEFAULT nextval('public.course_contents_content_id_seq'::regclass);


--
-- Name: courses course_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.courses ALTER COLUMN course_id SET DEFAULT nextval('public.courses_course_id_seq'::regclass);


--
-- Name: direct_messages id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.direct_messages ALTER COLUMN id SET DEFAULT nextval('public.direct_messages_id_seq'::regclass);


--
-- Name: enrollments enrollment_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN enrollment_id SET DEFAULT nextval('public.enrollments_enrollment_id_seq'::regclass);


--
-- Name: friend_requests id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friend_requests ALTER COLUMN id SET DEFAULT nextval('public.friend_requests_id_seq'::regclass);


--
-- Name: friendships id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friendships ALTER COLUMN id SET DEFAULT nextval('public.friendships_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications notifications_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notifications_id SET DEFAULT nextval('public.notifications_notifications_id_seq'::regclass);


--
-- Name: progress_tracking progress_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.progress_tracking ALTER COLUMN progress_id SET DEFAULT nextval('public.progress_tracking_progress_id_seq'::regclass);


--
-- Name: submissions submission_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.submissions ALTER COLUMN submission_id SET DEFAULT nextval('public.submissions_submission_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);




--
-- Name: ai_recommendations_recommendation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.ai_recommendations_recommendation_id_seq', 1, false);


--
-- Name: assignments_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.assignments_assignment_id_seq', 1, false);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: chatrooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.chatrooms_id_seq', 4, true);


--
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.chats_id_seq', 1, false);


--
-- Name: course_contents_content_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.course_contents_content_id_seq', 1, false);


--
-- Name: courses_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.courses_course_id_seq', 1, false);


--
-- Name: direct_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.direct_messages_id_seq', 3, true);


--
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.enrollments_enrollment_id_seq', 1, false);


--
-- Name: friend_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.friend_requests_id_seq', 12, true);


--
-- Name: friendships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.friendships_id_seq', 5, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.messages_id_seq', 37, true);


--
-- Name: notifications_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.notifications_notifications_id_seq', 208, true);


--
-- Name: progress_tracking_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.progress_tracking_progress_id_seq', 1, false);


--
-- Name: submissions_submission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.submissions_submission_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: keremtegiz
--

SELECT pg_catalog.setval('public.users_user_id_seq', 7, true);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (recommendation_id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (assignment_id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_participants chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (chat_id, user_id);


--
-- Name: chatroom_members chatroom_members_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_pkey PRIMARY KEY (chatroom_id, user_id);


--
-- Name: chatrooms chatrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chatrooms
    ADD CONSTRAINT chatrooms_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: course_contents course_contents_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.course_contents
    ADD CONSTRAINT course_contents_pkey PRIMARY KEY (content_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- Name: direct_messages direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_course_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_user_id_key UNIQUE (course_id, user_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (enrollment_id);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_sender_id_receiver_id_key; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_user1_id_user2_id_key; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user1_id_user2_id_key UNIQUE (user1_id, user2_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notifications_id);


--
-- Name: progress_tracking progress_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.progress_tracking
    ADD CONSTRAINT progress_tracking_pkey PRIMARY KEY (progress_id);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (submission_id);


--
-- Name: user_courses user_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.user_courses
    ADD CONSTRAINT user_courses_pkey PRIMARY KEY (user_id, course_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: ai_recommendations ai_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: chat_messages chat_messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id);


--
-- Name: chat_participants chat_participants_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: chat_participants chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chatroom_members chatroom_members_chatroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_chatroom_id_fkey FOREIGN KEY (chatroom_id) REFERENCES public.chatrooms(id);


--
-- Name: chatroom_members chatroom_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chatrooms chatrooms_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chatrooms
    ADD CONSTRAINT chatrooms_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: chats chats_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: course_contents course_contents_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.course_contents
    ADD CONSTRAINT course_contents_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id);


--
-- Name: direct_messages direct_messages_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(user_id);


--
-- Name: direct_messages direct_messages_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(user_id);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: friend_requests friend_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: messages messages_chatroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chatroom_id_fkey FOREIGN KEY (chatroom_id) REFERENCES public.chatrooms(id) ON DELETE CASCADE;


--
-- Name: messages messages_dm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_dm_id_fkey FOREIGN KEY (dm_id) REFERENCES public.direct_messages(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: progress_tracking progress_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.progress_tracking
    ADD CONSTRAINT progress_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(assignment_id);


--
-- Name: submissions submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_courses user_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.user_courses
    ADD CONSTRAINT user_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id);


--
-- Name: user_courses user_courses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: keremtegiz
--

ALTER TABLE ONLY public.user_courses
    ADD CONSTRAINT user_courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Posts tablosu
--

CREATE TABLE IF NOT EXISTS posts (
    post_id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'text', 'pdf', 'video' gibi
    file_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts için indeksler
CREATE INDEX IF NOT EXISTS idx_posts_course_id ON posts(course_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);


--
-- PostgreSQL database dump complete
--

