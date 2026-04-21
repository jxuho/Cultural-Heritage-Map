import StarIcon from "../StarIcon";
import useUiStore from "../../store/uiStore";

const ReviewDisplay = ({
  reviews,
  currentUser,
}: {
  reviews: any[];
  currentUser: any;
}) => {
  const openUserProfile = useUiStore((state) => state.openUserProfile);

  // Handler for clicking on user info
  const handleUserClick = (user: any) => {
    openUserProfile(user._id);
  };

  if (reviews.length === 0) {
    if (currentUser) {
      return (
        <p className="text-gray-600 text-center py-4">
          No reviews from the other users.
        </p>
      );
    } else {
      return <p className="text-gray-600 text-center py-4">No reviews yet.</p>;
    }
  }

  return (
    <div className="space-y-4 p-4">
      {reviews.map((review) => (
        <div
          key={review._id}
          className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex items-center mb-2">
            {/* Make profile image clickable */}
            {review.user?.profileImage && (
              <img
                src={review.user.profileImage}
                alt={`${review.user.username}'s profile`}
                className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200 cursor-pointer"
                onClick={() => handleUserClick(review.user)} // Add onClick
              />
            )}
            {/* Make username clickable */}
            <p
              className="font-semibold text-gray-800 mr-2 flex-grow cursor-pointer hover:underline" // Add cursor-pointer and hover:underline
              onClick={() => handleUserClick(review.user)} // Add onClick
            >
              {review.user?.username || "Unknown user"}
            </p>
            <div className="flex text-yellow-500 text-sm">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  rating={review.rating}
                  index={i}
                  className="w-4 h-4"
                  displayMode="reviewForm"
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-gray-700 text-sm italic">"{review.comment}"</p>
          )}
          <p className="text-gray-500 text-xs mt-2 text-right">
            {new Date(review.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReviewDisplay;
