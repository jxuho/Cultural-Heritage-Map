import React from "react";
import useAuthStore from "../../store/authStore";
import useUiStore from "../../store/uiStore";
import {
  useCulturalSiteDetail,
  useDeleteCulturalSite,
} from "../../hooks/data/useCulturalSitesQueries";

const SidePanelButtons: React.FC = () => {
  // --- Zustand (Auth & UI State) ---
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  const {
    openUpdateForm,
    openModal,
    closeModal,
    isCreateFormOpen,
    isUpdateFormOpen,
    selectedPlace: uiSelectedPlace,
    handleCloseAndCancel,
    isUserProfileOpen,
  } = useUiStore();

  // --- TanStack Query: Mutation ---
  const deleteCulturalSiteMutation = useDeleteCulturalSite();

  // --- TanStack Query: Data Fetching ---
  const { data: selectedPlaceData } = useCulturalSiteDetail(
    uiSelectedPlace?._id,
  );

  // Handler for admin's "Edit" button
  const editThisSiteButtonClickHandler = (): void => {
    if (selectedPlaceData) {
      openUpdateForm(selectedPlaceData);
    }
  };

  // Handler for non-admin's "Suggest an edit" button
  const suggestEditButtonClickHandler = (): void => {
    if (selectedPlaceData) {
      openUpdateForm(selectedPlaceData);
    }
  };

  // Handler for admin's "Delete" button
  const deleteThisSiteButtonClickHandler = (): void => {
    if (!selectedPlaceData || !selectedPlaceData._id) {
      console.error("No site selected for deletion or missing ID.");
      return;
    }

    const confirmDelete = async (): Promise<void> => {
      try {
        await deleteCulturalSiteMutation.mutateAsync(selectedPlaceData._id);
        alert("Cultural site deleted successfully!");
        closeModal();
        handleCloseAndCancel(null);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred during deletion.";
        console.error("Deletion error:", errorMessage);
        alert(`Error deleting site: ${errorMessage}`);
        closeModal();
      }
    };

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
      </div>,
    );
  };

  // UI 노출 조건 계산
  const showButtons =
    !!selectedPlaceData &&
    !isCreateFormOpen &&
    !isUpdateFormOpen &&
    !isUserProfileOpen;

  if (!showButtons) {
    return null;
  }

  return (
    <div className="flex justify-end p-4 border-t border-gray-200">
      {role === "admin" ? (
        <>
          <button
            onClick={editThisSiteButtonClickHandler}
            className="hover:bg-gray-200 text-blue-500 hover:cursor-pointer py-1 px-4 rounded text-xs"
          >
            Edit
          </button>
          <button
            onClick={deleteThisSiteButtonClickHandler}
            className="hover:bg-gray-200 text-red-500 hover:cursor-pointer py-1 px-4 rounded text-xs"
          >
            Delete
          </button>
        </>
      ) : (
        <button
          onClick={suggestEditButtonClickHandler}
          className="hover:bg-gray-200 text-black hover:cursor-pointer py-1 px-4 rounded text-xs"
        >
          Suggest an edit
        </button>
      )}
    </div>
  );
};

export default SidePanelButtons;
