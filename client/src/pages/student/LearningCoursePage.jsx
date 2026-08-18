import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole, PlayCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCourseReview, fetchLearningCourse } from '../../features/learning/learningApi';

export default function LearningCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const load = useCallback(() => fetchLearningCourse(courseId).then((response) => setCourse(response.data.course)).catch((error) => toast.error(error.response?.data?.message || 'Could not open this course.')).finally(() => setLoading(false)), [courseId]);
  useEffect(() => { load(); }, [load]);
  const submitReview = async (event) => { event.preventDefault(); try { await createCourseReview(courseId, review); toast.success('Review published.'); await load(); } catch (error) { toast.error(error.response?.data?.message || 'Could not publish review.'); } };
  if (loading) return <div className="rounded-2xl bg-white p-14 text-center">Loading course...</div>;
  if (!course) return null;
  return <section className="space-y-8"><div className="rounded-3xl bg-gradient-to-r from-slate-900 to-primary p-8 text-white"><p className="text-sm font-bold uppercase tracking-wider text-secondary">UC-18.2 Learning detail</p><h1 className="mt-2 text-3xl font-bold">{course.title}</h1><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-secondary" style={{ width: `${course.enrollment.progress || 0}%` }} /></div><p className="mt-2 text-sm text-white/70">Overall progress: {course.enrollment.progress || 0}%</p></div>
    <div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Lessons</h2><div className="mt-4 space-y-3">{course.lessons.length ? course.lessons.map((lesson, index) => <Link key={lesson.id} to={`/learn/courses/${course.id}/lessons/${lesson.id}`} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:border-primary/30 hover:bg-primary/5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{index + 1}</span><div><strong>{lesson.title}</strong>{lesson.quiz && <p className="text-xs text-gray-500">Quiz: {lesson.quiz.passed ? 'Passed' : lesson.quiz.lock_reason === 'REWATCH_REQUIRED' ? 'Rewatch required' : `${lesson.quiz.remaining_attempts} attempts remaining`}</p>}</div></div>{lesson.completed_at ? <CheckCircle2 className="text-success" /> : lesson.quiz?.locked ? <LockKeyhole className="text-gray-400" /> : <PlayCircle className="text-primary" />}</Link>) : <p className="text-gray-500">No lessons are available yet.</p>}</div></div>
    <div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Your review</h2>{course.review ? <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-amber-500">{'★'.repeat(course.review.rating)}{'☆'.repeat(5 - course.review.rating)}</p><p className="mt-2">{course.review.comment}</p></div> : <form onSubmit={submitReview} className="mt-4 space-y-4"><label className="block"><span className="text-sm font-semibold">Rating</span><select value={review.rating} onChange={(event) => setReview({ ...review, rating: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-gray-200 p-3">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label><label className="block"><span className="text-sm font-semibold">Comment</span><textarea required maxLength={2000} value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} className="mt-1 min-h-28 w-full rounded-xl border border-gray-200 p-3" /></label><button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white"><Star size={18} /> Publish review</button></form>}</div>
  </section>;
}
