import { CheckCircle2, LockKeyhole, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getQuizStatusLabel } from '../../utils/quizPresentation';

const lessonStatus = (lesson) => {
  if (lesson.quiz) return getQuizStatusLabel(lesson.quiz);
  return null;
};

export default function LearningLessonItem({ courseId, lesson, index }) {
  const isComplete = Boolean(lesson.completed_at && lesson.quiz?.passed);
  const content = <>
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${lesson.access_locked ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>{index + 1}</span>
      <div>
        <strong className={lesson.access_locked ? 'text-slate-500' : ''}>{lesson.title}</strong>
        {lesson.access_locked
          ? <p className="text-xs text-slate-400">Complete the previous lesson to unlock.</p>
          : lessonStatus(lesson) && <p className="text-xs text-gray-500">Quiz: {lessonStatus(lesson)}</p>}
      </div>
    </div>
    {lesson.access_locked
      ? <LockKeyhole className="text-slate-400" />
      : isComplete
        ? <CheckCircle2 className="text-success" />
        : <PlayCircle className="text-primary" />}
  </>;

  if (lesson.access_locked) {
    return <div aria-disabled="true" className="flex cursor-not-allowed items-center justify-between rounded-xl border border-gray-100 bg-slate-50 p-4">{content}</div>;
  }

  return <Link to={`/learn/courses/${courseId}/lessons/${lesson.id}`} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:border-primary/30 hover:bg-primary/5">{content}</Link>;
}
