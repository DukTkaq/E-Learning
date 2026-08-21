import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Award, Download, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import LearningLessonItem from '../../components/learning/LearningLessonItem';
import StarRating from '../../components/reviews/StarRating';
import { createCourseReview, downloadCertificate, fetchLearningCourse } from '../../features/learning/learningApi';

export default function LearningCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const load = useCallback(() => fetchLearningCourse(courseId).then((response) => setCourse(response.data.course)).catch((error) => toast.error(error.response?.data?.message || 'Could not open this course.')).finally(() => setLoading(false)), [courseId]);
  useEffect(() => { load(); }, [load]);
  const submitReview = async (event) => { event.preventDefault(); try { await createCourseReview(courseId, review); toast.success('Review published.'); await load(); } catch (error) { toast.error(error.response?.data?.message || 'Could not publish review.'); } };
  const saveCertificate = async () => {
    setDownloading(true);
    try {
      const response = await downloadCertificate(course.certificate.id);
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${course.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not download certificate.');
    } finally {
      setDownloading(false);
    }
  };
  if (loading) return <div className="rounded-2xl bg-white p-14 text-center">Loading course...</div>;
  if (!course) return null;
  return <section className="space-y-8"><div className="rounded-3xl bg-gradient-to-r from-slate-900 to-primary p-8 text-white"><h1 className="text-3xl font-bold">{course.title}</h1><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full bg-secondary" style={{ width: `${course.enrollment.progress || 0}%` }} /></div><p className="mt-2 text-sm text-white/70">Overall progress: {course.enrollment.progress || 0}%</p></div>
    {course.certificate && <div className="flex flex-col gap-4 rounded-2xl border border-secondary/20 bg-gradient-to-r from-primary/10 to-secondary/10 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="rounded-2xl bg-gradient-to-r from-primary to-secondary p-3 text-white"><Award size={30} /></span><div><h2 className="text-xl font-bold text-slate-900">Course completed</h2><p className="text-sm text-slate-600">Your PDF certificate is ready.</p></div></div><button type="button" disabled={downloading} onClick={saveCertificate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-3 font-bold text-white disabled:opacity-60"><Download size={18} /> {downloading ? 'Preparing...' : 'Download certificate'}</button></div>}
    <div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Lessons</h2><div className="mt-4 space-y-3">{course.lessons.length ? course.lessons.map((lesson, index) => <LearningLessonItem key={lesson.id} courseId={course.id} lesson={lesson} index={index} />) : <p className="text-gray-500">No lessons are available yet.</p>}</div></div>
    <div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Your review</h2>{course.review ? <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-amber-500">{'★'.repeat(course.review.rating)}{'☆'.repeat(5 - course.review.rating)}</p><p className="mt-2">{course.review.comment}</p></div> : <form onSubmit={submitReview} className="mt-4 space-y-4"><StarRating value={review.rating} onChange={(rating) => setReview({ ...review, rating })} /><label className="block"><span className="text-sm font-semibold">Comment</span><textarea required maxLength={2000} value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} className="mt-1 min-h-28 w-full rounded-xl border border-gray-200 p-3" /></label><button className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white"><Star size={18} /> Publish review</button></form>}</div>
  </section>;
}
