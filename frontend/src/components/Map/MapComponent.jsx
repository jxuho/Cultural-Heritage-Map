import { useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet 마커 아이콘 깨짐 방지 (기존 코드 유지)
import L from "leaflet";

// 기본 아이콘 설정은 제거하거나, fallback 용도로만 사용
// L.Marker.prototype.options.icon = DefaultIcon; // 이 줄은 제거합니다.

// --- 클러스터링 관련 추가/수정 ---
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// --- 클러스터링 관련 추가/수정 끝 ---

// 필터 스토어 임포트
import useFilterStore from "../../store/filterStore";
// ui 스토어 임포트
import useUiStore from "../../store/uiStore";

// TanStack Query 훅 임포트
import { useAllCulturalSites } from "../../hooks/useCulturalSitesQueries";
import CurrentLocationButton from "./CurrentLocationButton";

// NEW: ReactDOMServer 임포트
import ReactDOMServer from 'react-dom/server';
// NEW: React Icons 임포트 (예시로 몇 가지만 가져왔습니다. 필요한 아이콘을 추가하세요.)
import { FaLandmark, FaPalette, FaBuilding, FaUtensils, FaTheaterMasks, FaUsers, FaBook, FaFilm, FaQuestionCircle } from 'react-icons/fa';


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

// --- NEW: 카테고리별 React Icons 및 DivIcon 생성 함수 ---
// 각 카테고리에 맞는 React Icon 컴포넌트 매핑
const categoryIconComponents = {
  artwork: <FaPalette />,
  gallery: <FaBuilding />,
  museum: <FaLandmark />,
  restaurant: <FaUtensils />,
  theatre: <FaTheaterMasks />,
  arts_centre: <FaUsers />, // 예시로 다른 아이콘 사용
  community_centre: <FaUsers />,
  library: <FaBook />,
  cinema: <FaFilm />,
  other: <FaQuestionCircle />, // 기본 아이콘
};

// L.divIcon을 생성하는 헬퍼 함수
const createCustomIcon = (category) => {
  const IconComponent = categoryIconComponents[category] || categoryIconComponents.other;

  // React Icon을 HTML 문자열로 변환
  const iconHtml = ReactDOMServer.renderToString(
    <div style={{
        backgroundColor: 'white', // 배경색
        borderRadius: '50%',     // 원형 마커
        width: '30px',           // 크기
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)', // 그림자
        fontSize: '18px',        // 아이콘 크기
        color: '#333',           // 아이콘 색상
        border: '2px solid #333' // 테두리
    }}>
      {IconComponent}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon', // 필요시 추가 CSS 클래스
    iconSize: [30, 30], // div의 크기와 동일하게 설정
    iconAnchor: [15, 15], // div의 중심을 마커의 앵커로 설정
  });
};
// --- END NEW ---


