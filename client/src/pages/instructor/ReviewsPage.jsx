import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ReviewCard from '../../components/instructor/ReviewCard';
import { fetchReviews, replyToReview } from '../../features/instructor/instructorApi';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetchReviews();
      setReviews(response.data.reviews || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveReply = async (reviewId, reply) => {
    setSavingId(reviewId);
    try {
      await replyToReview(reviewId, reply);
      toast.success('Reply saved successfully.');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save reply.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section>
      <div className="mb-6"><h1 className="text-3xl font-bold text-slate-900">Student reviews</h1><p className="mt-2 text-gray-500">Respond only to reviews attached to your own courses.</p></div>
      {loading ? <div className="rounded-2xl bg-white p-12 text-center text-gray-500">Loading reviews...</div> : (
        <div className="grid gap-4 xl:grid-cols-2">{reviews.map((review) => <ReviewCard key={review.id} review={review} saving={savingId === review.id} onReply={saveReply} />)}{!reviews.length && <div className="col-span-full rounded-2xl border border-dashed border-primary/25 bg-white p-12 text-center text-gray-500">No student reviews yet.</div>}</div>
      )}
    </section>
  );
}
