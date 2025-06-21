import { useAllUsers } from "../../hooks/useCulturalSitesQueries";
import defaultProfileImg from "../../assets/profile_image.svg";
import UserProfileCard from "./UserProfileCard"; // 사용자 카드 컴포넌트
import { useState } from "react";
import BackButton from "../BackButton";

const UsersManagementPage = () => {
  const { data: users, isLoading, isError, error } = useAllUsers();
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleViewProfile = (userId) => {
    setSelectedUserId((prev) => (prev === userId ? null : userId)); // 토글
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-gray-700">Loading users...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg shadow-md m-4">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error.message || "Failed to load users."}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600 bg-white rounded-lg shadow-md m-4">
        <h2 className="text-xl font-bold mb-2">No Users Found</h2>
        <p>There are currently no registered users.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-100 shadow-md min-h-screen"> {/* Adjusted padding for responsiveness */}
      <div className="flex justify-start mb-4">
        <BackButton />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b pb-4"> {/* Adjusted font size for responsiveness */}
        Manage Users
      </h1>

      <div className="space-y-6 md:space-y-8"> {/* Adjusted vertical spacing */}
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col" // Adjusted padding for card
          >
            <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-4"> {/* Added flex-wrap for smaller screens */}
              <div className="flex items-center space-x-3 sm:space-x-4 flex-grow"> {/* Adjusted spacing */}
                <img
                  src={user.profileImage || defaultProfileImg}
                  alt={`${user.username}'s profile`}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border flex-shrink-0" // Adjusted size for responsiveness
                />
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 break-words">{user.username || "N/A"}</h2> {/* Adjusted font size */}
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{user.email || "N/A"}</p> {/* Adjusted font size */}
                </div>
              </div>
              <button
                onClick={() => handleViewProfile(user._id)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none text-sm sm:text-base flex-shrink-0" // Adjusted padding/font size
              >
                {selectedUserId === user._id ? "Hide Profile" : "View Profile"}
              </button>
            </div>

            {selectedUserId === user._id && (
              <div className="mt-4 sm:mt-6 border-t pt-4"> {/* Adjusted margin-top */}
                <UserProfileCard user={user} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagementPage;