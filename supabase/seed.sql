-- Clean development seed for the shared SWP391 Supabase project.
-- Keeps real/core users and team-created categories, removes Codex demo users,
-- replaces all course data, and uses MP4 files uploaded from the local machine
-- to the public Supabase Storage bucket `course-videos`.
begin;

-- Remove only the synthetic voucher codes created by the old pagination seed.
-- Team vouchers such as SPRING27 are intentionally preserved.
delete from public.coupons
where code = any(array[
  'WELCOME10', 'FIRSTSTEP15', 'BACKTOSCHOOL20', 'SKILLUP25', 'CAREER30',
  'TECHDAY35', 'CODEMORE40', 'CLOUD45', 'DATA50', 'FULLSTACK55',
  'MOBILE60', 'DEVOPS65', 'SECURITY70', 'DESIGN75', 'TESTING80',
  'AGILE85', 'PROJECT90', 'LEARNMORE12', 'WEEKEND18', 'STUDY22',
  'STARTNOW28', 'BUILD32', 'PRACTICE38', 'UPGRADE42', 'NEXTLEVEL48',
  'TEAMWORK52', 'FUTURE58', 'PROGRESS62', 'MASTER68', 'VIP100'
]);

-- Course deletion cascades to lessons, quizzes, questions, cart items,
-- payments, enrollments, certificates and reviews. Course-specific coupons
-- are removed first because their course foreign key uses SET NULL.
delete from public.coupons where course_id is not null;
delete from public.courses;

-- Remove only synthetic accounts created by the previous Admin demo seed.
delete from public.users where email like 'demo.%@elearning.test';

-- Keep team-created categories such as csi106 and Mae. Remove only categories
-- whose description identifies the previous generated Admin demo set.
delete from public.categories
where description like 'Courses and learning paths for %.%';

do $$
declare
  instructor_id_value uuid;
  course_id_value uuid;
  lesson_id_value uuid;
  quiz_id_value uuid;
  category_ids integer[];
  course_index integer;
  lesson_index integer;
  question_index integer;
  course_titles text[] := array[
    'Full Stack Web Engineering',
    'Data Structures and Algorithms',
    'Mobile Application Development',
    'Cloud and DevOps Fundamentals',
    'Software Testing and Quality Assurance',
    'Advanced React Architecture',
    'Node.js API Engineering',
    'PostgreSQL Database Design',
    'Python Data Analytics',
    'Machine Learning Foundations',
    'Cybersecurity Essentials',
    'Docker and Kubernetes Operations',
    'UI UX Product Design',
    'Automated Software Testing',
    'Agile Project Management'
  ];
  course_descriptions text[] := array[
    'Build maintainable web applications from responsive interfaces through secure backend APIs and deployment.',
    'Practice essential data structures, complexity analysis and reusable algorithmic problem-solving patterns.',
    'Design and implement cross-platform mobile applications through a complete product development workflow.',
    'Learn containers, continuous delivery, cloud infrastructure and reliable production operations.',
    'Plan effective test strategies and build automated checks that protect important application behavior.',
    'Build scalable React applications with reusable components, predictable state and maintainable feature boundaries.',
    'Design secure Node.js APIs with validation, authentication, persistence and consistent error handling.',
    'Model relational data and write reliable PostgreSQL queries for realistic application requirements.',
    'Clean, analyze and visualize practical datasets with Python and a repeatable analytics workflow.',
    'Understand the machine learning workflow from data preparation through model evaluation.',
    'Recognize common application threats and apply practical secure-development controls.',
    'Package services with Docker and operate a small Kubernetes deployment through guided practice.',
    'Turn user research into clear interface flows, prototypes and a consistent visual design system.',
    'Create unit, integration and end-to-end tests that protect critical application behavior.',
    'Plan iterative delivery, manage a product backlog and improve team collaboration with Agile practices.'
  ];
  course_statuses text[] := array[
    'Draft', 'Pending', 'Approved', 'Approved', 'Rejected',
    'Approved', 'Approved', 'Approved', 'Approved', 'Approved',
    'Approved', 'Approved', 'Approved', 'Approved', 'Approved'
  ];
  rejection_reasons text[] := array[
    null,
    null,
    null,
    null,
    'Please improve the audio explanation in Lesson 08 and clarify the expected result of the final project.',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ];
  thumbnails text[] := array[
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/react-frontend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/modern-javascript.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/ui-ux-design.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/cloud-devops.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/git-collaboration.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/react-frontend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/node-backend.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/sql-database.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/python-data.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/linear-algebra.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/git-collaboration.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/cloud-devops.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/ui-ux-design.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/modern-javascript.jpg',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-thumbnails/seed/calculus.jpg'
  ];
  uploaded_videos text[] := array[
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-videos/seed/local-lesson-01.mp4',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-videos/seed/local-lesson-02.mp4',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-videos/seed/local-lesson-03.mp4',
    'https://oypswqnajpvggtmzxuzr.supabase.co/storage/v1/object/public/course-videos/seed/local-lesson-04.mp4'
  ];
  lesson_topics text[] := array[
    'Orientation and Learning Goals',
    'Environment Setup',
    'Core Concepts',
    'Guided Practice',
    'Data and State',
    'Validation and Error Handling',
    'Testing the Solution',
    'Security Considerations',
    'Performance Improvement',
    'Applied Project Milestone'
  ];
