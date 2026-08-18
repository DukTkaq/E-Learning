import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CourseCard from '../../components/catalog/CourseCard';
import { addCourseToCart } from '../../features/cart/cartApi';
import { fetchCatalog, fetchCatalogCategories } from '../../features/catalog/catalogApi';
import { buildLoginHandoff } from '../../utils/authNavigation';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const categoryId = searchParams.get('category_id') || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseResponse, categoryResponse] = await Promise.all([
        fetchCatalog({ search: searchParams.get('search') || undefined, category_id: categoryId || undefined }),
        fetchCatalogCategories(),
      ]);
      setCourses(courseResponse.data.courses || []);
      setCategories(categoryResponse.data.categories || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load the course catalog.');
    } finally {
      setLoading(false);
    }
  }, [categoryId, searchParams]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSearch(searchParams.get('search') || ''); }, [searchParams]);

  const applySearch = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (search.trim()) next.set('search', search.trim()); else next.delete('search');
    setSearchParams(next);
  };

  const filterCategory = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category_id', value); else next.delete('category_id');
    setSearchParams(next);
  };

  const addToCart = async (courseId) => {
    const token = localStorage.getItem('token');
    let user;
    try { user = JSON.parse(localStorage.getItem('user')); } catch { user = null; }
    if (!token || !user) {
      const handoff = buildLoginHandoff(courseId, `${location.pathname}${location.search}`);
      sessionStorage.setItem('pendingCartIntent', JSON.stringify(handoff.intent));
      navigate(handoff.loginPath);
      return;
    }
    if (user.role_id !== 3) {
      toast.error('Only Student accounts can add courses to cart.');
      return;
    }
    setAddingId(courseId);
    try {
      await addCourseToCart(courseId);
      setCourses((current) => current.map((course) => course.id === courseId ? { ...course, in_cart: true } : course));
      window.dispatchEvent(new CustomEvent('cart:updated'));
      toast.success('Course added to cart.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add this course to your cart.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary to-secondary p-7 text-white shadow-xl sm:p-10">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider"><Sparkles size={14} /> Learn something new</div>
          <h1 className="text-3xl font-bold sm:text-4xl">Find the right course for your next skill</h1>
          <p className="mt-3 max-w-2xl text-white/75">Browse courses approved by the E-Learning team and add them straight to your cart.</p>
          <form onSubmit={applySearch} className="mt-6 flex max-w-xl overflow-hidden rounded-xl bg-white p-1.5 shadow-lg">
            <Search className="ml-3 self-center text-gray-400" size={19} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 px-3 py-2 text-slate-800 outline-none" placeholder="Search courses..." />
            <button className="rounded-lg bg-primary px-5 py-2 font-semibold text-white" type="submit">Search</button>
          </form>
        </div>
      </div>

      <div className="my-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-sm font-bold uppercase tracking-wider text-primary">Course catalog</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Explore approved courses</h2></div>
        <select value={categoryId} onChange={(event) => filterCategory(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-primary">
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>

      {loading ? <div className="rounded-2xl bg-white p-14 text-center text-gray-500">Loading approved courses...</div> : courses.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <CourseCard key={course.id} course={course} adding={addingId === course.id} onAddToCart={addToCart} />)}</div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center"><BookOpen className="mx-auto text-primary" size={38} /><h3 className="mt-4 text-xl font-bold text-slate-800">No approved courses found</h3><p className="mt-1 text-gray-500">Try another keyword or category.</p></div>
      )}
    </section>
  );
}
