import { useState } from 'react'; 
import useUiStore from "../../store/uiStore";
import { useCulturalSiteDetail } from "../../hooks/data/useCulturalSitesQueries";
import SidePanelSkeleton from "./SidePanelSkeleton";
import ErrorMessage from "../ErrorMessage";
import NearbySitesList from "./NearbySitesList";
import SidePanelItems from "./SidePanelItems";
import CreateForm from "./CreateForm";
import UpdateForm from "./UpdateForm";
import UserProfileDisplay from './UserProfileDisplay';

const SidePanelContent = () => {
  // Directly access UI state from store
  const isCreateFormOpen = useUiStore((state) => state.isCreateFormOpen);
  const isUpdateFormOpen = useUiStore((state) => state.isUpdateFormOpen);
  const nearbySites = useUiStore((state) => state.nearbySites);
  const nearbySitesLoading = useUiStore((state) => state.nearbySitesLoading);
  const nearbySitesError = useUiStore((state) => state.nearbySitesError);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);
  const handleCloseAndCancel = useUiStore((state) => state.handleCloseAndCancel); // Action from store
  const isUserProfileOpen = useUiStore(state => state.isUserProfileOpen)

  // Local state for reviews expansion
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

  // Fetch cultural site detail directly in this component
  const {
    data: selectedPlaceData,
    isLoading: isPlaceLoading,
    isError: isPlaceError,
    error: placeError,
  } = useCulturalSiteDetail(uiSelectedPlace?._id);

  let panelContent;

  if (isCreateFormOpen) {
    panelContent = <CreateForm />;
  } else if (isUpdateFormOpen) {
    panelContent = <UpdateForm />;
  } 

   else if (isUserProfileOpen) { 
    panelContent = <UserProfileDisplay />;
  } 

  else if (nearbySitesLoading) {
    panelContent = (
      <SidePanelSkeleton onClose={() => handleCloseAndCancel("nearbyOsm")} />
    );
  } else if (nearbySitesError) {
    panelContent = (
      <ErrorMessage
        message={
          nearbySitesError?.message || "Failed to load nearby cultural sites."
        }
        onClose={() => handleCloseAndCancel(null)}
      />
    );
  } else if (nearbySites.length > 0 && !uiSelectedPlace?._id) {
    panelContent = (
      <NearbySitesList
        sites={nearbySites}
        onClose={() => handleCloseAndCancel(null)}
      />
    );
  } else if (isPlaceError) {
    panelContent = (
      <ErrorMessage
        message={placeError?.message || "Failed to load cultural site information."}
        onClose={() => handleCloseAndCancel(null)}
      />
    );
  } else if (isPlaceLoading && !selectedPlaceData) {
    panelContent = (
      <SidePanelSkeleton onClose={() => handleCloseAndCancel("culturalSiteDetail")} />
    );
  } else if (selectedPlaceData) {
    panelContent = (
      <SidePanelItems
        isReviewsExpanded={isReviewsExpanded}
        toggleReviewsExpansion={() => setIsReviewsExpanded((prev) => !prev)}
        onClose={() => handleCloseAndCancel(null)}
        // SidePanelItems should ideally also fetch its own data (e.g., reviews)
        // selectedPlaceData prop might still be useful for initial display if not refetching
        selectedPlaceData={selectedPlaceData}
      />
    );
  } else {
    panelContent = (
      <div className="p-4 text-gray-600 text-center relative">
        <div className="absolute top-4 right-4">
          <button
            className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
            onClick={() => handleCloseAndCancel(null)}
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>
        No information available.
      </div>
    );
  }

  return (
    <>
      {panelContent}
      {/* Loading overlay for cultural site detail */}
      {isPlaceLoading &&
        !selectedPlaceData &&
        !isCreateFormOpen &&
        !isUpdateFormOpen && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="absolute top-4 right-4">
              <button
                className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
                onClick={() => handleCloseAndCancel("culturalSiteDetail")}
                aria-label="Close panel"
              >
                &times;
              </button>
            </div>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        )}
    </>
  );
};

export default SidePanelContent;