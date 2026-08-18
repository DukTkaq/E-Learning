import { BookOpen, Check, Image, ShoppingCart, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveAssetUrl } from '../../utils/assets';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export default function CourseCard({ course, adding, onAddToCart }) {
  const action = course.enrolled ? (
    <Link to="/my-courses" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success/10 px-4 py-2.5 font-semibold text-success">
      <Check size={17} /> Enrolled
    </Link>
  ) : course.in_cart ? (
    <Link to="/cart" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 font-semibold text-primary">
      <ShoppingCart size={17} /> View cart
    </Link>
  ) : (
    <button type="button" disabled={adding} onClick={() => onAddToCart(course.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
      <ShoppingCart size={17} /> {adding ? 'Adding...' : 'Add to cart'}
    </button>
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/courses/${course.id}`} className="relative block aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
        {course.thumbnail ? <img src={resolveAssetUrl(course.thumbnail)} alt={course.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-primary"><Image size={36} /></div>}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">{course.Category?.name || 'Course'}</span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to={`/courses/${course.id}`}><h2 className="line-clamp-2 text-lg font-bold text-slate-900 hover:text-primary">{course.title}</h2></Link>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">{course.description || 'Start learning with this course.'}</p>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500"><UserRound size={15} /><span className="truncate">{course.Instructor?.name || 'Instructor'}</span></div>
        <div className="my-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400"><BookOpen size={14} /> Online</span>
          <span className="text-lg font-bold text-primary">{currency.format(Number(course.price || 0))}</span>
        </div>
        {action}
      </div>
    </article>
  );
}
