import React, { useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import useAxios from '../../Hooks/useAxios';
import useAuth from '../../Hooks/useAuth';
import { showToast } from '../../Utilities/ToastMessage';

const RateUserModal = ({ isOpen, onClose, application, counterpartyLabel = 'User', onSuccess }) => {
    const { user } = useAuth();
    const axios = useAxios();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [canRate, setCanRate] = useState(false);
    const [score, setScore] = useState(5);
    const [review, setReview] = useState('');

    useEffect(() => {
        const fetchCanRate = async () => {
            if (!isOpen || !application?._id || !user) return;
            try {
                setLoading(true);
                const token = await user.getIdToken();
                const res = await axios.get(`/ratings/can-rate/${application._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setCanRate(Boolean(res.data?.canRate));
                if (res.data?.existingRating) {
                    setScore(Number(res.data.existingRating.score) || 5);
                    setReview(res.data.existingRating.review || '');
                } else {
                    setScore(5);
                    setReview('');
                }
            } catch (error) {
                setCanRate(false);
                showToast(error.response?.data?.message || 'Failed to load rating status', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchCanRate();
    }, [isOpen, application?._id, user, axios]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!application?._id || !user) return;

        try {
            setSubmitting(true);
            const token = await user.getIdToken();
            await axios.post('/ratings', {
                applicationId: application._id,
                score: Number(score),
                review: review.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast('Rating submitted successfully', 'success');
            onSuccess?.();
            onClose();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to submit rating', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-11/12 max-w-md shadow-2xl">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Rate {counterpartyLabel}</h3>
                    <p className="text-xs text-gray-500 mt-1">Your feedback helps build trust in the marketplace.</p>
                </div>

                <div className="p-5">
                    {loading ? (
                        <div className="py-10 flex flex-col items-center">
                            <Loader2 className="animate-spin text-orange-500 mb-3" size={24} />
                            <p className="text-sm text-gray-500">Checking rating eligibility...</p>
                        </div>
                    ) : !canRate ? (
                        <div className="py-8 text-center">
                            <p className="text-sm text-red-500 font-semibold">Rating is available only after deal is completed or cancelled.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Score</label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setScore(n)}
                                            className={`p-2 rounded-md border transition-all ${score >= n ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-gray-200 text-gray-300 hover:text-amber-400'}`}
                                        >
                                            <Star size={18} fill={score >= n ? 'currentColor' : 'none'} />
                                        </button>
                                    ))}
                                    <span className="text-sm font-semibold text-gray-600 ml-1">{score}/5</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Review (optional)</label>
                                <textarea
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    placeholder="Share your experience..."
                                    className="w-full border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-md text-sm font-semibold hover:bg-gray-50"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 flex items-center gap-2"
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />}
                                    Save Rating
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RateUserModal;
