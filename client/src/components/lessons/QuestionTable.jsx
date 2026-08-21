import { Edit3, Trash2 } from 'lucide-react';

const answerCellClass = (question, answer) => question.correct_answer === answer
  ? 'bg-green-50 font-bold text-green-600'
  : 'text-gray-600';

export default function QuestionTable({ questions, loading, readOnly, startIndex, hasFilters, onEdit, onDelete }) {
  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-500">Loading questions...</div>;
  }

  if (!questions.length) {
    return (
      <div className="p-12 text-center">
        <p className="font-semibold text-slate-800">{hasFilters ? 'No matching questions' : 'No questions yet'}</p>
        <p className="mt-1 text-sm text-gray-500">{hasFilters ? 'Try another keyword or correct-answer filter.' : 'Add the first question to complete this quiz.'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left">
        <thead className="border-b border-gray-100 bg-slate-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="w-10 px-5 py-3 font-semibold">#</th>
            <th className="px-5 py-3 font-semibold">Question</th>
            <th className="px-5 py-3 font-semibold">A</th>
            <th className="px-5 py-3 font-semibold">B</th>
            <th className="px-5 py-3 font-semibold">C</th>
            <th className="px-5 py-3 font-semibold">D</th>
            <th className="px-5 py-3 font-semibold">Answer</th>
            <th className="px-5 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {questions.map((question, index) => (
            <tr key={question.id} className="transition-colors hover:bg-slate-50/70">
              <td className="px-5 py-4 text-sm font-medium text-gray-500">{startIndex + index + 1}</td>
              <td className="max-w-[260px] px-5 py-4 text-sm font-medium text-slate-800"><p className="line-clamp-2">{question.content}</p></td>
              {['A', 'B', 'C', 'D'].map((answer) => (
                <td key={answer} className={`max-w-[200px] px-5 py-4 text-sm ${answerCellClass(question, answer)}`}>
                  <p className="line-clamp-2">{question[`option_${answer.toLowerCase()}`]}</p>
                </td>
              ))}
              <td className="px-5 py-4"><span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-xs font-bold text-green-700">{question.correct_answer}</span></td>
              <td className="px-5 py-4">
                {readOnly ? (
                  <span className="block text-right text-xs font-semibold text-gray-400">Read only</span>
                ) : (
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => onEdit(question)} className="rounded-lg p-2 text-gray-400 hover:bg-primary/10 hover:text-primary" title="Edit question"><Edit3 size={16} /></button>
                    <button type="button" onClick={() => onDelete(question)} className="rounded-lg p-2 text-gray-400 hover:bg-error/10 hover:text-error" title="Delete question"><Trash2 size={16} /></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
