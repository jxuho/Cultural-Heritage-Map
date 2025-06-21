import { useState, useMemo } from "react"; // Added useMemo
import { BsStarFill } from "react-icons/bs";
import useAuthStore from "../../store/authStore";
import {
  useMyFavorites,
  useFavoriteMutation,
} from "../../hooks/data/useFavoriteQueries";
import ErrorMessage from "../ErrorMessage";
import StarIcon from "../StarIcon";
import BackButton from "../BackButton";

const FavoriteSites = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [expandedSiteId, setExpandedSiteId] = useState(null);
  const [sortBy, setSortBy] = useState("name"); // Default sort by name
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order

  const {
    data: myFavorites,
    isLoading: isLoadingFavorites,
    isError: isFavoritesError,
    error: favoritesError,
  } = useMyFavorites(currentUser?._id);

  const favoriteMutation = useFavoriteMutation();

  const handleFavoriteChange = async (
    event,
    culturalSiteId,
    isCurrentlyFavorite
  ) => {
    event.stopPropagation();

    if (!currentUser) {
      alert("Please signin");
      return;
    }

    try {
      await favoriteMutation.mutateAsync({
        actionType: isCurrentlyFavorite ? "delete" : "add",
        culturalSiteId: culturalSiteId,
      });
    } catch (err) {
      console.error("Error occurred while changing favorite status:", err);
    }
  };

  const handleSiteClick = (siteId) => {
    setExpandedSiteId((prevId) => (prevId === siteId ? null : siteId));
  };

  // Memoize the sorted favorite sites list
  const sortedFavorites = useMemo(() => {
    if (!myFavorites || myFavorites.length === 0) return [];

    const sortableFavorites = [...myFavorites];

    sortableFavorites.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case "name":
          valA = a.name || "";
          valB = b.name || "";
          break;
        case "averageRating":
          valA = a.averageRating || 0; // Treat undefined/null as 0 for sorting
          valB = b.averageRating || 0;
          break;
        case "reviewCount":
          valA = a.reviewCount || 0;
          valB = b.reviewCount || 0;
          break;
        default: // Default to name
          valA = a.name || "";
          valB = b.name || "";
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        // For numbers (ratings, review counts)
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
    });
    return sortableFavorites;
  }, [myFavorites, sortBy, sortOrder]); // Re-run memoization when these dependencies change

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

  // --- Loading/Error/Empty Favorites State Handling ---
  const renderContent = () => {
    if (!currentUser) {
      return (
        <div className="text-center flex-grow flex items-center justify-center">
          <p className="text-gray-600 text-lg font-medium">
            Please sign in to see favorite sites.
          </p>
        </div>
      );
    }

    if (isLoadingFavorites) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 ml-2">
            Loading favorite sites...
          </p>
        </div>
      );
    }

    if (isFavoritesError) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <ErrorMessage
            message={
              favoritesError?.message ||
              "Failed to fetch favorite sites."
            }
          />
        </div>
      );
    }

    if (!sortedFavorites || sortedFavorites.length === 0) { // Check sortedFavorites for empty state
      return (
        <div className="flex-grow flex items-center justify-center flex-col">
          <p className="text-gray-600 text-lg text-center">
            There are no favorite sites.
          </p>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Explore the map and add your favorite sites!
          </p>
        </div>
      );
    }

    // Actual favorite sites list
    return (
      <ul className="space-y-4">
        {sortedFavorites.map((site) => ( // Use sortedFavorites here
          <li
            key={site._id}
            className="flex flex-col bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200 overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => handleSiteClick(site._id)}
            >
              <span className="text-lg font-semibold text-gray-800 flex-grow pr-4 break-all">
                {site.name}
              </span>
              <button
                onClick={(e) => handleFavoriteChange(e, site._id, true)}
                className={`text-xl p-2 rounded-full transition-colors duration-200 ${
                  favoriteMutation.isPending
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                } text-yellow-500 hover:text-yellow-600 hover:cursor-pointer`}
                disabled={favoriteMutation.isPending}
              >
                <BsStarFill />
              </button>
            </div>

            {expandedSiteId === site._id && (
              <div className="p-4 text-sm text-gray-700 bg-gray-100 border-t border-gray-200">
                {site.averageRating !== undefined &&
                  site.averageRating !== null &&
                  site.reviewCount > 0 && (
                    <div className="flex flex-wrap items-center mb-1">
                      <span className="font-semibold mr-2">Rating:</span>
                      <div className="flex text-yellow-500 text-base mr-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            rating={site.averageRating}
                            index={i}
                            className="w-4 h-4"
                            displayMode="averageRating"
                          />
                        ))}
                      </div>
                      <span className="font-bold text-gray-800">
                        {site.averageRating.toFixed(1)} ({site.reviewCount}
                        reviews)
                      </span>
                    </div>
                  )}

                {site.category && (
                  <p className="mb-1">
                    <span className="font-semibold">Category:</span>
                    {site.category
                      ?.replace(/_/g, " ")
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ") || "N/A"}
                  </p>
                )}
                {site.address && (
                  <p className="mb-1">
                    <span className="font-semibold">Address:</span> {site.address}
                  </p>
                )}
                {site.website && (
                  <p className="mb-1">
                    <span className="font-semibold">Website:</span>
                    <a
                      href={site.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit
                    </a>
                  </p>
                )}
                {site.openingHours && (
                  <p className="mb-1">
                    <span className="font-semibold">Opening Hours:</span>
                    {site.openingHours}
                  </p>
                )}
                {site.description && (
                  <div className="mt-2">
                    <p className="font-semibold mb-1">Description:</p>
                    <p className="leading-relaxed">{site.description}</p>
                  </div>
                )}
                {!site.category &&
                  !site.address &&
                  !site.website &&
                  !site.openingHours &&
                  !site.description &&
                  (site.averageRating === undefined ||
                    site.averageRating === null ||
                    site.reviewCount === 0) && (
                    <p className="text-gray-500 italic mt-2">
                      There's no additional info.
                    </p>
                  )}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md flex flex-col h-full">
      <div className="flex justify-start mb-4">
        <BackButton />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          My Favorites
        </h2>
      </div>

      {/* Sort Buttons for FavoriteSites */}
      <div className="mb-6 flex flex-wrap gap-2 sm:gap-4 justify-start">
        <button
          onClick={() => handleSortChange("name")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "name" ? "bg-blue-600 text-white cursor-pointer" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Name{getSortIndicator("name")}
        </button>
        <button
          onClick={() => handleSortChange("averageRating")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "averageRating" ? "bg-blue-600 text-white cursor-pointer" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Average Rating{getSortIndicator("averageRating")}
        </button>
        <button
          onClick={() => handleSortChange("reviewCount")}
          className={`px-4 py-2 rounded-md transition-colors ${sortBy === "reviewCount" ? "bg-blue-600 text-white cursor-pointer" : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"}`}
        >
          Sort by Review Count{getSortIndicator("reviewCount")}
        </button>
      </div>
      {/* End Sort Buttons */}

      <div
        className="overflow-y-auto pr-2 flex-grow"
      >
        {renderContent()}
      </div>

      {favoriteMutation.isPending && (
        <div className="mt-4 text-center text-blue-500">
          <p>Changing favorites...</p>
        </div>
      )}
    </div>
  );
};

export default FavoriteSites;