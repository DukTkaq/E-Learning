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

-- BEGIN APPROVED COURSE SEED
-- Replaces only this approved demo catalog when the block is run again.
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
    'Advanced TypeScript Patterns',
    'Next.js Full Stack Applications',
    'Java Spring Boot APIs',
    'C# and ASP.NET Core',
    'Mobile Development with Flutter',
    'Machine Learning Foundations',
    'Cybersecurity Essentials',
    'Docker and Kubernetes Fundamentals',
    'UI Design Systems',
    'Agile Software Project Management'
  ];
  course_descriptions text[] := array[
    'Build reliable TypeScript applications with advanced typing, generics and maintainable architecture patterns.',
    'Create a production-style full stack application with Next.js routing, server features and data integration.',
    'Design structured Java APIs with Spring Boot, dependency injection, validation and persistence.',
    'Develop maintainable web APIs with ASP.NET Core, Entity Framework and layered application design.',
    'Build responsive cross-platform mobile interfaces and connect them to remote application services.',
    'Understand the complete machine learning workflow from preparing data to evaluating a trained model.',
    'Protect modern applications by understanding common threats, secure coding and practical risk controls.',
    'Package services with Docker and operate a small containerized application with Kubernetes.',
    'Create reusable interface foundations with design tokens, accessible components and clear documentation.',
    'Plan and deliver software iteratively using a healthy backlog, sprint workflow and measurable outcomes.'
  ];
  lesson_one_titles text[] := array[
    'Generics and Type Composition',
    'App Router and Server Components',
    'Spring Boot Project Structure',
    'ASP.NET Core Request Pipeline',
    'Flutter Widgets and Layouts',
    'Data Preparation and Features',
    'Threats and Attack Surfaces',
    'Building Images with Docker',
    'Design Tokens and Foundations',
    'Product Backlog and User Stories'
  ];
  lesson_two_titles text[] := array[
    'Type-safe Application Architecture',
    'Data Fetching and Mutations',
    'Validation and Persistence',
    'Entity Framework and Services',
    'State and API Integration',
    'Training and Evaluating Models',
    'Authentication and Secure Coding',
    'Deployments and Services',
    'Accessible Component Patterns',
    'Sprint Planning and Execution'
  ];
  lesson_three_titles text[] := array[
    'Final Project: Typed Application Module',
    'Final Project: Full Stack Product',
    'Final Project: Spring REST Service',
    'Final Project: ASP.NET Web API',
    'Final Project: Cross-platform Mobile App',
    'Final Project: Prediction Pipeline',
    'Final Project: Application Security Review',
    'Final Project: Containerized Deployment',
    'Final Project: Documented UI Library',
    'Final Project: Product Delivery Plan'
  ];
  thumbnails text[] := array[
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/modern-javascript.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/react-frontend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/node-backend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/sql-database.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/ui-ux-design.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/python-data.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/git-collaboration.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/cloud-devops.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/linear-algebra.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/calculus.jpg'
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
    raise exception 'Approved seed requires at least one Instructor user.';
  end if;

  if category_id_value is null then
    raise exception 'Approved seed requires at least one category.';
  end if;

  delete from public.courses where title = any(course_titles);

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
      (249000 + course_index * 30000)::numeric(10, 2),
      'Approved',
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
            question_content := 'Which outcome best represents the goal of "' || lesson_title_value || '"?';
            question_option_a := 'Apply the lesson concept in a practical scenario';
            question_option_b := 'Avoid using the lesson concept';
            question_option_c := 'Memorize an unrelated definition';
            question_option_d := 'Skip directly to another course';
          when 2 then
            question_content := 'What is the best way to strengthen the skill from "' || lesson_title_value || '"?';
            question_option_a := 'Practice, inspect the result and improve the solution';
            question_option_b := 'Ignore errors and feedback';
            question_option_c := 'Copy a result without understanding it';
            question_option_d := 'Avoid completing any exercises';
          else
            question_content := 'How should a learner confirm readiness after "' || lesson_title_value || '"?';
            question_option_a := 'Complete the quiz and explain the key idea';
            question_option_b := 'Change the instructor account';
            question_option_c := 'Remove the course thumbnail';
            question_option_d := 'Leave every answer blank';
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
-- END APPROVED COURSE SEED

-- BEGIN ADMIN DEMO SEED
-- Adds enough realistic records to exercise Admin search, filters and pagination.
-- Existing team accounts and courses are preserved. Only demo records owned by
-- this block are updated when the seed is run again.
do $$
declare
  student_role_id integer;
  instructor_role_id integer;
  password_value varchar;
  instructor_id_value uuid;
  course_id_value uuid;
  lesson_id_value uuid;
  quiz_id_value uuid;
  category_id_value integer;
  item_index integer;
  lesson_index integer;
  category_count integer;
  course_titles text[] := array[
    'REST API Design in Practice',
    'Responsive Web Interfaces',
    'Data Visualization Essentials',
    'Practical Machine Learning',
    'Secure Web Application Design',
    'Cloud Architecture Foundations',
    'Relational Database Modeling',
    'Automated Software Testing',
    'Mobile App Product Design',
    'DevOps Delivery Pipelines',
    'Business Analysis Workshop',
    'Digital Product Management',
    'Clean Code for Team Projects',
    'Modern Authentication Patterns',
    'Introduction to Game Development',
    'English for Technology Teams',
    'Applied Mathematics for Computing',
    'User Research and Prototyping'
  ];
  course_statuses text[] := array[
    'Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Pending',
    'Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Pending',
    'Rejected', 'Rejected', 'Rejected',
    'Hidden', 'Hidden', 'Hidden'
  ];
  thumbnails text[] := array[
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/modern-javascript.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/react-frontend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/python-data.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/linear-algebra.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/git-collaboration.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/cloud-devops.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/sql-database.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/node-backend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/ui-ux-design.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/calculus.jpg'
  ];
  category_names text[] := array[
    'Web Development', 'Mobile Development', 'Data Science',
    'Artificial Intelligence', 'Cloud Computing', 'Cybersecurity',
    'Database Systems', 'Software Testing', 'UI UX Design', 'DevOps',
    'Project Management', 'Business Analysis', 'Digital Marketing',
    'Mathematics', 'English Communication', 'Game Development'
  ];
begin
  select id into student_role_id from public.roles where lower(role_name) = 'student' limit 1;
  select id into instructor_role_id from public.roles where lower(role_name) = 'instructor' limit 1;
  select password into password_value from public.users where email = 'admin@fpt.edu.vn' limit 1;
  select id into instructor_id_value from public.users where email = 'teacher@fpt.edu.vn' limit 1;

  if student_role_id is null or instructor_role_id is null then
    raise exception 'Admin demo seed requires Student and Instructor roles.';
  end if;
  if password_value is null or instructor_id_value is null then
    raise exception 'Admin demo seed requires the standard Admin and Lead Teacher accounts.';
  end if;

  for item_index in 1..array_length(category_names, 1) loop
    if not exists (
      select 1 from public.categories where lower(name) = lower(category_names[item_index])
    ) then
      insert into public.categories (name, description, created_at, updated_at)
      values (
        category_names[item_index],
        'Courses and learning paths for ' || category_names[item_index] || '.',
        now() - ((array_length(category_names, 1) - item_index) * interval '1 day'),
        now()
      );
    end if;
  end loop;

  -- General users provide realistic role and account-status filters.
  for item_index in 1..20 loop
    insert into public.users (
      id, name, email, password, status, role_id, created_at
    ) values (
      gen_random_uuid(),
      'Demo Student ' || lpad(item_index::text, 2, '0'),
      'demo.student' || lpad(item_index::text, 2, '0') || '@elearning.test',
      password_value,
      case when item_index % 9 = 0 then 'Rejected'
           when item_index % 6 = 0 then 'Banned'
           else 'Active' end,
      student_role_id,
      now() - ((21 - item_index) * interval '1 day')
    )
    on conflict (email) do update set
      name = excluded.name,
      password = excluded.password,
      status = excluded.status,
      role_id = excluded.role_id,
      created_at = excluded.created_at;
  end loop;

  -- Pending Student accounts represent instructor applications. Odd-numbered
  -- records intentionally miss one profile field for the profile filter.
  for item_index in 1..14 loop
    insert into public.users (
      id, name, email, password, status, role_id, created_at,
      expertise, bio, portfolio_url
    ) values (
      gen_random_uuid(),
      'Instructor Applicant ' || lpad(item_index::text, 2, '0'),
      'demo.applicant' || lpad(item_index::text, 2, '0') || '@elearning.test',
      password_value,
      'Pending',
      student_role_id,
      now() - ((15 - item_index) * interval '6 hours'),
      case when item_index % 5 = 0 then null
           else (array['Web Development','Data Science','Cloud Computing','UI UX Design'])[1 + ((item_index - 1) % 4)] end,
      case when item_index % 3 = 0 then null
           else 'Educator with practical project experience and a clear plan for student-focused lessons.' end,
      case when item_index % 2 = 0 then 'https://github.com/swp391-demo/applicant-' || item_index
           else null end
    )
    on conflict (email) do update set
      name = excluded.name,
      password = excluded.password,
      status = excluded.status,
      role_id = excluded.role_id,
      created_at = excluded.created_at,
      expertise = excluded.expertise,
      bio = excluded.bio,
      portfolio_url = excluded.portfolio_url;
  end loop;

  for item_index in 1..4 loop
    insert into public.users (
      id, name, email, password, status, role_id, created_at,
      expertise, bio, portfolio_url
    ) values (
      gen_random_uuid(),
      'Demo Instructor ' || lpad(item_index::text, 2, '0'),
      'demo.instructor' || lpad(item_index::text, 2, '0') || '@elearning.test',
      password_value,
      'Active',
      instructor_role_id,
      now() - ((5 - item_index) * interval '10 days'),
      (array['Backend Engineering','Mobile Development','Data Analytics','Product Design'])[item_index],
      'Active instructor account used for Admin role and status filtering.',
      'https://github.com/swp391-demo/instructor-' || item_index
    )
    on conflict (email) do update set
      name = excluded.name,
      password = excluded.password,
      status = excluded.status,
      role_id = excluded.role_id,
      created_at = excluded.created_at,
      expertise = excluded.expertise,
      bio = excluded.bio,
      portfolio_url = excluded.portfolio_url;
  end loop;

  select count(*) into category_count from public.categories;
  delete from public.courses where title = any(course_titles);

  -- Review courses include complete lesson, quiz and question data so Admin can
  -- inspect them during approval instead of seeing empty placeholder courses.
  for item_index in 1..array_length(course_titles, 1) loop
    select id into category_id_value
    from public.categories
    order by id
    offset ((item_index - 1) % least(category_count, 10))
    limit 1;

    course_id_value := gen_random_uuid();
    insert into public.courses (
      id, title, description, thumbnail, price, status,
      instructor_id, category_id, created_at, updated_at
    ) values (
      course_id_value,
      course_titles[item_index],
      'A structured, project-based course covering the essential concepts, guided practice and a final applied lesson.',
      thumbnails[1 + ((item_index - 1) % array_length(thumbnails, 1))],
      (219000 + item_index * 18000)::numeric(10, 2),
      course_statuses[item_index],
      instructor_id_value,
      category_id_value,
      now() - ((array_length(course_titles, 1) - item_index) * interval '2 hours'),
      now()
    );

    for lesson_index in 1..3 loop
      lesson_id_value := gen_random_uuid();
      insert into public.lessons (
        id, title, video_url, course_id, order_index, is_final, created_at, updated_at
      ) values (
        lesson_id_value,
        case lesson_index when 1 then 'Core Concepts'
                          when 2 then 'Guided Practice'
                          else 'Final Applied Project' end,
        (array[
          'https://www.youtube.com/watch?v=UB1O30fR-EE',
          'https://www.youtube.com/watch?v=PkZNo7MFNFg',
          'https://www.youtube.com/watch?v=pQN-pnXPaVg'
        ])[lesson_index],
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
        'Lesson ' || lesson_index || ' Knowledge Check',
        70,
        3,
        lesson_id_value,
        now(),
        now()
      );

      insert into public.questions (
        id, content, option_a, option_b, option_c, option_d,
        correct_answer, quiz_id, created_at, updated_at
      ) values
        (gen_random_uuid(), 'What is the main objective of this lesson?',
         'Apply the lesson concept correctly', 'Skip the lesson activity',
         'Remove the course content', 'Ignore the expected outcome',
         'A', quiz_id_value, now(), now()),
        (gen_random_uuid(), 'Which approach best supports effective practice?',
         'Practice, review feedback and improve', 'Copy without understanding',
         'Avoid testing the result', 'Leave the activity unfinished',
         'A', quiz_id_value, now(), now()),
        (gen_random_uuid(), 'How should learners confirm their understanding?',
         'Complete the quiz and explain the solution', 'Change the course thumbnail',
         'Skip directly to the certificate', 'Leave every answer blank',
         'A', quiz_id_value, now(), now());
    end loop;
  end loop;
end $$;
-- END ADMIN DEMO SEED

-- BEGIN VOUCHER SEED
-- Adds a reusable marketing dataset for Instructor voucher pagination and filters.
do $$
declare
  instructor_id_value uuid;
  course_id_value uuid;
  course_count integer;
  voucher_index integer;
  voucher_codes text[] := array[
    'WELCOME10', 'FIRSTSTEP15', 'BACKTOSCHOOL20', 'SKILLUP25', 'CAREER30',
    'TECHDAY35', 'CODEMORE40', 'CLOUD45', 'DATA50', 'FULLSTACK55',
    'MOBILE60', 'DEVOPS65', 'SECURITY70', 'DESIGN75', 'TESTING80',
    'AGILE85', 'PROJECT90', 'LEARNMORE12', 'WEEKEND18', 'STUDY22',
    'STARTNOW28', 'BUILD32', 'PRACTICE38', 'UPGRADE42', 'NEXTLEVEL48',
    'TEAMWORK52', 'FUTURE58', 'PROGRESS62', 'MASTER68', 'VIP100'
  ];
  voucher_discounts integer[] := array[
    10, 15, 20, 25, 30,
    35, 40, 45, 50, 55,
    60, 65, 70, 75, 80,
    85, 90, 12, 18, 22,
    28, 32, 38, 42, 48,
    52, 58, 62, 68, 100
  ];
begin
  select u.id
  into instructor_id_value
  from public.users u
  join public.roles r on r.id = u.role_id
  where lower(r.role_name) = 'instructor'
  order by u.created_at, u.id
  limit 1;

  select count(*)
  into course_count
  from public.courses
  where instructor_id = instructor_id_value;

  if instructor_id_value is null or course_count = 0 then
    raise exception 'Voucher seed requires an Instructor with at least one course.';
  end if;

  for voucher_index in 1..array_length(voucher_codes, 1) loop
    course_id_value := null;

    -- Every third voucher applies to all courses. The rest rotate through
    -- the Instructor's courses so search and target filters have useful data.
    if voucher_index % 3 <> 0 then
      select c.id
      into course_id_value
      from public.courses c
      where c.instructor_id = instructor_id_value
      order by c.title, c.id
      offset ((voucher_index - 1) % course_count)
      limit 1;
    end if;

    insert into public.coupons (
      id, code, discount_percent, instructor_id, course_id, created_at, updated_at
    ) values (
      gen_random_uuid(),
      voucher_codes[voucher_index],
      voucher_discounts[voucher_index],
      instructor_id_value,
      course_id_value,
      now() - ((array_length(voucher_codes, 1) - voucher_index) * interval '1 day'),
      now()
    )
    on conflict (code) do update set
      discount_percent = excluded.discount_percent,
      instructor_id = excluded.instructor_id,
      course_id = excluded.course_id,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;
  end loop;
end $$;
-- END VOUCHER SEED

commit;