// MapComponent
const MapComponent = () => {
  const mapRef = useRef(null);

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const selectedCategories = useFilterStore(
    (state) => state.selectedCategories
  );

  const {
    data: culturalSites = [],
    isLoading,
    isError,
    error,
  } = useAllCulturalSites();

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

  const filteredSites = culturalSites.filter((site) => {
    if (selectedCategories.length === 0) {
      return true;
    }
    return selectedCategories.includes(site.category);
  });

  const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={initialPosition}
        zoom={14}
        minZoom={13}
        maxZoom={17}
        maxBounds={[
          [50.7, 12.7], // SW corner of Chemnitz region
          [50.95, 13.1], // NE corner of Chemnitz region
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
        <MarkerClusterGroup chunkedLoading>
          {filteredSites.map((culturalSite) => (
            <Marker
              key={culturalSite._id}
              position={[
                culturalSite.location.coordinates[1], // Latitude
                culturalSite.location.coordinates[0], // Longitude
              ]}
              // --- NEW: createCustomIcon 함수를 사용하여 아이콘 할당 ---
              icon={createCustomIcon(culturalSite.category)}
              // --- END NEW ---
              eventHandlers={{
                click: () => openSidePanel(culturalSite),
              }}
            >
              {/* Optional: Add Popup here */}
              {/* <Popup>{culturalSite.name}</Popup> */}
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default MapComponent;



// import { useRef } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   ZoomControl,
//   useMapEvents,
// } from "react-leaflet"; // useMapEvents 임포트 추가
// import "leaflet/dist/leaflet.css"; // Leaflet 기본 CSS

// // Leaflet 마커 아이콘 깨짐 방지 (기존 코드 유지)
// import L from "leaflet";
// import icon from "leaflet/dist/images/marker-icon.png";
// import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
// import shadow from "leaflet/dist/images/marker-shadow.png";

// let DefaultIcon = L.icon({
//   iconRetinaUrl: iconRetina,
//   iconUrl: icon,
//   shadowUrl: shadow,
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   tooltipAnchor: [16, -28],
//   shadowSize: [41, 41],
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// // --- 클러스터링 관련 추가/수정 ---
// import MarkerClusterGroup from "react-leaflet-markercluster";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// // --- 클러스터링 관련 추가/수정 끝 ---

// // 필터 스토어 임포트 (선택된 카테고리 가져오기 위함)
// import useFilterStore from "../../store/filterStore";
// // ui 스토어 임포트
// import useUiStore from "../../store/uiStore";

// // TanStack Query 훅 임포트
// import { useAllCulturalSites } from "../../hooks/useCulturalSitesQueries"; // 새롭게 추가
// import CurrentLocationButton from "./CurrentLocationButton";

// // MapEventsHandler 컴포넌트 추가
// const MapEventsHandler = () => {
//   const openContextMenu = useUiStore((state) => state.openContextMenu);
//   const setSelectedLatLng = useUiStore((state) => state.setSelectedLatLng);
//   useMapEvents({
//     // 우클릭
//     contextmenu: (e) => {
//       console.log(e.latlng);

//       e.originalEvent.preventDefault(); // 기본 브라우저 contextmenu 방지
//       openContextMenu();
//       setSelectedLatLng(e.latlng);
//     },
//   });
//   return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다.
// };

// // MapComponent는 이제 culturalSites를 props로 받지 않습니다.
// const MapComponent = () => {
//   // props 제거

//   const mapRef = useRef(null);

//   const openSidePanel = useUiStore((state) => state.openSidePanel);
//   const selectedCategories = useFilterStore(
//     (state) => state.selectedCategories
//   );

//   // --- TanStack Query: useAllCulturalSites 훅을 직접 사용 ---
//   const {
//     data: culturalSites = [], // 데이터 (기본값 빈 배열)
//     isLoading, // 로딩 상태
//     isError, // 에러 발생 여부
//     error, // 에러 객체
//   } = useAllCulturalSites(); // 훅 호출

//   // 로딩 또는 에러 상태 처리
//   if (isLoading) {
//     // 로딩 중일 때 지도를 렌더링하지 않거나, 로딩 스피너 등을 표시
//     return (
//       <div className="h-full w-full flex items-center justify-center text-gray-600">
//         Loading the Map...
//       </div>
//     );
//   }

//   if (isError) {
//     // 에러 발생 시 사용자에게 메시지 표시
//     return (
//       <div className="h-full w-full flex items-center justify-center text-red-600">
//         지도 데이터를 불러오는 데 실패했습니다: {error.message}
//       </div>
//     );
//   }

//   // 선택된 카테고리에 따라 문화유산 지점 필터링
//   const filteredSites = culturalSites.filter((site) => {
//     // 1. 선택된 카테고리가 없으면 모든 지점 표시
//     if (selectedCategories.length === 0) {
//       return true;
//     }
//     // 2. 선택된 카테고리 중 하나라도 지점의 카테고리와 일치하면 표시
//     return selectedCategories.includes(site.category);
//   });

//   const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

//   return (
//     <div className="h-full w-full relative">
//       <MapContainer
//         center={initialPosition}
//         zoom={14}
//         minZoom={13}
//         maxZoom={17}
//         maxBounds={[
//           [50.7, 12.7], // SW corner
//           [50.95, 13.1], // NE corner
//         ]}
//         scrollWheelZoom={true}
//         className="h-full w-full z-0"
//         whenCreated={(mapInstance) => {
//           mapRef.current = mapInstance;
//         }}
//         zoomControl={false}
//       >
//       <CurrentLocationButton />
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         <ZoomControl position="bottomleft" />
//         {/* MapEventsHandler 컴포넌트를 MapContainer 내부에 추가 */}
//         <MapEventsHandler />
//         {/* --- MarkerClusterGroup 추가 --- */}
//         <MarkerClusterGroup
//           chunkedLoading // 대량의 마커를 효율적으로 로드 (선택 사항이지만 권장)
//         >
//           {filteredSites.map(
//             (
//               culturalSite // <--- 필터링된 filteredSites 사용
//             ) => (
//               <Marker
//                 key={culturalSite._id}
//                 position={[
//                   culturalSite.location.coordinates[1], // 위도 (latitude)
//                   culturalSite.location.coordinates[0], // 경도 (longitude)
//                 ]}
//                 eventHandlers={{
//                   click: () => openSidePanel(culturalSite),
//                 }}
//               >
//                 {/* 마커 클릭 시 팝업을 표시하려면 여기에 Popup 컴포넌트를 추가할 수 있습니다. */}
//                 {/* <Popup>{culturalSite.name}</Popup> */}
//               </Marker>
//             )
//           )}
//         </MarkerClusterGroup>
//         {/* --- MarkerClusterGroup 끝 --- */}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapComponent;
