// src/components/MapComponent.jsx
import { useRef, useMemo, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import useFilterStore from "../../store/filterStore";
import useUiStore from "../../store/uiStore";

import { useAllCulturalSites } from "../../hooks/useCulturalSitesQueries";
import CurrentLocationButton from "./CurrentLocationButton";

import CulturalSiteMarkers from "./CulturalSiteMarkers";

// MapEventsHandler 컴포넌트
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

// MapCenterUpdater 컴포넌트 재도입 및 jumpToPlace 로직 통합
const MapCenterUpdater = () => {
  const map = useMap(); // Leaflet map 인스턴스를 가져옵니다.
  const jumpToPlace = useUiStore((state) => state.jumpToPlace);
  const clearJumpToPlace = useUiStore((state) => state.clearJumpToPlace);
  const sidePanelWidth = useUiStore((state) => state.sidePanelWidth);
  const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);

  // jumpToPlace에 따라 지도 중심 이동
  useEffect(() => {
    if (jumpToPlace) {
      const lat = jumpToPlace.location.coordinates[1];
      const lng = jumpToPlace.location.coordinates[0];
      map.flyTo([lat, lng], 18, {
        animate: true,
        duration: 1.5,
      });

      // 마커로 이동 후, sidebar 고려해서 중심으로 이동
      if (isSidePanelOpen && sidePanelWidth > 0) {
        setTimeout(() => {
          let offsetX = sidePanelWidth / 2 - 20;
          map.panBy([offsetX, 0], { animate: true, duration: 0.5 });
        }, 1700);

        clearJumpToPlace();
      }
    }
  }, [jumpToPlace, clearJumpToPlace, map, sidePanelWidth, isSidePanelOpen]);

  return null;
};

