import { useEffect, useState } from 'react';
import { Film, LoaderCircle, X } from 'lucide-react';
import { resolveAssetUrl } from '../../utils/assets';

const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm']);
const ALLOWED_EXTENSIONS = /\.(mp4|mov|avi|mkv|webm)$/i;

export default function LessonFormModal({ lesson, submitting, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [isFinal, setIsFinal] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    setTitle(lesson?.title || '');
    setIsFinal(lesson?.is_final || false);
    setCanSkip(lesson?.can_skip || false);
    setVideoFile(null);
    setVideoPreview(lesson?.video_url ? resolveAssetUrl(lesson.video_url) : '');
    setFileError('');
  }, [lesson]);

  useEffect(() => () => {
    if (videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
  }, [videoPreview]);

  const selectVideo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.test(file.name)) {
      setFileError('Please choose a video file (MP4, MOV, AVI, MKV, WebM).');
      event.target.value = '';
      return;
    }

    setFileError('');
    setVideoFile(file);
    if (videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('is_final', isFinal);
    formData.append('can_skip', canSkip);
    if (videoFile) formData.append('video', videoFile);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{lesson ? 'Edit lesson' : 'Create lesson'}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{lesson ? 'Update lesson details.' : 'Add a new lesson to this course.'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block text-sm font-semibold text-slate-700">
            Title <span className="text-error">*</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} minLength={1} maxLength={200} required className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" placeholder="e.g. Introduction to React" />
          </label>

          <div className="block text-sm font-semibold text-slate-700">
            Video file <span className="text-error">*</span>
            <label htmlFor="lesson-video" className="mt-1.5 block cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 transition hover:border-primary/50">
              {videoPreview ? (
                <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                  <video src={videoPreview} className="h-full w-full object-contain" controls preload="metadata" />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 transition hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary">Replace video</span>
                  </div>
                </div>
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center p-6 text-center">
                  <Film className="mb-2 text-primary" size={28} />
                  <p className="text-sm font-semibold text-slate-700">Upload video</p>
                  <p className="mt-1 text-xs text-gray-500">MP4, MOV, AVI, MKV, WebM · Max 2 GB</p>
                </div>
              )}
              <input id="lesson-video" type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm" onChange={selectVideo} className="sr-only" />
            </label>
            {fileError && <p className="mt-1.5 text-xs font-medium text-error">{fileError}</p>}
            {videoFile && <p className="mt-1.5 truncate text-xs text-gray-500">{videoFile.name}</p>}
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
            <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <div>
              <span className="text-sm font-semibold text-slate-700">Mark as final lesson</span>
              <p className="text-xs text-gray-500">The final lesson is always placed at the end of the list.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition">
            <input type="checkbox" checked={canSkip} onChange={(e) => setCanSkip(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <div>
              <span className="text-sm font-semibold text-slate-700">Allow skipping this video</span>
              <p className="text-xs text-gray-500">Students can skip forward without watching from the start.</p>
            </div>
          </label>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 font-semibold text-gray-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting && <LoaderCircle className="animate-spin" size={18} />}
              {lesson ? 'Save changes' : 'Create lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
