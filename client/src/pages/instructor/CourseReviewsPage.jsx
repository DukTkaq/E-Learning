import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Pagination from "../../components/common/Pagination";
import CourseReviewFilters from "../../components/instructor/CourseReviewFilters";
import CourseReviewSummary from "../../components/instructor/CourseReviewSummary";
import ReviewCard from "../../components/instructor/ReviewCard";
import {
  fetchCourseReviews,
  replyToReview,
} from "../../features/instructor/instructorApi";
import { clampPage } from "../../utils/pagination";

const PAGE_LIMIT = 4;
const EMPTY_PAGINATION = {
  page: 1,
  limit: PAGE_LIMIT,
  total_items: 0,
  total_pages: 0,
};
const EMPTY_SUMMARY = {
  total: 0,
  awaiting_reply: 0,
  replied: 0,
  average_rating: 0,
};

function parsePage(value) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default function CourseReviewsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const listRef = useRef(null);

  const searchFilter = searchParams.get("search") || "";
  const replyFilter = searchParams.get("reply_status") || "";
  const ratingFilter = searchParams.get("rating") || "";
  const sortFilter = searchParams.get("sort") || "newest";
  const currentPage = parsePage(searchParams.get("page"));

  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [searchInput, setSearchInput] = useState(searchFilter);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadReviews = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) setLoading(true);
      try {
        const response = await fetchCourseReviews(courseId, {
          search: searchFilter || undefined,
          reply_status: replyFilter || undefined,
          rating: ratingFilter || undefined,
          sort: sortFilter,
          page: currentPage,
          limit: PAGE_LIMIT,
        });
        setCourse(response.data.course || null);
        setReviews(response.data.reviews || []);
        setSummary(response.data.summary || EMPTY_SUMMARY);
        setPagination(response.data.pagination || EMPTY_PAGINATION);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Could not load course reviews.",
        );
        setReviews([]);
        setSummary(EMPTY_SUMMARY);
        setPagination(EMPTY_PAGINATION);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [
      courseId,
      currentPage,
      ratingFilter,
      replyFilter,
      searchFilter,
      sortFilter,
    ],
  );

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setSearchInput(searchFilter);
  }, [searchFilter]);

  const validPage = clampPage(currentPage, pagination.total_pages);
  const correctingOutOfRangePage = !loading && currentPage !== validPage;

  useEffect(() => {
    if (!correctingOutOfRangePage) return;

    const nextParams = new URLSearchParams(searchParams);
    if (validPage === 1) nextParams.delete("page");
    else nextParams.set("page", String(validPage));
    setSearchParams(nextParams, { replace: true });
  }, [correctingOutOfRangePage, searchParams, setSearchParams, validPage]);

  const updateFilter = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value && !(key === "sort" && value === "newest"))
      nextParams.set(key, value);
    else nextParams.delete(key);
    nextParams.delete("page");
    setSearchParams(nextParams);
  };

  const applySearch = (event) => {
    event.preventDefault();
    updateFilter("search", searchInput.trim());
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  const changePage = (page) => {
    if (page < 1 || page > pagination.total_pages || page === currentPage)
      return;

    const nextParams = new URLSearchParams(searchParams);
    if (page === 1) nextParams.delete("page");
    else nextParams.set("page", String(page));
    setSearchParams(nextParams);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveReply = async (reviewId, reply) => {
    setSavingId(reviewId);
    try {
      const response = await replyToReview(reviewId, reply);
      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review.id === reviewId
            ? { ...review, ...response.data.review }
            : review,
        ),
      );
      toast.success("Reply saved successfully.");
      await loadReviews({ showLoading: false });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save reply.");
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const hasAppliedFilters = Boolean(
    searchFilter || replyFilter || ratingFilter || sortFilter !== "newest",
  );

  return (
    <section>
      <button
        type="button"
        onClick={() => navigate("/instructor/courses")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary"
      >
        <ArrowLeft size={17} /> Back to courses
      </button>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Course reviews</h1>
          <p className="mt-2 text-gray-500">
            {course
              ? `Student feedback for ${course.title}.`
              : "View student feedback and reply to it."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadReviews()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-semibold text-gray-600 shadow-sm hover:border-primary/30 hover:text-primary disabled:opacity-60"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      <CourseReviewSummary summary={summary} />

      <div ref={listRef} className="scroll-mt-24">
        <CourseReviewFilters
          search={searchInput}
          replyStatus={replyFilter}
          rating={ratingFilter}
          sort={sortFilter}
          disabled={loading}
          onSearchChange={setSearchInput}
          onSearch={applySearch}
          onReplyStatusChange={(value) => updateFilter("reply_status", value)}
          onRatingChange={(value) => updateFilter("rating", value)}
          onSortChange={(value) => updateFilter("sort", value)}
          onClear={clearFilters}
        />

        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
          <p>
            {loading
              ? "Loading reviews..."
              : `${pagination.total_items} review${pagination.total_items === 1 ? "" : "s"} found`}
          </p>
          {hasAppliedFilters && !loading && <p>Filters are applied</p>}
        </div>

        {loading || correctingOutOfRangePage ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-gray-500 shadow-sm">
            Loading reviews...
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                courseTitle={course?.title}
                saving={savingId === review.id}
                onReply={saveReply}
              />
            ))}
            {!reviews.length && (
              <div className="col-span-full rounded-2xl border border-dashed border-primary/25 bg-white p-12 text-center text-gray-500">
                {hasAppliedFilters
                  ? "No reviews match the current filters."
                  : "This course has no student reviews yet."}
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <Pagination
            page={pagination.page}
            totalPages={pagination.total_pages}
            onPageChange={changePage}
            disabled={loading}
            ariaLabel="Course review pagination"
          />
        </div>
      </div>
    </section>
  );
}
