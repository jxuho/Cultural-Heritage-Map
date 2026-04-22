import { useRef, useMemo, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LatLngTuple, LatLngBoundsExpression } from "leaflet";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import useFilterStore from "../../store/filterStore.ts";
import useUiStore from "../../store/uiStore";

import { useAllCulturalSites } from "../../hooks/data/useCulturalSitesQueries";
import CurrentLocationButton from "./CurrentLocationButton";

import CulturalSiteMarkers from "./CulturalSiteMarkers";
import useViewport from "../../hooks/ui/useViewPort";

import { Place } from "@/types/place.ts";

const MapEventsHandler = () => {
  const openContextMenu = useUiStore((state) => state.openContextMenu);
  const setSelectedLatLng = useUiStore((state) => state.setSelectedLatLng);
  useMapEvents({
    contextmenu: (e) => {
      console.log(e.latlng);
      e.originalEvent.preventDefault();
      openContextMenu();
      setSelectedLatLng(e.latlng);
    },
  });
  return null;
};

const MapCenterUpdater = () => {
  const map = useMap();
  const jumpToPlace = useUiStore((state) => state.jumpToPlace);
  const clearJumpToPlace = useUiStore((state) => state.clearJumpToPlace);
  const sidePanelWidth = useUiStore((state) => state.sidePanelWidth);
  const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);
  const { width: viewportWidth } = useViewport();

  // Move map center based on jumpToPlace
  useEffect(() => {
    if (jumpToPlace) {
      const lat = jumpToPlace.location.coordinates[1];
      const lng = jumpToPlace.location.coordinates[0];
      map.flyTo([lat, lng], 18, {
        animate: true,
        duration: 1.5,
      });

      // Move to the marker, then move to the center considering the sidebar
      if (isSidePanelOpen && sidePanelWidth > 0 && viewportWidth > 450) {
        setTimeout(() => {
          let offsetX = sidePanelWidth / 2 - 20;
          map.panBy([offsetX, 0], { animate: true, duration: 0.5 });
        }, 1700);
      }
      clearJumpToPlace();
    }
  }, [
    jumpToPlace,
    clearJumpToPlace,
    map,
    sidePanelWidth,
    isSidePanelOpen,
    viewportWidth,
  ]);

  return null;
};

// MapComponent
const MapComponent = () => {
  const mapRef = useRef(null);

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const handleOpenSidePanel = useCallback(
    (site: Place) => {
      openSidePanel(site);
    },
    [openSidePanel],
  );
  const selectedCategories = useFilterStore(
    (state) => state.selectedCategories,
  );
  const selectedPlace = useUiStore((state) => state.selectedPlace);

  const {
    data: culturalSites = [],
    isLoading,
    isError,
    error,
  } = useAllCulturalSites();

  const searchQuery = useFilterStore((state) =>
    state.searchQuery.toLowerCase(),
  );

  // Include all information, including address
  const memoizedFilteredSites = useMemo(() => {
    return culturalSites.filter((site) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(site.category);

      // If the search term is empty, it matches all entries.
      if (!searchQuery) {
        return matchesCategory;
      }

      const lowerCaseSearchQuery = searchQuery.toLowerCase();

      // Compare each field to your search term.
      const matchesSearch =
        site.name.toLowerCase().includes(lowerCaseSearchQuery) ||
        (site.description &&
          site.description.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (site.category &&
          site.category.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (site.address &&
          site.address.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (site.website &&
          site.website.toLowerCase().includes(lowerCaseSearchQuery)) ||
        (site.sourceId &&
          String(site.sourceId).toLowerCase().includes(lowerCaseSearchQuery)); // sourceId can be a number, so convert it to a string

      return matchesCategory && matchesSearch;
    });
  }, [culturalSites, selectedCategories, searchQuery]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-600">
        Loading the Map...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full w-full flex items-center justify-center text-red-600">
        Failed to load map data: {error.message}
      </div>
    );
  }

  const initialPosition: LatLngTuple = [50.8303, 12.91895]; // Chemnitz Lat, Lng
  const mapMaxBounds: LatLngBoundsExpression = [
    [50.7, 12.7],
    [50.95, 13.1],
  ];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={initialPosition}
        zoom={14}
        minZoom={13}
        maxBounds={mapMaxBounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        // whenCreated={(mapInstance) => {
        //   mapRef.current = mapInstance;
        // }}
        ref={mapRef}
        zoomControl={false}
      >
        <CurrentLocationButton maxBounds={mapMaxBounds} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        <MapEventsHandler />
        <MapCenterUpdater />
        <CulturalSiteMarkers
          sites={memoizedFilteredSites}
          openSidePanel={handleOpenSidePanel}
          selectedPlace={selectedPlace}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
