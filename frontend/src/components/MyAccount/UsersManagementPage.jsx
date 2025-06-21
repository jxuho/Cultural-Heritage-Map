import { useAllUsers } from "../../hooks/data/useUserQueries";
import defaultProfileImg from "../../assets/profile_image.svg";
import UserProfileCard from "./UserProfileCard";
import { useState, useMemo } from "react"; // Added useMemo
import BackButton from "../BackButton";
import useAuthStore from "../../store/authStore"; // Import your auth store

const UsersManagementPage = () => {
  const { data: users, isLoading, isError, error } = useAllUsers();
  const { user: currentUser } = useAuthStore(); // Get the current logged-in user

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [sortBy, setSortBy] = useState("username"); // Default sort by username
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order

  const handleViewProfile = (userId) => {
    setSelectedUserId((prev) => (prev === userId ? null : userId)); // Toggle
  };

  // Memoize the sorted and filtered users list
  const sortedUsers = useMemo(() => {
    if (!users || users.length === 0) return [];

    // Separate current user
    const otherUsers = users.filter((user) => user._id !== currentUser?._id);
    const loggedInUser = users.find((user) => user._id === currentUser?._id);

    // Create a mutable copy for sorting
    const sortableUsers = [...otherUsers];

    sortableUsers.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case "role":
          valA = a.role;
          valB = b.role;
          break;
        case "createdAt":
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          valA = new Date(a.updatedAt).getTime();
          valB = new Date(b.updatedAt).getTime();
          break;
        case "username": // Default sort
        default:
          valA = a.username || "";
          valB = b.username || "";
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        // For numbers (dates converted to timestamps)
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });

    // Place the current user at the top if they exist
    return loggedInUser ? [loggedInUser, ...sortableUsers] : sortableUsers;
  }, [users, sortBy, sortOrder, currentUser]); // Re-run memoization when these dependencies change

  const handleSortChange = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Toggle order if same criteria
    } else {
      setSortBy(criteria);
      setSortOrder("asc"); // Default to ascending for new criteria
    }
  };

  const getSortIndicator = (criteria) => {
    if (sortBy === criteria) {
      return sortOrder === "asc" ? " ↑" : " ↓";
    }
    return "";
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

  if (sortedUsers.length === 0) { // Check sortedUsers for empty state
    return (
      <div className="p-6 text-center text-gray-600 bg-white rounded-lg shadow-md m-4">
        <h2 className="text-xl font-bold mb-2">No Users Found</h2>
        <p>There are currently no registered users.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-100 shadow-md min-h-screen">
      <div className="flex justify-start mb-4">
        <BackButton />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 border-b pb-4">
        Manage Users
      </h1>

      {/* Sort Buttons */}
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-4 justify-start">
        <button
          onClick={() => handleSortChange("username")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "username" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Username{getSortIndicator("username")}
        </button>
        <button
          onClick={() => handleSortChange("role")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "role" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Role{getSortIndicator("role")}
        </button>
        <button
          onClick={() => handleSortChange("createdAt")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "createdAt" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Registered Date{getSortIndicator("createdAt")}
        </button>
        <button
          onClick={() => handleSortChange("updatedAt")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "updatedAt" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Last Updated{getSortIndicator("updatedAt")}
        </button>
      </div>
      {/* End Sort Buttons */}

      <div className="space-y-6 md:space-y-8">
        {sortedUsers.map((user) => ( // Use sortedUsers here
          <div
            key={user._id}
            className={`bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col ${currentUser && user._id === currentUser._id ? 'border-2 border-blue-500' : ''}`} // Highlight current user
          >
            <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-grow break-all">
                <img
                  src={user.profileImage || defaultProfileImg}
                  alt={`${user.username}'s profile`}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border flex-shrink-0"
                />
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 break-words">
                    {user.username || "N/A"}
                    {currentUser && user._id === currentUser._id && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        (You)
                      </span>
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{user.email || "N/A"}</p>
                </div>
              </div>
              <button
                onClick={() => handleViewProfile(user._id)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none text-sm sm:text-base flex-shrink-0 cursor-pointer"
              >
                {selectedUserId === user._id ? "Hide Profile" : "View Profile"}
              </button>
            </div>

            {selectedUserId === user._id && (
              <div className="mt-4 sm:mt-6 border-t pt-4">
                {/* Pass currentUser to UserProfileCard */}
                <UserProfileCard user={user} currentUser={currentUser} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersManagementPage;