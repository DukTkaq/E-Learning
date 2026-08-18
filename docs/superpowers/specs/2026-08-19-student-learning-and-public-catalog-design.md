# Student Learning and Public Catalog Design

## Objective

Implement UC-17, UC-13.1, UC-18.2, UC-19, UC-20, and UC-21 as complete student-facing flows while correcting the entry experience so an unauthenticated visitor sees the public course landing page instead of the login page.

The implementation must preserve the existing Admin, Instructor, cart, checkout, VNPay, and UC-18.1 behavior.

## Requirement Interpretation

- The product backlog is authoritative for the requested `UC-13.1`: **View Course Detail**. The RDS feature inventory contains a numbering typo that also labels Filter Courses as UC-13.1; filtering remains existing UC-13.4 behavior and is not the requested use case.
- Only `Approved` courses are public, purchasable, or accessible for learning.
- UC-17 shows only successful payments owned by the authenticated Student, newest first.
- A Student may review an enrolled course once. Completion is not required because the RDS eligibility rule is enrollment-based.
- Each lesson may have at most one quiz.
- Quiz scores use a ten-point scale. A score of at least `4.0 / 10.0` passes.
- A Student gets three failed attempts per lesson watch cycle. Passing ends the quiz flow. Three failures lock the quiz until the Student watches that lesson to the end again; the next completed watch opens a new cycle with three new attempts.
- The first quiz cycle is opened only after the Student finishes the lesson video once.

## Architecture

The existing Express and React architecture remains in place. New behavior is separated into three backend concerns:

1. Public course discovery with optional authentication.
2. Protected Student learning orchestration.
3. Protected Student payment history and review submission.

Controllers remain HTTP adapters. Stateful learning rules live in focused service modules so enrollment checks, watch-cycle transitions, quiz grading, attempt limits, and progress updates can be tested independently of React and route wiring.

The React client receives dedicated pages and API modules for course detail, payment history, course learning detail, lesson playback, quiz submission, and course review. Existing shared `Layout` and visual tokens are reused.

## Database Design

### `lesson_progress`

Stores one Student's progress for one enrolled lesson.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `user_id` | UUID | Required FK to `users` |
| `course_id` | UUID | Required FK to `courses` |
| `lesson_id` | UUID | Required FK to `lessons` |
| `progress_percent` | INTEGER | `0..100`, defaults to `0` |
| `completed_at` | TIMESTAMPTZ | First completed watch time, nullable |
| `watch_cycle` | INTEGER | Non-negative; increments only when first watch completes or a three-failure lock is cleared |
| `last_watched_at` | TIMESTAMPTZ | Latest accepted completion report |
| `created_at` | TIMESTAMPTZ | Required |
| `updated_at` | TIMESTAMPTZ | Required |

Unique key: `(user_id, lesson_id)`.

The endpoint that marks a video completed is idempotent while the quiz remains open. It increments `watch_cycle` only when `watch_cycle = 0` or when the current cycle has exactly three failed attempts and no passing attempt. Repeated completion requests cannot manufacture extra attempt cycles.

### `quiz_attempts`

Stores each graded submission.

| Column | Type | Rule |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `user_id` | UUID | Required FK to `users` |
| `course_id` | UUID | Required FK to `courses` |
| `lesson_id` | UUID | Required FK to `lessons` |
| `quiz_id` | UUID | Required FK to `quizzes` |
| `watch_cycle` | INTEGER | Must match the locked `lesson_progress.watch_cycle` during submission |
| `attempt_number` | INTEGER | `1..3` inside a watch cycle |
| `correct_count` | INTEGER | Non-negative |
| `question_count` | INTEGER | Positive |
| `score` | DECIMAL(4,2) | `0.00..10.00` |
| `passed` | BOOLEAN | `score >= 4.00` |
| `answers` | JSONB | Submitted answers keyed by question ID |
| `created_at` | TIMESTAMPTZ | Required |

Unique key: `(user_id, quiz_id, watch_cycle, attempt_number)`.

### Integrity additions

- Add a unique index on `quizzes.lesson_id` to enforce one quiz per lesson.
- Add a unique index on `reviews(user_id, course_id)` to enforce one Student review per course.
- Add indexes supporting learning lookups and payment-history ordering.
- Apply all schema changes through a new Supabase migration and matching Sequelize models/associations.

## Authentication and Routing

### Public routes

- `/` renders the course landing/catalog page for Guest and authenticated users.
- `/courses/:courseId` renders UC-13.1 course detail.
- `/login`, `/register`, `/forgot-password`, and `/reset-password` remain public.

### Protected Student routes

- `/cart`
- `/checkout`
- `/checkout/vnpay-result`
- `/my-courses`
- `/my-courses/:courseId`
- `/learn/courses/:courseId/lessons/:lessonId`
- `/payments`

Admin and Instructor routes remain unchanged.

### Add-to-cart login handoff

When a Guest clicks Add to cart:

1. Store the selected course ID and current public URL in `sessionStorage`.
2. Navigate to `/login` with the intended return URL.
3. After successful Student login, return to the public page and submit the pending add-to-cart request once.
4. Clear the pending intent after success or a terminal business error.
5. Admin and Instructor logins ignore the Student cart intent and use their role home.

This preserves the user's action without making cart APIs public.

## Backend API Contracts

### Public catalog and UC-13.1

- `GET /api/courses`
  - No token: return approved courses with `in_cart: false` and `enrolled: false`.
  - Valid Student token: also resolve owned/cart state.
  - Support existing keyword and category filters.
- `GET /api/courses/:courseId`
  - Return approved course metadata, instructor, category, public syllabus (lesson titles/order), aggregate rating, and published reviews with reviewer display name and instructor reply.
  - A valid Student token additionally returns `in_cart`, `enrolled`, and the appropriate primary action.

An optional-auth middleware accepts a missing token as Guest, validates a supplied token, and still rejects banned, invalid, or expired authenticated sessions.

### UC-17 Payment History

- `GET /api/payments`
  - Student only.
  - Filter by `user_id` and `status = 'Success'`.
  - Include course title/thumbnail, amount, payment method, checkout reference, transaction number, and paid/created time.
  - Order by `COALESCE(paid_at, created_at) DESC`.

### UC-18.2 Course Learning Detail

- `GET /api/learning/courses/:courseId`
  - Student only and enrollment required.
  - Approved course required.
  - Return course metadata, enrollment progress, the Student's existing review when present, and ordered lessons.
  - Each lesson includes watch completion, quiz availability, current attempt count, remaining attempts, lock reason, and pass status without exposing correct answers.

### UC-19 Lesson Player and Progress

- `GET /api/learning/lessons/:lessonId`
  - Student only; verify the lesson belongs to an approved enrolled course.
  - Return video metadata, navigation context, progress, and quiz summary.
- `POST /api/learning/lessons/:lessonId/complete`
  - Student only; verify enrollment.
  - Record 100% completion and perform the idempotent watch-cycle transition.
  - Recalculate aggregate enrollment progress as completed lessons divided by total course lessons.

The client reports completion from the player's ended event. Direct video URLs use the native HTML video player. Supported YouTube URLs use the YouTube player end-state event. An unsupported/unavailable video produces an explanatory error and does not unlock a quiz cycle.

### UC-20 Quiz

- `GET /api/learning/lessons/:lessonId/quiz`
  - Student only; verify enrollment and return the lesson's single quiz.
  - Return questions and choices without `correct_answer`.
  - Return watch cycle, attempts, remaining attempts, passed/locked state, and prior score summaries.
- `POST /api/learning/quizzes/:quizId/attempts`
  - Student only and enrollment required.
  - Require one submitted answer for every current question and reject unknown question IDs.
  - In a transaction, lock progress/current attempts, enforce the current watch cycle and maximum three failures, grade against current answers, and insert exactly one attempt.
  - Score formula: `round(correct_count / question_count * 10, 2)`.
  - Return score, pass/fail, remaining attempts, lock state, and per-question feedback.
  - Reject another submission after pass or after three failures until a new watch cycle opens.

### UC-21 Review and Rating

