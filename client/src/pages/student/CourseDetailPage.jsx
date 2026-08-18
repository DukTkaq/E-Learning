import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Check, ShoppingCart, Star, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCourseDetail } from '../../features/catalog/catalogApi';
import { addCourseToCart } from '../../features/cart/cartApi';
import { resolveAssetUrl } from '../../utils/assets';
import { buildLoginHandoff } from '../../utils/authNavigation';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const load = useCallback(() => fetchCourseDetail(courseId).then((response) => setCourse(response.data.course)).catch((error) => toast.error(error.response?.data?.message || 'Could not load course.')).finally(() => setLoading(false)), [courseId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.addEventListener('cart:updated', load);
    return () => window.removeEventListener('cart:updated', load);
  }, [load]);

  const add = async () => {
    const token = localStorage.getItem('token');
    let user;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }
    if (!token || !user) {
      const handoff = buildLoginHandoff(courseId, `${location.pathname}${location.search}`);
      sessionStorage.setItem('pendingCartIntent', JSON.stringify(handoff.intent));
      navigate(handoff.loginPath);
      return;
    }
    if (user.role_id !== 3) return toast.error('Only Student accounts can add courses to cart.');
    setAdding(true);
    try { await addCourseToCart(courseId); window.dispatchEvent(new CustomEvent('cart:updated')); toast.success('Course added to cart.'); await load(); }
    catch (error) { toast.error(error.response?.data?.message || 'Could not add course.'); }
    finally { setAdding(false); }
  };

  if (loading) return <div className="rounded-2xl bg-white p-14 text-center text-gray-500">Loading course...</div>;
  if (!course) return <div className="rounded-2xl bg-white p-14 text-center text-gray-500">Course not found.</div>;

  const action = course.enrolled ? <Link to={`/my-courses/${course.id}`} className="inline-flex items-center gap-2 rounded-xl bg-success px-6 py-3 font-bold text-white"><Check size={18} /> Continue learning</Link>
    : course.in_cart ? <Link to="/cart" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white"><ShoppingCart size={18} /> View cart</Link>
      : <button disabled={adding} onClick={add} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-bold text-white disabled:opacity-60"><ShoppingCart size={18} /> {adding ? 'Adding...' : 'Add to cart'}</button>;

  return <section className="space-y-8">
    <div className="grid overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl lg:grid-cols-2">
      <div className="p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-wider text-secondary">{course.Category?.name || 'Course'}</p><h1 className="mt-3 text-4xl font-bold">{course.title}</h1><p className="mt-4 text-white/70">{course.description || 'Build practical skills with this course.'}</p><div className="mt-5 flex flex-wrap gap-5 text-sm text-white/75"><span className="flex items-center gap-2"><UserRound size={17} /> {course.Instructor?.name || 'Instructor'}</span><span className="flex items-center gap-2"><Star className="fill-amber-400 text-amber-400" size={17} /> {course.rating_average} ({course.rating_count})</span></div><div className="mt-8 flex items-center justify-between gap-4"><strong className="text-2xl">{money.format(Number(course.price || 0))}</strong>{action}</div></div>
      <div className="min-h-72 bg-white/5">{course.thumbnail ? <img src={resolveAssetUrl(course.thumbnail)} alt={course.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><BookOpen size={70} className="text-white/25" /></div>}</div>
    </div>
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]"><div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Course syllabus</h2><div className="mt-4 space-y-3">{course.Lessons?.length ? course.Lessons.map((lesson, index) => <div key={lesson.id} className="flex gap-3 rounded-xl bg-slate-50 p-4"><span className="font-bold text-primary">{index + 1}</span><span>{lesson.title}</span></div>) : <p className="text-gray-500">Syllabus is being prepared.</p>}</div></div>
      <div className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Student reviews</h2><div className="mt-4 space-y-4">{course.Reviews?.length ? course.Reviews.map((review) => <article key={review.id} className="rounded-xl border border-gray-100 p-4"><div className="flex justify-between"><strong>{review.User?.name || 'Student'}</strong><span className="text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div><p className="mt-2 text-gray-600">{review.comment}</p>{review.instructor_reply && <p className="mt-3 rounded-lg bg-primary/5 p-3 text-sm"><strong>Instructor:</strong> {review.instructor_reply}</p>}</article>) : <p className="text-gray-500">No reviews yet.</p>}</div></div></div>
  </section>;
}
