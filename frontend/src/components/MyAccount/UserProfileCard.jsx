import defaultProfileImg from "../../assets/profile_image.svg";

const UserProfileCard = ({ user }) => {
  const {
    username = "N/A",
    email = "N/A",
    profileImage,
    role = "user",
    googleId,
    bio = "",
    favoriteSites = [],
    createdAt,
    updatedAt,
    __v,
  } = user;

  return (
    <div className="max-w-full sm:max-w-xl mx-auto bg-white shadow-lg rounded-lg p-4 sm:p-7 mt-4 sm:mt-6 border border-gray-200">
      <div className="flex items-center space-x-3 sm:space-x-5 border-b pb-3 sm:pb-5 mb-3 sm:mb-5">
        <img
          src={profileImage || defaultProfileImg}
          alt={`${username}'s profile`}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-blue-400 shadow-sm flex-shrink-0"
        />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1 break-words">
            {username}
          </h2>
          <p className="text-sm sm:text-md text-gray-700 break-words">
            {email}
          </p>
          {googleId && (
            <p className="text-xs text-gray-500 mt-1">
              Google ID: <span className="font-mono break-all">{googleId}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mb-3 sm:mb-5">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 border-b pb-1.5 sm:pb-2">
          Account Details
        </h3>
        <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-md text-gray-700">
          <p>
            <strong>Role: </strong>
            <span className="capitalize text-blue-600 font-medium">{role}</span>
          </p>
          <p>
            <strong>Status: </strong>
            {user.active ? "Active" : "Inactive"}
          </p>
          <p>
            <strong>Data Version (__v): </strong>
            {__v !== undefined ? __v : "N/A"}
          </p>
          <p>
            <strong>Registered On: </strong>

            {createdAt
              ? new Date(createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "N/A"}
          </p>
          <p>
            <strong>Last Updated: </strong>
            {updatedAt
              ? new Date(updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="mb-3 sm:mb-5">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 border-b pb-1.5 sm:pb-2">
          Favorite Sites
        </h3>
        <p className="text-sm sm:text-md text-gray-700">
          <strong>Number of Favorites: </strong>
          <span className="font-semibold text-blue-600">
            {favoriteSites.length}
          </span>
        </p>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 border-b pb-1.5 sm:pb-2">
          Bio / About Me
        </h3>
        <p className="italic text-gray-600 whitespace-pre-line leading-relaxed text-sm sm:text-base">
          {bio.trim() !== "" ? bio : "No biography provided."}
        </p>
      </div>
    </div>
  );
};

export default UserProfileCard;
