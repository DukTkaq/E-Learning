import { CalendarDays, FolderTree, Image, WalletCards } from 'lucide-react';
import CourseStatusBadge from './CourseStatusBadge';
import { resolveAssetUrl } from '../../utils/assets';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

function DetailItem({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Icon size={15} /> {label}
      </div>
      <div className="font-semibold text-slate-800">{children}</div>
    </div>
  );
}

export default function CourseDetailOverview({ course }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <CourseStatusBadge status={course.status} />
            <span className="text-sm text-slate-400">Course ID: {course.id}</span>
          </div>

          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{course.title}</h1>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <DetailItem icon={FolderTree} label="Category">{course.Category?.name || 'Uncategorized'}</DetailItem>
            <DetailItem icon={WalletCards} label="Price">{currency.format(Number(course.price || 0))}</DetailItem>
            <DetailItem icon={CalendarDays} label="Created">{formatDateTime(course.created_at)}</DetailItem>
            <DetailItem icon={CalendarDays} label="Last updated">{formatDateTime(course.updated_at)}</DetailItem>
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Course description</h2>
            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
              {course.description || 'No description has been added for this course.'}
            </p>
          </section>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0 sm:p-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Course thumbnail</p>
          <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {course.thumbnail ? (
              <img src={resolveAssetUrl(course.thumbnail)} alt={`${course.title} thumbnail`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                <Image size={36} />
                <span className="text-sm font-medium">No thumbnail uploaded</span>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            This is the image students see on course cards and discovery pages.
          </p>
        </div>
      </div>
    </article>
  );
}
