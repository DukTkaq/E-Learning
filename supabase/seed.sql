-- Development seed for the shared SWP391 Supabase project.
-- Keeps users, roles and categories; replaces all course-related records.
begin;

do $$
declare
  instructor_id_value uuid;
  category_id_value integer;
  course_id_value uuid;
  lesson_id_value uuid;
  quiz_id_value uuid;
  course_index integer;
  lesson_index integer;
  question_index integer;
  lesson_title_value text;
  question_content text;
  question_option_a text;
  question_option_b text;
  question_option_c text;
  question_option_d text;
  course_titles text[] := array[
    'Web Development Fundamentals',
    'JavaScript Application Development',
    'React Interface Design',
    'Node.js REST API Development',
    'Relational Database Design',
    'Data Structures and Algorithms',
    'Python Data Analysis',
    'Software Testing Fundamentals',
    'Git and Team Collaboration',
    'Cloud Deployment Essentials'
  ];
  course_descriptions text[] := array[
    'Build a strong foundation in semantic HTML, modern CSS and responsive web layouts through guided practice.',
    'Learn practical JavaScript syntax, asynchronous programming and browser API integration for interactive applications.',
    'Design maintainable React interfaces with reusable components, state management and a complete dashboard project.',
    'Create secure REST APIs with Express, request validation, error handling and a structured backend project.',
    'Model relational data, write reliable SQL queries and design a database for a realistic learning platform.',
    'Understand complexity, core data structures and common problem-solving patterns used in software development.',
    'Use Python, Pandas and visualization tools to clean, explore and communicate insights from real datasets.',
    'Plan effective test cases and build unit and integration tests that protect important application behavior.',
    'Work safely with branches, pull requests and conflict resolution in a collaborative Git workflow.',
    'Package an application, configure environments and automate a repeatable deployment workflow to the cloud.'
  ];
  lesson_one_titles text[] := array[
    'HTML and CSS Foundations',
    'JavaScript Language Essentials',
    'Components and Props',
    'Express Routes and Controllers',
    'Entities and Relationships',
    'Complexity, Arrays and Lists',
    'NumPy and Pandas Foundations',
    'Test Cases and Test Design',
    'Commits and Branches',
    'Containers and Runtime Basics'
  ];
  lesson_two_titles text[] := array[
    'Responsive Layout Techniques',
    'Asynchronous Code and APIs',
    'State, Events and Hooks',
    'Validation and Error Handling',
    'SQL Queries and Transactions',
    'Stacks, Queues and Trees',
    'Data Cleaning and Visualization',
    'Unit and Integration Testing',
    'Pull Requests and Conflict Resolution',
    'Environment Configuration and CI'
  ];
  lesson_three_titles text[] := array[
    'Final Project: Responsive Landing Page',
    'Final Project: Interactive JavaScript App',
    'Final Project: React Dashboard',
    'Final Project: Production-ready REST API',
    'Final Project: E-Learning Database',
    'Final Project: Algorithm Challenge',
    'Final Project: Dataset Analysis',
    'Final Project: Automated Test Suite',
    'Final Project: Team Release Workflow',
    'Final Project: Deploy a Web Service'
  ];
  thumbnails text[] := array[
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/modern-javascript.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/react-frontend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/ui-ux-design.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/node-backend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/sql-database.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/calculus.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/python-data.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/cloud-devops.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/git-collaboration.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/linear-algebra.jpg'
  ];
  lesson_videos text[] := array[
    'https://www.youtube.com/watch?v=UB1O30fR-EE',
    'https://www.youtube.com/watch?v=PkZNo7MFNFg',
    'https://www.youtube.com/watch?v=pQN-pnXPaVg'
  ];
begin
  select u.id
  into instructor_id_value
  from public.users u
  join public.roles r on r.id = u.role_id
  where lower(r.role_name) = 'instructor'
  order by u.created_at, u.id
  limit 1;

  select c.id
  into category_id_value
  from public.categories c
  order by c.id
  limit 1;

  if instructor_id_value is null then
    raise exception 'Seed requires at least one Instructor user.';
  end if;

  if category_id_value is null then
    raise exception 'Seed requires at least one category.';
  end if;

  -- Course deletion cascades to lessons, quizzes, questions, cart items,
  -- payments, enrollments, certificates and reviews. Remove course vouchers
  -- first because their course foreign key uses SET NULL instead of CASCADE.
  delete from public.coupons where course_id is not null;
  delete from public.courses;

  for course_index in 1..array_length(course_titles, 1) loop
    course_id_value := gen_random_uuid();

    insert into public.courses (
      id, title, description, thumbnail, price, status,
      instructor_id, category_id, created_at, updated_at
    ) values (
      course_id_value,
      course_titles[course_index],
      course_descriptions[course_index],
      thumbnails[course_index],
      (149000 + course_index * 25000)::numeric(10, 2),
      'Draft',
      instructor_id_value,
      category_id_value,
      now() - ((11 - course_index) * interval '1 minute'),
      now() - ((11 - course_index) * interval '1 minute')
    );

    for lesson_index in 1..3 loop
      lesson_id_value := gen_random_uuid();
      lesson_title_value := case lesson_index
        when 1 then lesson_one_titles[course_index]
        when 2 then lesson_two_titles[course_index]
        else lesson_three_titles[course_index]
      end;

      insert into public.lessons (
        id, title, video_url, course_id, order_index, is_final, created_at, updated_at
      ) values (
        lesson_id_value,
        lesson_title_value,
        lesson_videos[lesson_index],
        course_id_value,
        lesson_index - 1,
        lesson_index = 3,
        now(),
        now()
      );

      quiz_id_value := gen_random_uuid();
      insert into public.quizzes (
        id, title, passing_score, max_attempts, lesson_id, created_at, updated_at
      ) values (
        quiz_id_value,
        lesson_title_value || ' Quiz',
        70,
        3,
        lesson_id_value,
        now(),
        now()
      );

      for question_index in 1..3 loop
        case question_index
          when 1 then
            question_content := 'What is the main goal of "' || lesson_title_value || '"?';
            question_option_a := 'Understand and apply the lesson''s core concept';
            question_option_b := 'Skip the lesson content';
            question_option_c := 'Avoid all practical exercises';
            question_option_d := 'Memorize unrelated facts';
          when 2 then
            question_content := 'Which approach best supports learning in "' || lesson_title_value || '"?';
            question_option_a := 'Practice with examples and review the result';
            question_option_b := 'Ignore feedback and errors';
            question_option_c := 'Use random steps without checking';
            question_option_d := 'Stop after reading the title';
          else
            question_content := 'What should a learner do before completing "' || lesson_title_value || '"?';
            question_option_a := 'Complete the quiz and verify their understanding';
            question_option_b := 'Delete the course from the system';
            question_option_c := 'Change the course category';
            question_option_d := 'Skip every exercise';
        end case;

        insert into public.questions (
          id, content, option_a, option_b, option_c, option_d,
          correct_answer, quiz_id, created_at, updated_at
        ) values (
          gen_random_uuid(),
          question_content,
          question_option_a,
          question_option_b,
          question_option_c,
          question_option_d,
          'A',
          quiz_id_value,
          now(),
          now()
        );
      end loop;
    end loop;
  end loop;
end $$;

commit;
