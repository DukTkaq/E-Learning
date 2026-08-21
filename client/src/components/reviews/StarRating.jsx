import { Star } from 'lucide-react';

const RATINGS = [1, 2, 3, 4, 5];

export default function StarRating({ value, onChange }) {
  return <fieldset>
    <legend className="text-sm font-semibold">Rating</legend>
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {RATINGS.map((rating) => {
        const active = rating <= value;
        return <label
          key={rating}
          data-active={active}
          className="cursor-pointer rounded-lg p-1 transition hover:scale-110 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
          title={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
        >
          <input
            type="radio"
            name="rating"
            value={rating}
            aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
            checked={value === rating}
            onChange={() => onChange(rating)}
            className="sr-only"
          />
          <Star
            aria-hidden="true"
            size={34}
            strokeWidth={2}
            className={active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}
          />
        </label>;
      })}
      <span className="ml-2 text-sm font-semibold text-slate-500">{value} of 5</span>
    </div>
  </fieldset>;
}