- `POST /api/courses/:courseId/reviews`
  - Student only and enrollment required.
  - Approved course required.
  - Rating must be an integer from 1 through 5.
  - Trimmed comment is required and limited to 2,000 characters.
  - Reject duplicates using both an application check and the database unique constraint.
  - Return the created published review.

## Frontend Design

### Landing/catalog

The current catalog becomes the root landing page. It retains the hero, search, category filter, and course cards. The navigation bar supports Guest login/register actions, authenticated role actions, and the Student cart count. Logo and search links target `/` instead of the protected `/dashboard`; `/dashboard` may redirect to `/` for backward compatibility.

Each course card has a clickable title/image leading to UC-13.1 detail. Add to cart invokes the login handoff for Guest and the existing protected cart API for Student.

### Course detail

The detail page presents course identity, instructor, category, price, description, syllabus, rating summary, reviews/replies, and a context-sensitive action: Add to cart, View cart, or Continue learning.

### Student account navigation

The Student menu adds Payment History and keeps My Courses. My-course cards navigate to `/my-courses/:courseId` instead of using an inert button.

### Learning detail and lesson player

The course learning page shows enrollment progress and ordered lessons with watched, quiz, locked, passed, and remaining-attempt states. Selecting a lesson opens the player. On video completion the client refreshes the server-derived state; the client never calculates authorization or unlocks locally.

### Quiz and review UI

The lesson page renders the quiz beneath the player when unlocked. It requires every answer before submission and displays the server score, feedback, remaining attempts, pass state, or rewatch requirement.

The enrolled-course detail page shows the review form if no review exists and the published review otherwise. Rating uses an accessible 1-5 star input and the comment shows validation/server errors inline.

### Payment history UI

The payment page displays successful transactions newest first with course, paid date, amount, method, reference, and transaction number. It includes loading, error, and no-history states.

## Error Handling and Security

- Missing authentication on protected routes returns `401`; the client redirects to login while preserving a safe internal return URL. Return URLs must start with one `/`, must not start with `//`, and never accept a scheme or host.
- Wrong role returns `403`.
- Missing resources return `404` without revealing another user's enrollment or attempt data.
- Enrollment or approved-course violations return `403` or `409` with actionable messages.
- All identifiers are validated as UUIDs before database work.
- Correct quiz answers are never returned before grading.
- Attempt numbering and watch-cycle changes occur inside database transactions with row locks.
- Duplicate review and duplicate attempt races are mapped to deterministic `409` responses.
- Client-provided score, pass state, watch cycle, attempt number, user ID, and course ID are ignored.

## Testing Strategy

Use Node's built-in test runner to avoid introducing a test framework dependency.

Backend tests cover:

- Public catalog behavior with and without optional authentication.
- Ownership, role, enrollment, and approved-course guards.
- Payment history status/ownership/order behavior.
- Watch-cycle state transitions and idempotency.
- Enrollment progress calculation.
- Quiz input validation, score boundaries, pass at exactly 4.0, three-failure lock, rewatch unlock, pass lock, and concurrent duplicate protection.
- Review rating/comment validation, enrollment eligibility, and duplicate handling.

Client tests cover pure routing and cart-intent decisions. Component behavior is additionally verified through build/lint and browser checks for Guest landing, login handoff, course detail, payment history, learning detail, video completion, quiz attempts, and review submission.

Final verification requires:

- Server tests pass.
- Client tests pass.
- Client lint passes.
- Client production build passes.
- Migration and Sequelize models agree on names, constraints, and associations.
- Manual browser verification at desktop and narrow viewport completes without console errors.

## Rollout and Compatibility

- No existing route is removed. `/dashboard` redirects Students to `/`.
- Existing cart, checkout, VNPay callbacks, Admin routes, and Instructor routes retain their contracts.
- The migration is additive except for the intended unique constraints. Before creating the quiz-per-lesson unique index, the migration explicitly detects duplicates and aborts with a clear message rather than deleting data.
- New pages tolerate courses that have no lessons, lessons that have no quiz, and Students with no successful payments or reviews.
