import { useEffect, useState } from 'react';
import { CheckCircle, LoaderCircle, X } from 'lucide-react';

const OPTIONS = ['A', 'B', 'C', 'D'];

export default function QuestionFormModal({ question, submitting, onClose, onSubmit }) {
  const [content, setContent] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');

  useEffect(() => {
    setContent(question?.content || '');
    setOptionA(question?.option_a || '');
    setOptionB(question?.option_b || '');
    setOptionC(question?.option_c || '');
    setOptionD(question?.option_d || '');
    setCorrectAnswer(question?.correct_answer || 'A');
  }, [question]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      content: content.trim(),
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim(),
      option_d: optionD.trim(),
      correct_answer: correctAnswer,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{question ? 'Edit question' : 'Add question'}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{question ? 'Update the question details.' : 'Create a new multiple-choice question.'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <label className="block text-sm font-semibold text-slate-700">
            Question <span className="text-error">*</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={3}
              maxLength={2000}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
              placeholder="e.g. What is the capital of France?"
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Options <span className="text-error">*</span></p>
            {[
              { label: 'A', value: optionA, setter: setOptionA },
              { label: 'B', value: optionB, setter: setOptionB },
              { label: 'C', value: optionC, setter: setOptionC },
              { label: 'D', value: optionD, setter: setOptionD },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">{label}</span>
                <input
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  required
                  maxLength={500}
                  className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder={`Option ${label}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Correct answer <span className="text-error">*</span></p>
            <div className="flex gap-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCorrectAnswer(opt)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-bold transition ${
                    correctAnswer === opt
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {correctAnswer === opt ? <CheckCircle size={18} /> : opt}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Click to select the correct answer. Currently: <span className="font-semibold text-green-600">{correctAnswer}</span></p>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 font-semibold text-gray-600 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting && <LoaderCircle className="animate-spin" size={18} />}
              {question ? 'Save changes' : 'Add question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
