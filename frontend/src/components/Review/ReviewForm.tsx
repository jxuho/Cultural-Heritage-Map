import { useCallback, useState, useEffect, ChangeEvent, FormEvent } from 'react';
import StarIcon from '../StarIcon';
import { Review } from '../../types/review'; // 프로젝트 경로에 맞게 조정하세요
import { User } from '../../types/user'; // 프로젝트 경로에 맞게 조정하세요

interface ReviewFormProps {
  placeId: string;
  userReview: Review | null;
  onReviewActionCompleted: (
    actionType: "create" | "update" | "delete",
    newRating: number | null,
    oldRating: number | null,
    comment?: string
  ) => Promise<void>;
  currentUser: User | null;
  isSubmitting: boolean;
  submitError: string | null;
}

const ReviewForm = ({
  placeId,
  userReview,
  onReviewActionCompleted,
  currentUser,
  isSubmitting,
  submitError,
}: ReviewFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  // userReview prop이 변경될 때마다 폼을 초기화하거나 기존 리뷰로 채웁니다.
  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
  }, [userReview]);

  const handleStarClick = useCallback((clickedIndex: number) => {
    if (!currentUser) {
      alert("Please sign in to write down a review!");
      return;
    }
    setRating(clickedIndex + 1);
  }, [currentUser]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert("You can write down a review after signin.");
      return;
    }

    if (rating === 0) {
      alert("Please choose your rating!");
      return;
    }

    try {
      if (userReview) {
        // actionType, newRating, oldRating, comment 순서
        await onReviewActionCompleted('update', rating, userReview.rating, comment);
      } else {
        await onReviewActionCompleted('create', rating, null, comment);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  }, [rating, comment, userReview, onReviewActionCompleted, currentUser]);

  const handleDelete = useCallback(async () => {
    if (!currentUser) {
      alert("You can delete your review after signin.");
      return;
    }

    if (!userReview || !window.confirm("Do you want to delete this review?")) {
      return;
    }

    try {
      // delete 시 newRating은 null, oldRating은 기존 평점 전달
      await onReviewActionCompleted('delete', null, userReview.rating);
    } catch (error) {
      console.error("Delete error:", error);
    }
  }, [userReview, onReviewActionCompleted, currentUser]);

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      {currentUser ? (
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {userReview ? "My Review" : "Write Review"}
        </h3>
      ) : (
        <h3 className="text-lg font-semibold text-gray-600 mb-3">
          Please sign in to write down a review.
        </h3>
      )}

      {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}

      <div className="flex flex-wrap items-center mb-3">
        <span className="font-medium text-gray-700 mr-2">Rating:</span>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              rating={rating}
              index={i}
              className={`w-6 h-6 ${currentUser ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => handleStarClick(i)}
            />
          ))}
        </div>
        {rating > 0 && <span className="ml-2 text-gray-700 font-bold">{rating.toFixed(1)}</span>}
      </div>

      <div className="mb-3">
        <label htmlFor="reviewComment" className="sr-only">Review message</label>
        <textarea
          id="reviewComment"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-y"
          rows={3}
          placeholder={currentUser ? "Please write down your review..." : "You can write down a review after signin."}
          value={comment}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          disabled={isSubmitting || !currentUser}
        ></textarea>
      </div>

      {currentUser && (
        <div className="flex justify-end space-x-2">
          {userReview && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (userReview ? 'Modifying...' : 'Submitting...') : (userReview ? 'Modify' : 'Submit')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewForm;