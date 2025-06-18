import { create } from 'zustand';
import { devtools } from 'zustand/middleware'

const useUiStore = create(devtools((set) => ({
  // modal
  isModalOpen: false,
  modalContent: null, // 모달 내부에 렌더링할 JSX 또는 컴포넌트
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  // account manager
  isAccountManagerOpen: false,
  openAccountManager: () => set({isAccountManagerOpen: true}),
  closeAccountManager: () => set({isAccountManagerOpen: false}),

  // side panel
  isSidePanelOpen: false,
  selectedPlace: null, 
  sidePanelWidth: 360,
  setSidePanelWidth: (width) => set({sidePanelWidth: width}),
  openSidePanel: (placeInfo) => set({ isSidePanelOpen: true, selectedPlace: placeInfo }),
  closeSidePanel: () => set({ isSidePanelOpen: false, selectedPlace: null }),
  clearSelectedPlace: () => set({selectedPlace: null}),

  isContextMenuOpen: false,
  openContextMenu: () => set({isContextMenuOpen: true}),
  closeContextMenu: () => set({isContextMenuOpen: false}),

  selectedLatLng: null,
  setSelectedLatLng: (LatLng) => set({selectedLatLng: LatLng}),

  nearbySites: [],
  nearbySitesLoading: false,
  nearbySitesError: null,
  setNearbySites: (sites) => set({ nearbySites: sites, selectedPlace: null }),
  clearNearbySites: () => set({ nearbySites: [] }),
  setNearbySitesLoading: (isLoading) => set({ nearbySitesLoading: isLoading }),
  setNearbySitesError: (error) => set({ nearbySitesError: error }),

  isCreateFormOpen: false,
  createFormData: null, // Holds the data to pre-fill the form
  openCreateForm: (data) => set({
    isSidePanelOpen: true, // Open side panel if not already open
    isCreateFormOpen: true,
    createFormData: data,
    selectedPlace: null, // Ensure no single cultural site is selected
    nearbySites: [], // Clear nearby sites list
  }),
  closeCreateForm: () => set({ isCreateFormOpen: false, createFormData: null }),

  isUpdateFormOpen: false,
  updateFormData: null,
  openUpdateForm: (data) => set({
    isSidePanelOpen: true,
    isUpdateFormOpen: true,
    updateFormData: data,
    selectedPlace: null
  }),
  closeUpdateForm: () => set({isUpdateFormOpen: false, updateFormData: null})


})));

export default useUiStore;