begin
  select id into instructor_id_value
  from public.users
  where email = 'teacher@fpt.edu.vn'
  limit 1;

  if instructor_id_value is null then
    raise exception 'Seed requires the Lead Teacher account teacher@fpt.edu.vn.';
  end if;

  -- Keep the two original team categories available on a fresh database too.
  if not exists (select 1 from public.categories where lower(name) = 'csi106') then
    insert into public.categories (name, description, created_at, updated_at)
    values ('csi106', 'Software engineering and computing courses.', now(), now());
  end if;

  if not exists (select 1 from public.categories where lower(name) = 'mae') then
    insert into public.categories (name, description, created_at, updated_at)
    values ('Mae', 'Mathematics and foundational computing courses.', now(), now());
  end if;

  select array_agg(id order by id) into category_ids
  from public.categories
  where lower(name) in ('csi106', 'mae');

  if coalesce(array_length(category_ids, 1), 0) = 0 then
    raise exception 'Seed requires at least one course category.';
  end if;

  for course_index in 1..array_length(course_titles, 1) loop
    course_id_value := gen_random_uuid();

    insert into public.courses (
      id, title, description, thumbnail, price, status, rejection_reason,
      instructor_id, category_id, created_at, updated_at
    ) values (
      course_id_value,
      course_titles[course_index],
      course_descriptions[course_index],
      thumbnails[course_index],
      (399000 + course_index * 50000)::numeric(10, 2),
      course_statuses[course_index],
      rejection_reasons[course_index],
      instructor_id_value,
      category_ids[1 + ((course_index - 1) % array_length(category_ids, 1))],
      now() - ((array_length(course_titles, 1) + 1 - course_index) * interval '1 hour'),
      now()
    );

    for lesson_index in 1..30 loop
      lesson_id_value := gen_random_uuid();

      insert into public.lessons (
        id, title, video_url, course_id, order_index, is_final, created_at, updated_at
      ) values (
        lesson_id_value,
        'Lesson ' || lpad(lesson_index::text, 2, '0') || ': '
          || lesson_topics[1 + ((lesson_index - 1) % array_length(lesson_topics, 1))],
        uploaded_videos[1 + ((lesson_index - 1) % array_length(uploaded_videos, 1))],
        course_id_value,
        lesson_index - 1,
        lesson_index = 30,
        now() + (lesson_index * interval '1 second'),
        now()
      );

      quiz_id_value := gen_random_uuid();

      insert into public.quizzes (
        id, title, passing_score, max_attempts, lesson_id, created_at, updated_at
      ) values (
        quiz_id_value,
        'Lesson ' || lpad(lesson_index::text, 2, '0') || ' Knowledge Check',
        70,
        3,
        lesson_id_value,
        now(),
        now()
      );

      for question_index in 1..30 loop
        insert into public.questions (
          id, content, option_a, option_b, option_c, option_d,
          correct_answer, quiz_id, created_at, updated_at
        ) values (
          gen_random_uuid(),
          'Question ' || lpad(question_index::text, 2, '0')
            || ': Which approach best applies the concept from Lesson '
            || lpad(lesson_index::text, 2, '0') || '?',
          'Apply the concept through a practical example',
          'Review the requirement before choosing an approach',
          'Validate the result using evidence and feedback',
          'Explain the trade-off and improve the solution',
          (array['A', 'B', 'C', 'D'])[1 + ((question_index - 1) % 4)],
          quiz_id_value,
          now() + (question_index * interval '1 second'),
          now()
        );
      end loop;
    end loop;
  end loop;
end $$;

commit;
