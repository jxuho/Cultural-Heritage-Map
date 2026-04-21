import defaultProfileImg from "../../assets/profile_image.svg";
import { useUserById } from "../../hooks/data/useUserQueries";
import useUiStore from "../../store/uiStore";
import { FaArrowLeft } from 'react-icons/fa';

const UserProfileDisplay = () => {
  const closeSidePanel = useUiStore((state) => state.closeSidePanel);
  const closeUserProfile = useUiStore(state => state.closeUserProfile)
  const userProfileId = useUiStore(state => state.userProfileId);


  const { data: selectedUserProfile, isLoading } = useUserById(userProfileId);


  const handleBackButtonClick = () => {
    console.log('back');
    closeUserProfile();
  };


 if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading user profile...</div>;
  }

  if (!selectedUserProfile) {
    return <div className="p-4 text-center text-gray-500">User profile data is not available.</div>;
  }

  return (
    <div className="flex-grow p-4 overflow-y-auto">
      {/* Header Section with Back Button and Close */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex-1 flex justify-start">
              <button
                onClick={handleBackButtonClick}
                className={`
                  flex items-center justify-center
                  w-10 h-10 rounded-full
                  bg-gray-50 text-gray-700
                  hover:bg-gray-300 hover:text-gray-800
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-400
                  shadow-md cursor-pointer
                `}
                aria-label="Go Back"
                title="Go back to the previous page"
              >
                <FaArrowLeft size='18px' /> {/* Only the icon, no text or conditional class */}
              </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 break-words flex-grow text-center">
          Profile
        </h2>
        <div className="flex-1 flex justify-end">
          <button
            className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
            onClick={closeSidePanel} // Close button for the entire panel
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center mt-6">
        <div className="w-28 h-28 overflow-hidden rounded-full border-2 border-gray-200 mb-4">
          {selectedUserProfile.profileImage ? (
            <img
              src={selectedUserProfile.profileImage}
              alt={`${selectedUserProfile.username}'s profile`}
              referrerPolicy="no-referrer"
              className="rounded-full object-cover w-full h-full"
            />
          ) : (
            <img src={defaultProfileImg} alt="empty profile image" className="rounded-full object-cover w-full h-full" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          {selectedUserProfile.username || "Unknown User"}
        </h3>
        {selectedUserProfile.email && (
          <p className="text-sm text-gray-600 mb-4">{selectedUserProfile.email}</p>
        )}
      </div>

      {selectedUserProfile.bio ? (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-md font-semibold text-gray-800 mb-2">About Me</h4>
          <p className="text-gray-700 leading-relaxed italic">
            "{selectedUserProfile.bio}"
          </p>
        </div>
      ) : (
        <p className="p-4 text-center text-gray-500 mt-6">No bio available.</p>
      )}
    </div>
  );
};

export default UserProfileDisplay;