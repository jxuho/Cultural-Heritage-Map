import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Leaflet 기본 CSS
import axios from "axios"; // API 호출 라이브러리

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
import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// --- 클러스터링 관련 추가/수정 끝 ---

// 전역 스토어 임포트
import useSidePanelStore from "../store/sidePanelStore";

function MapComponent() {
  const [culturalSites, setCulturalSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  const openSidePanel = useSidePanelStore((state) => state.openSidePanel);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/v1/cultural-sites"
        );
        const culturalSitesArray = response.data.data.culturalSites;
        setCulturalSites(culturalSitesArray);
      } catch (err) {
        setError(
          "Failed to fetch locations. Please check your backend server."
        );
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  if (loading && culturalSites.length === 0)
    return (
      <div className="flex justify-center items-center h-full text-lg">
        Loading map data...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-full text-lg text-red-500">
        Error: {error}
      </div>
    );

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
          {culturalSites.map((culturalSite) => (
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