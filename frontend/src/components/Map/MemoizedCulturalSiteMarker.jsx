// src/components/Map/MemoizedCulturalSiteMarker.jsx
import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { FaLandmark, FaPalette, FaBuilding, FaUtensils, FaTheaterMasks, FaUsers, FaBook, FaFilm, FaQuestionCircle } from 'react-icons/fa';
import { categoryBorderColors } from '../../config/colors'; // <--- RE-IMPORT THIS!

// 카테고리 아이콘 매핑
const categoryIconComponents = {
    artwork: <FaPalette />,
    gallery: <FaBuilding />,
    museum: <FaLandmark />,
    restaurant: <FaUtensils />,
    theatre: <FaTheaterMasks />,
    arts_centre: <FaUsers />,
    community_centre: <FaUsers />,
    library: <FaBook />,
    cinema: <FaFilm />,
    other: <FaQuestionCircle />,
};

// L.divIcon을 생성하는 헬퍼 함수
const createCustomIcon = (category, isSelected = false) => {
    const IconComponent = categoryIconComponents[category] || categoryIconComponents.other;

    const backgroundColor = isSelected ? 'red' : 'white';
    // Use the direct hex value from the imported JS object
    const defaultBorderColor = categoryBorderColors[category] || categoryBorderColors.other;
    const borderColor = isSelected ? 'red' : defaultBorderColor; // <--- USE DIRECT VALUE
    const iconColor = isSelected ? 'white' : '#333';
    const boxShadow = isSelected ? '0 2px 8px rgba(255,0,0,0.5)' : '0 2px 5px rgba(0,0,0,0.3)';
    const size = isSelected ? '35px' : '30px';
    const fontSize = isSelected ? '22px' : '18px';

    const iconHtml = ReactDOMServer.renderToString(
        <div style={{
            backgroundColor: backgroundColor,
            borderRadius: '50%',
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: boxShadow,
            fontSize: fontSize,
            color: iconColor,
            border: `3.5px solid ${borderColor}` // This will now receive a hex code, not a CSS variable string
        }}>
            {IconComponent}
        </div>
    );

    const iconSize = isSelected ? [35, 35] : [30, 30];
    const iconAnchor = isSelected ? [17.5, 17.5] : [15, 15];

    return L.divIcon({
        html: iconHtml,
        className: `custom-div-icon ${isSelected ? 'selected' : ''}`,
        iconSize: iconSize,
        iconAnchor: iconAnchor,
    });
};

// 개별 마커를 위한 컴포넌트
const MemoizedCulturalSiteMarker = React.memo(({ culturalSite, openSidePanel, isSelected }) => {
    const iconToRender = createCustomIcon(culturalSite.category, isSelected);

    return (
        <Marker
            key={culturalSite._id}
            position={[
                culturalSite.location.coordinates[1],
                culturalSite.location.coordinates[0],
            ]}
            icon={iconToRender}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{
                click: () => openSidePanel(culturalSite),
            }}
        />
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.culturalSite === nextProps.culturalSite &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.openSidePanel === nextProps.openSidePanel
    );
});

export default MemoizedCulturalSiteMarker;