// MapComponent
const MapComponent = () => {
  const mapRef = useRef(null); // mapRef는 더 이상 MapCenterUpdater에서 직접 사용되지 않습니다.

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const handleOpenSidePanel = useCallback(
    (site) => {
      openSidePanel(site);
    },
    [openSidePanel]
  );
  const selectedCategories = useFilterStore(
    (state) => state.selectedCategories
  );
  const selectedPlace = useUiStore((state) => state.selectedPlace);

  const {
    data: culturalSites = [],
    isLoading,
    isError,
    error,
  } = useAllCulturalSites();

  const searchQuery = useFilterStore((state) =>
    state.searchQuery.toLowerCase()
  );

  // address 등 모든 정보 포함하기
  const memoizedFilteredSites = useMemo(() => {
    return culturalSites.filter((site) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(site.category);

      // 검색어가 비어있으면 모든 항목을 일치시킵니다.
      if (!searchQuery) {
        return matchesCategory;
      }

      const lowerCaseSearchQuery = searchQuery.toLowerCase();

      // 각 필드를 검색어와 비교합니다.
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
          String(site.sourceId).toLowerCase().includes(lowerCaseSearchQuery)); // sourceId는 숫자일 수 있으므로 문자열로 변환

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

  const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={initialPosition}
        zoom={14}
        minZoom={13}
        maxBounds={[
          [50.7, 12.7],
          [50.95, 13.1],
        ]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
        zoomControl={false}
      >
        <CurrentLocationButton />
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

// import React, { useRef, useMemo, useEffect } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker, // Marker는 이제 selectedPlace를 위한 별도 렌더링에 사용하지 않습니다.
//   ZoomControl,
//   useMapEvents,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// import L from "leaflet";

// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// import useFilterStore from "../../store/filterStore";
// import useUiStore from "../../store/uiStore";

// import { useAllCulturalSites } from "../../hooks/useCulturalSitesQueries";
// import CurrentLocationButton from "./CurrentLocationButton";

// // ReactDOMServer와 FaMapMarkerAlt는 이제 MapComponent에서 필요 없습니다.
// // import ReactDOMServer from 'react-dom/server';
// // import { FaMapMarkerAlt } from 'react-icons/fa';

// import CulturalSiteMarkers from "./CulturalSiteMarkers";

// // MapEventsHandler 컴포넌트 (동일)
// const MapEventsHandler = () => {
//   const openContextMenu = useUiStore((state) => state.openContextMenu);
//   const setSelectedLatLng = useUiStore((state) => state.setSelectedLatLng);
//   useMapEvents({
//     contextmenu: (e) => {
//       console.log(e.latlng);
//       e.originalEvent.preventDefault();
//       openContextMenu();
//       setSelectedLatLng(e.latlng);
//     },
//   });
//   return null;
// };

// // Selected Place를 위한 별도의 빨간색 마커 아이콘 생성 함수는 더 이상 필요 없습니다.
// // const createSelectedPlaceIcon = () => { /* ... */ };

// // MapComponent
// const MapComponent = () => {
//   const mapRef = useRef(null);

//   const openSidePanel = useUiStore((state) => state.openSidePanel);
//   const selectedCategories = useFilterStore(
//     (state) => state.selectedCategories
//   );
//   const selectedPlace = useUiStore((state) => state.selectedPlace);

//   const jumpToPlace = useUiStore((state) => state.jumpToPlace);
//   const clearJumpToPlace = useUiStore((state) => state.clearJumpToPlace);

//   const {
//     data: culturalSites = [],
//     isLoading,
//     isError,
//     error,
//   } = useAllCulturalSites();

//   // console.log("MapComponent 재렌더링됨");

//   const memoizedFilteredSites = useMemo(() => {
//     // console.log("filteredSites 재계산됨");
//     return culturalSites.filter((site) => {
//       if (selectedCategories.length === 0) {
//         return true;
//       }
//       return selectedCategories.includes(site.category);
//     });
//   }, [culturalSites, selectedCategories]);

//   useEffect(() => {
//     if (jumpToPlace && mapRef.current) {
//       console.log("trigger");

//       const lat = jumpToPlace.location.coordinates[1];
//       const lng = jumpToPlace.location.coordinates[0];
//       mapRef.current.setView([lat, lng], 18); // 원하는 zoom 값으로 설정
//       clearJumpToPlace(); // 한 번만 실행되도록 플래그 클리어
//     }
//   }, [jumpToPlace, clearJumpToPlace]);

//   if (isLoading) {
//     return (
//       <div className="h-full w-full flex items-center justify-center text-gray-600">
//         Loading the Map...
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="h-full w-full flex items-center justify-center text-red-600">
//         Failed to load map data: {error.message}
//       </div>
//     );
//   }

//   const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

//   return (
//     <div className="h-full w-full relative">
//       <MapContainer
//         center={initialPosition}
//         zoom={14}
//         minZoom={13}
//         maxBounds={[
//           [50.7, 12.7],
//           [50.95, 13.1],
//         ]}
//         maxBoundsViscosity={1.0}
//         scrollWheelZoom={true}
//         className="h-full w-full z-0"
//         whenCreated={(mapInstance) => {
//           mapRef.current = mapInstance;
//         }}
//         zoomControl={false}
//       >
//         <CurrentLocationButton />
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         <ZoomControl position="bottomleft" />
//         <MapEventsHandler />

//         {/* CulturalSiteMarkers에 selectedPlace를 prop으로 전달 */}
//         <CulturalSiteMarkers
//           sites={memoizedFilteredSites}
//           openSidePanel={openSidePanel}
//           selectedPlace={selectedPlace} // 이 부분 추가
//         />

//         {/* selectedPlace가 있을 경우 빨간색 마커 렌더링 부분 제거 */}
//         {/* {selectedPlace && (
//                     <Marker
//                         position={[
//                             selectedPlace.location.coordinates[1],
//                             selectedPlace.location.coordinates[0],
//                         ]}
//                         icon={createSelectedPlaceIcon()}
//                         zIndexOffset={1000}
//                         eventHandlers={{
//                             click: () => openSidePanel(selectedPlace),
//                         }}
//                     />
//                 )} */}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapComponent;
