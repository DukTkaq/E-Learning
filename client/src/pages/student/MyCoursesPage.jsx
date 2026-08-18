import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMyCourses } from '../../features/catalog/catalogApi';
import EnrolledCourseCard from '../../components/enrollments/EnrolledCourseCard';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses().then((response) => setCourses(response.data.courses || [])).catch((error) => {
      toast.error(error.response?.data?.message || 'Could not load your courses.');
    }).finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="mb-7"><p className="text-sm font-bold uppercase tracking-wider text-primary">Learning space</p><h1 className="mt-1 text-3xl font-bold text-slate-900">My courses</h1><p className="mt-2 text-gray-500">Continue the courses you have purchased.</p></div>
      {loading ? (
        <div className="rounded-2xl bg-white p-14 text-center text-gray-500">Loading your courses...</div>
      ) : courses.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((item) => <EnrolledCourseCard key={item.enrollment_id} enrollment={item} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-primary/25 bg-white p-14 text-center">
          <BookOpen className="mx-auto text-primary" size={38} />
          <h2 className="mt-4 text-xl font-bold text-slate-800">You have not enrolled in a course yet</h2>
          <p className="mt-1 text-gray-500">Purchase a course from the catalog to see it here.</p>
        </div>
      )}
    </section>
  );
}
