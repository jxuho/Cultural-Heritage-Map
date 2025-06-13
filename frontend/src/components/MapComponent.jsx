import { useRef } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Leaflet 기본 CSS

// Leaflet 마커 아이콘 깨짐 방지 (기존 코드 유지)
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- 클러스터링 관련 추가/수정 ---
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// --- 클러스터링 관련 추가/수정 끝 ---

// 전역 스토어 임포트
import useSidePanelStore from "../store/sidePanelStore";
// 필터 스토어 임포트 (선택된 카테고리 가져오기 위함)
import useFilterStore from "../store/filterStore"; // filtersStore.js 파일 경로에 맞게 수정

// MapComponent는 이제 culturalSites를 props로 받습니다.
function MapComponent({ culturalSites }) { // culturalSites를 props로 받도록 변경
  // 데이터 로딩 및 에러 상태는 상위 컴포넌트에서 관리하므로 제거합니다.
  // const [culturalSites, setCulturalSites] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);

  const mapRef = useRef(null);

  const openSidePanel = useSidePanelStore((state) => state.openSidePanel);
  // Zustand 필터 스토어에서 selectedCategories 가져오기
  const selectedCategories = useFilterStore((state) => state.selectedCategories);

  // 데이터 fetch 로직 제거 (상위 컴포넌트에서 담당)
  // useEffect(() => {
  //   const fetchLocations = async () => { /* ... fetch 로직 ... */ };
  //   fetchLocations();
  // }, []);

  // 로딩 및 에러 UI 제거 (상위 컴포넌트에서 처리)
  // if (loading && culturalSites.length === 0) return ...
  // if (error) return ...

  // 선택된 카테고리에 따라 문화유산 지점 필터링
  const filteredSites = culturalSites.filter(site => {
    // 1. 선택된 카테고리가 없으면 모든 지점 표시
    if (selectedCategories.length === 0) {
      return true;
    }
    // 2. 선택된 카테고리 중 하나라도 지점의 카테고리와 일치하면 표시
    return selectedCategories.includes(site.category);
  });

  const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

  return (
    <div className="h-full w-full">
      <MapContainer
        center={initialPosition}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" /> {/* 줌 컨트롤 위치 조정 */}
        {/* --- MarkerClusterGroup 추가 --- */}
        <MarkerClusterGroup
          chunkedLoading // 대량의 마커를 효율적으로 로드 (선택 사항이지만 권장)
          // maxClusterRadius={80} // 클러스터링 반경 조정 (선택 사항)
          // spiderfyOnMaxZoom={true} // 최대 줌에서 스파이더파이 (선택 사항)
        >
          {filteredSites.map((culturalSite) => ( // <--- 필터링된 filteredSites 사용
            <Marker
              key={culturalSite._id}
              position={[
                culturalSite.location.coordinates[1], // 위도 (latitude)
                culturalSite.location.coordinates[0], // 경도 (longitude)
              ]}
              eventHandlers={{
                click: () => openSidePanel(culturalSite),
              }}
            >
              {/* 마커 클릭 시 팝업을 표시하려면 여기에 Popup 컴포넌트를 추가할 수 있습니다. */}
              {/* <Popup>{culturalSite.name}</Popup> */}
            </Marker>
          ))}
        </MarkerClusterGroup>
        {/* --- MarkerClusterGroup 끝 --- */}
      </MapContainer>
    </div>
  );
}

export default MapComponent;


// import { useEffect, useState, useRef } from "react";
// import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
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

// // 전역 스토어 임포트
// import useSidePanelStore from "../store/sidePanelStore";

// function MapComponent() {
//   const [culturalSites, setCulturalSites] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const mapRef = useRef(null);

//   const openSidePanel = useSidePanelStore((state) => state.openSidePanel);

//   useEffect(() => {
//     const fetchLocations = async () => {
//       try {
//         const response = await fetch(
//           "http://localhost:5000/api/v1/cultural-sites"
//         );

//         // 응답이 성공적인지 확인합니다 (HTTP 상태 코드 200-299).
//         if (!response.ok) {
//           // HTTP 오류가 발생하면 오류를 throw합니다.
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json(); // 응답을 JSON으로 파싱합니다.
//         const culturalSitesArray = data.data.culturalSites;
//         setCulturalSites(culturalSitesArray);
//       } catch (err) {
//         // 네트워크 오류 또는 JSON 파싱 오류를 포함한 모든 오류를 처리합니다.
//         setError(
//           "Failed to fetch locations. Please check your backend server and network connection."
//         );
//         console.error("Error fetching locations:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLocations();
//   }, []);

//   if (loading && culturalSites.length === 0)
//     return (
//       <div className="flex justify-center items-center h-full text-lg">
//         Loading map data...
//       </div>
//     );
//   if (error)
//     return (
//       <div className="flex justify-center items-center h-full text-lg text-red-500">
//         Error: {error}
//       </div>
//     );

//   const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

//   return (
//     <div className="h-full w-full">
//       <MapContainer
//         center={initialPosition}
//         zoom={14}
//         scrollWheelZoom={true}
//         className="h-full w-full z-0"
//         whenCreated={(mapInstance) => {
//           mapRef.current = mapInstance;
//         }}
//       >
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         <ZoomControl position="bottomright" /> {/* 줌 컨트롤 위치 조정 */}
//         {/* --- MarkerClusterGroup 추가 --- */}
//         <MarkerClusterGroup
//           chunkedLoading // 대량의 마커를 효율적으로 로드 (선택 사항이지만 권장)
//           // maxClusterRadius={80} // 클러스터링 반경 조정 (선택 사항)
//           // spiderfyOnMaxZoom={true} // 최대 줌에서 스파이더파이 (선택 사항)
//         >
//           {culturalSites.map((culturalSite) => (
//             <Marker
//               key={culturalSite._id}
//               position={[
//                 culturalSite.location.coordinates[1], // 위도 (latitude)
//                 culturalSite.location.coordinates[0], // 경도 (longitude)
//               ]}
//               eventHandlers={{
//                 click: () => openSidePanel(culturalSite),
//               }}
//             >
//               {/* 마커 클릭 시 팝업을 표시하려면 여기에 Popup 컴포넌트를 추가할 수 있습니다. */}
//               {/* <Popup>{culturalSite.name}</Popup> */}
//             </Marker>
//           ))}
//         </MarkerClusterGroup>
//         {/* --- MarkerClusterGroup 끝 --- */}
//       </MapContainer>
//     </div>
//   );
// }

// export default MapComponent;
