// SidePanel.jsx
import { useEffect, useRef, useState } from "react";
import useUiStore from "../../store/uiStore";
import useAuthStore from "../../store/authStore"; // Import the auth store
import { useQueryClient } from "@tanstack/react-query";

import Resizer from "./SidePanelResizer";
import useSidePanelResizer from "../../hooks/useSidePanelResizer";

import {
  useCulturalSiteDetail,
  useDeleteCulturalSite,
} from "../../hooks/useCulturalSitesQueries";

import SidePanelItems from "./SidePanelItems";
import SidePanelSkeleton from "./SidePanelSkeleton";
import ErrorMessage from "../ErrorMessage";
import NearbySitesList from "./NearbySitesList";
import CreateForm from "./CreateForm"; // Import the CreateForm component
import UpdateForm from "./UpdateForm"; // Import the UpdateForm component

const SidePanel = () => {
  // --- Zustand (UI State Management) ---
  const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);

  const nearbySites = useUiStore((state) => state.nearbySites);
  const clearNearbySites = useUiStore((state) => state.clearNearbySites);
  const nearbySitesLoading = useUiStore((state) => state.nearbySitesLoading);
  const nearbySitesError = useUiStore((state) => state.nearbySitesError);
  const closeSidePanel = useUiStore((state) => state.closeSidePanel);
  const clearSelectedPlace = useUiStore((state) => state.clearSelectedPlace);

  const isCreateFormOpen = useUiStore((state) => state.isCreateFormOpen);
  const isUpdateFormOpen = useUiStore((state) => state.isUpdateFormOpen);
  const openUpdateForm = useUiStore((state) => state.openUpdateForm);
  const closeCreateForm = useUiStore((state) => state.closeCreateForm); // Add this to ensure create form closes if update opens
  const closeUpdateForm = useUiStore((state) => state.closeUpdateForm); // Add this to manage update form state

  // --- Zustand (Auth State Management) ---
  const { user } = useAuthStore();
  const role = user?.role;
  const { openModal, closeModal } = useUiStore();
  const deleteCulturalSiteMutation = useDeleteCulturalSite();

  // --- TanStack Query Client ---
  const queryClient = useQueryClient();

  // --- Local UI State (useState) ---
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

  // --- useSidePanelResizer Hook ---
  const detailRef = useRef();
  const { sidePanelWidth } = useSidePanelResizer(detailRef);

  // --- TanStack Query: Fetch top-level cultural site detail for initial state ---
  const {
    data: selectedPlaceData,
    isLoading: isPlaceLoading,
    isError: isPlaceError,
    error: placeError,
  } = useCulturalSiteDetail(uiSelectedPlace?._id);

  // --- Combined Close and Cancel Function ---
  const handleCloseAndCancel = (queryKeyToCancel) => {
    closeSidePanel();
    clearNearbySites();
    clearSelectedPlace();
    closeCreateForm(); // Ensure create form is closed
    closeUpdateForm(); // Ensure update form is closed
    if (queryKeyToCancel) {
      console.log(`Cancelling query with key: ${queryKeyToCancel}`);
      queryClient.cancelQueries({ queryKey: [queryKeyToCancel] });
    }
  };

  // --- Effects ---
  useEffect(() => {
    // This effect ensures UI state is reset when the panel closes or context changes
    if (
      !isSidePanelOpen ||
      (!uiSelectedPlace?._id &&
        !nearbySites.length &&
        !isCreateFormOpen &&
        !isUpdateFormOpen)
    ) {
      setIsReviewsExpanded(false);
      if (!isSidePanelOpen) {
        clearNearbySites();
        clearSelectedPlace();
        closeCreateForm(); // Reset forms
        closeUpdateForm(); // Reset forms
      }
    }
  }, [
    isSidePanelOpen,
    uiSelectedPlace?._id,
    nearbySites.length,
    clearNearbySites,
    clearSelectedPlace,
    isCreateFormOpen,
    isUpdateFormOpen,
    closeCreateForm, // Add dependency
    closeUpdateForm, // Add dependency
  ]);

  // Handler for admin's "Edit" button
  const editThisSiteButtonClickHandler = () => {
    if (selectedPlaceData) {
      openUpdateForm(selectedPlaceData);
    }
  };

  // Handler for non-admin's "Suggest an edit" button
  const suggestEditButtonClickHandler = () => {
    if (selectedPlaceData) {
      openUpdateForm(selectedPlaceData); // Reuses the same update form
    }
  };

  // const delteThisSiteButtonClickHandler = () => {
  //   // delete modal 열기 (This would typically open a delete confirmation modal)
  //   console.log("Delete button clicked for site:", selectedPlaceData?._id);
  //   // You would integrate your delete modal logic here.
  // };

  const deleteThisSiteButtonClickHandler = () => {
    // Ensure we have selected place data to delete
    if (!selectedPlaceData || !selectedPlaceData._id) {
      console.error("No site selected for deletion or missing ID.");
      return;
    }

    const confirmDelete = async () => {
      try {
        await deleteCulturalSiteMutation.mutateAsync(selectedPlaceData._id);
        alert("Cultural site deleted successfully!");
        closeModal(); // Close the modal
        closeSidePanel(); // Close the side panel/details view after deletion
        // You might also want to refetch data on the map or update the UI
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred during deletion.";
        console.error("Deletion error:", errorMessage);
        alert(`Error deleting site: ${errorMessage}`); // Inform the user about the error
        closeModal(); // Close modal even on error
      }
    };

    // Open the delete confirmation modal
    openModal(
      <div className="text-center p-4">
        <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
        <p className="mb-6">
          Are you sure you want to delete "
          <span className="font-semibold">{selectedPlaceData.name}</span>"? This
          action cannot be undone.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={confirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Yes, Delete It
          </button>
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // --- Rendering Logic ---
  if (!isSidePanelOpen) {
    return null;
  }

  let panelContent;

  if (isCreateFormOpen) {
    panelContent = <CreateForm />;
  } else if (isUpdateFormOpen) {
    panelContent = <UpdateForm />;
  } else if (nearbySitesLoading) {
    panelContent = (
      <SidePanelSkeleton onClose={() => handleCloseAndCancel("nearbyOsm")} />
    );
  } else if (nearbySitesError) {
    panelContent = (
      <ErrorMessage
        message={
          nearbySitesError?.message || "Failed to load nearby cultural sites." // English translation
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
        message={
          placeError?.message || "Failed to load cultural site information."
        } // English translation
        onClose={() => handleCloseAndCancel(null)}
      />
    );
  } else if (isPlaceLoading && !selectedPlaceData) {
    panelContent = (
      <SidePanelSkeleton
        onClose={() => handleCloseAndCancel("culturalSiteDetail")}
      />
    );
  } else if (selectedPlaceData) {
    panelContent = (
      <SidePanelItems
        isReviewsExpanded={isReviewsExpanded}
        toggleReviewsExpansion={() => setIsReviewsExpanded((prev) => !prev)}
        onClose={() => handleCloseAndCancel(null)} // Pass onClose if SidePanelItems has a close button
      />
    );
  } else {
    panelContent = (
      <p className="p-4 text-gray-600 text-center relative">
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
      </p>
    );
  }

  // Function to handle edit/delete based on role (Admin)
  const renderAdminButtons = () => {
    // Only show these buttons if no form (create/update) is open
    if (
      role === "admin" &&
      selectedPlaceData &&
      !isCreateFormOpen &&
      !isUpdateFormOpen
    ) {
      return (
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={editThisSiteButtonClickHandler}
            className=" hover:bg-gray-200 text-blue-500 hover:cursor-pointer py-1 px-4 rounded text-xs"
          >
            Edit
          </button>
          <button
            onClick={deleteThisSiteButtonClickHandler}
            className=" hover:bg-gray-200 text-red-500 hover:cursor-pointer py-1 px-4 rounded text-xs"
          >
            Delete
          </button>
        </div>
      );
    }
    return null;
  };

  // Function to handle proposal submission (Non-Admin)
  const renderProposalButton = () => {
    // Only show this button if no form (create/update) is open
    if (
      role !== "admin" &&
      selectedPlaceData &&
      !isCreateFormOpen &&
      !isUpdateFormOpen
    ) {
      return (
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={suggestEditButtonClickHandler} // Use the new handler
            className=" hover:bg-gray-200 text-black hover:cursor-pointer py-1 px-4 rounded text-xs"
          >
            Suggest an edit
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="absolute z-30 right-0 top-0 h-full shadow-lg bg-white max-w-[700px] flex flex-col"
      ref={detailRef}
      style={{
        width: sidePanelWidth,
        transition: "width 180ms ease",
        position: "absolute",
        right: "0",
        boxShadow:
          "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
      }}
    >
      <Resizer detailRef={detailRef} />
      {panelContent}
      {/* Conditionally render admin or proposal buttons */}
      {renderAdminButtons()}
      {renderProposalButton()}
      {isPlaceLoading &&
        !selectedPlaceData &&
        !isCreateFormOpen &&
        !isUpdateFormOpen && ( // Ensure loading spinner only shows when relevant
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
    </div>
  );
};

export default SidePanel;
