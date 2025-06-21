// src/components/SidePanel/SidePanel.jsx (Modified for prop reduction)
import { useEffect, useRef } from "react";
import useUiStore from "../../store/uiStore";
import Resizer from "./SidePanelResizer";
import useSidePanelResizer from "../../hooks/ui/useSidePanelResizer";

// Import the new sub-components
import SidePanelContent from "./SidePanelContent";
import SidePanelButtons from "./SidePanelButtons";

const SidePanel = () => {
  // --- Zustand (UI State Management) ---
  const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);
  const nearbySites = useUiStore((state) => state.nearbySites); // Still needed for useEffect cleanup
  const isCreateFormOpen = useUiStore((state) => state.isCreateFormOpen); // Still needed for useEffect cleanup
  const isUpdateFormOpen = useUiStore((state) => state.isUpdateFormOpen); // Still needed for useEffect cleanup

  const handleCloseAndCancel = useUiStore((state) => state.handleCloseAndCancel); // Get action from store

  // --- useSidePanelResizer Hook ---
  const detailRef = useRef();
  const { sidePanelWidth } = useSidePanelResizer(detailRef);

  // --- Effects ---
  useEffect(() => {
    if (
      !isSidePanelOpen ||
      (!uiSelectedPlace?._id &&
        !nearbySites.length &&
        !isCreateFormOpen &&
        !isUpdateFormOpen)
    ) {
      // isReviewsExpanded is now managed in SidePanelContent
      if (!isSidePanelOpen) {
        // Use the centralized handler for full cleanup when panel closes
        handleCloseAndCancel(null);
      }
    }
  }, [
    isSidePanelOpen,
    uiSelectedPlace?._id,
    nearbySites.length,
    isCreateFormOpen,
    isUpdateFormOpen,
    handleCloseAndCancel, // Dependency for the centralized handler
  ]);

  // --- Rendering Logic ---
  if (!isSidePanelOpen) {
    return null;
  }

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
      <SidePanelContent /> 
      <SidePanelButtons /> 
    </div>
  );
};

export default SidePanel;