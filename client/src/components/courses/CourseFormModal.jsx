import { useEffect, useState } from 'react';
import { ImagePlus, LoaderCircle, Upload, X } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';

const EMPTY_FORM = { title: '', description: '', price: '', category_id: '' };
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function CourseFormModal({ course, categories, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    setForm(course ? {
      title: course.title || '',
      description: course.description || '',
      price: course.price || '',
      category_id: course.category_id || '',
    } : EMPTY_FORM);
    setThumbnailFile(null);
    setPreviewUrl(resolveAssetUrl(course?.thumbnail));
    setFileError('');
  }, [course]);

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const selectThumbnail = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setFileError('Please choose a JPEG, PNG or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setFileError('Thumbnail must not exceed 5 MB.');
      event.target.value = '';
      return;
    }

    setFileError('');
    setThumbnailFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{course ? 'Edit course' : 'Create course'}</h2>
            <p className="mt-0.5 text-sm text-gray-500">Submitted courses start in Pending status.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={20} /></button>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); onSubmit({ ...form, thumbnailFile }); }} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_190px]">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Title <span className="text-error">*</span>
              <input name="title" value={form.title} onChange={updateField} minLength={3} maxLength={200} required className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="e.g. Modern React Fundamentals" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Category <span className="text-error">*</span>
                <select name="category_id" value={form.category_id} onChange={updateField} required className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Price (VND) <span className="text-error">*</span>
                <input name="price" value={form.price} onChange={updateField} type="number" min="0" max="99999999.99" step="0.01" required className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="0" />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Description
              <textarea name="description" value={form.description} onChange={updateField} rows={4} maxLength={5000} className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="What will students learn?" />
              <span className="mt-0.5 block text-right text-xs font-normal text-gray-400">{form.description.length}/5000</span>
            </label>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700">Thumbnail</p>
            <label htmlFor="course-thumbnail" className="mt-1.5 block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 transition hover:border-primary/50">
              {previewUrl ? (
                <div className="group relative aspect-video w-full overflow-hidden">
                  <img src={previewUrl} alt="Course thumbnail preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 opacity-0 transition group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary"><Upload size={14} /> Replace</span>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center p-3 text-center">
                  <ImagePlus className="mb-1.5 text-primary" size={22} />
                  <p className="text-sm font-semibold text-slate-700">Upload image</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">JPG, PNG, WebP · 5 MB</p>
                </div>
              )}
              <input id="course-thumbnail" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectThumbnail} className="sr-only" />
            </label>
            {fileError && <p className="mt-1.5 text-xs font-medium text-error">{fileError}</p>}
            {thumbnailFile && <p className="mt-1.5 truncate text-xs text-gray-500">{thumbnailFile.name}</p>}
            <p className="mt-3 rounded-lg bg-secondary/10 p-2.5 text-xs leading-5 text-slate-600">Recommended ratio <strong>16:9</strong>. The image appears on course cards.</p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 md:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 font-semibold text-gray-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting && <LoaderCircle className="animate-spin" size={18} />}
              {course ? 'Save changes' : 'Submit course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
