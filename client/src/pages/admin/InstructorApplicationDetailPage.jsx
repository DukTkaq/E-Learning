import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Shield, Eye, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { fetchInstructorRequestById, approveInstructor, rejectInstructor } from '../../features/admin/adminApi';
import { resolveAssetUrl } from '../../utils/assets';
import Pagination from '../../components/common/Pagination';

export default function InstructorApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        const res = await fetchInstructorRequestById(id);
        setRequest(res.data);
      } catch (error) {
        toast.error('Failed to load application details.');
        navigate('/admin/instructor-approvals');
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [id, navigate]);

  const handleReview = async (action) => {
    if (!window.confirm(`Are you sure you want to ${action} this application?`)) return;
    
    setReviewing(true);
    try {
      if (action === 'approve') {
        await approveInstructor(id);
        toast.success('Instructor approved successfully!');
      } else {
        await rejectInstructor(id);
        toast.success('Instructor request rejected.');
      }
      // Redirect back after action
      navigate('/admin/instructor-approvals');
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} instructor.`);
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading details...</div>;
  }

  if (!request) {
    return <div className="p-8 text-center text-red-500">Application not found.</div>;
  }

  const certificates = request.InstructorCertificates || [];
  const totalPages = Math.ceil(certificates.length / ITEMS_PER_PAGE);
  const currentCerts = certificates.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/admin/instructor-approvals')}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          title="Back to List"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Application Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">Reviewing application for {request.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
            <div className="text-center pb-4 border-b border-gray-100">
              <img src={resolveAssetUrl(request.avatar_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=random`} alt="avatar" className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-white shadow-md mb-3" />
              <h2 className="text-lg font-bold text-gray-800">{request.name}</h2>
              <p className="text-sm text-gray-500">{request.email}</p>
              <div className="mt-3 inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full uppercase tracking-wider">
                {request.status}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Expertise</p>
              <p className="text-gray-700 font-medium">{request.expertise}</p>
            </div>
            
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Bio & Experience</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {request.bio ? request.bio.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                  part.match(/https?:\/\/[^\s]+/) ? (
                    <a key={i} href={part} target="_blank" rel="noreferrer" className="text-primary hover:underline">{part}</a>
                  ) : part
                ) : 'Not provided'}
              </div>
            </div>
            
            {request.status === 'Pending' && (
              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleReview('reject')} 
                  disabled={reviewing}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  <XCircle size={18} /> Reject
                </button>
                <button 
                  onClick={() => handleReview('approve')} 
                  disabled={reviewing}
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white hover:bg-green-600 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={18} /> Approve
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Certificates */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">Uploaded Certificates ({certificates.length})</h3>
            </div>
            
            {certificates.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {currentCerts.map((cert, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                      <div className="mb-4">
                        <p className="font-semibold text-gray-800 text-sm line-clamp-2">{cert.name || 'Untitled Certificate'}</p>
                        <p className="text-xs text-gray-500 mt-2">Issuer: <span className="font-medium text-gray-700 line-clamp-1">{cert.issuer || 'N/A'}</span></p>
                        {cert.issued_date && <p className="text-xs text-gray-500 mt-1">Issued: <span className="font-medium text-gray-700">{new Date(cert.issued_date).toLocaleDateString()}</span></p>}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setPreviewImage(resolveAssetUrl(cert.url))} 
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Eye size={16} /> View Image
                      </button>
                    </div>
                  ))}
                </div>
                
                {/* Pagination Control */}
                {totalPages > 1 && (
                  <div className="mt-auto pt-4 flex justify-center border-t border-gray-100">
                    <Pagination 
                      page={page} 
                      totalPages={totalPages} 
                      onPageChange={setPage} 
                    />
                  </div>
                )}
              </div>
            ) : request.portfolio_url ? (
               <div className="flex-1 flex flex-col items-center justify-center">
                 <p className="text-gray-500 mb-4 text-center">User used the legacy URL field instead of uploading individual certificates.</p>
                 {request.portfolio_url.match(/\.(jpeg|jpg|gif|png)$/i) || request.portfolio_url.startsWith('/uploads/') ? (
                    <img src={resolveAssetUrl(request.portfolio_url)} alt="Certificate" className="max-w-full max-h-96 rounded-xl object-contain cursor-pointer border shadow-sm" onClick={() => setPreviewImage(resolveAssetUrl(request.portfolio_url))} />
                  ) : (
                    <a href={request.portfolio_url} target="_blank" rel="noreferrer" className="inline-block rounded-xl border border-primary/20 bg-primary/5 px-6 py-3 font-semibold text-primary hover:underline hover:bg-primary/10 transition-colors">
                      {request.portfolio_url}
                    </a>
                  )}
               </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 italic">No certificates provided.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-end p-2 shrink-0">
              <button onClick={() => setPreviewImage(null)} className="p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex items-center justify-center p-2">
              <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
