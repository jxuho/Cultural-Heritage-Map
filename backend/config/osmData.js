// backend/config/osmData.js
/**
 * {{geocodeArea:Chemnitz}}->.searchArea; // => turbo
 * area["name"="Chemnitz"]->.searchArea; // => too broad
 * area(3600062594)->.searchArea  // => chemnitz relation id + 3600000000
 */

const CHEMNITZ_RELATION_ID = 62594;

const singleElementQuery = (osmType, osmId) => {

  return `[out:json][timeout:25];
            ${osmType}(${osmId});
            out center;`
}

const baseCulturalSiteQuery = (radius, lat, lon) => {
  const useAround = radius && lat && lon;
  const around = useAround ? `(around:${radius},${lat},${lon})` : "";

  const AREA_ID = 3600000000 + CHEMNITZ_RELATION_ID


  return `
  [out:json][timeout:60];
  area(${AREA_ID})->.searchArea;
  (
    node["tourism"="museum"](area.searchArea)${around};
    way["tourism"="museum"](area.searchArea)${around};
    relation["tourism"="museum"](area.searchArea)${around};

    node["tourism"="artwork"](area.searchArea)${around};
    way["tourism"="artwork"](area.searchArea)${around};
    relation["tourism"="artwork"](area.searchArea)${around};

    node["tourism"="gallery"](area.searchArea)${around};
    way["tourism"="gallery"](area.searchArea)${around};
    relation["tourism"="gallery"](area.searchArea)${around};

    node["art_gallery"="yes"](area.searchArea)${around};
    way["art_gallery"="yes"](area.searchArea)${around};
    relation["art_gallery"="yes"](area.searchArea)${around};

    node["amenity"="theatre"](area.searchArea)${around};
    way["amenity"="theatre"](area.searchArea)${around};
    relation["amenity"="theatre"](area.searchArea)${around};

    node["amenity"="restaurant"](area.searchArea)${around};
    way["amenity"="restaurant"](area.searchArea)${around};
    relation["amenity"="restaurant"](area.searchArea)${around};

    node["tourism"="attraction"](area.searchArea)${around};
    way["tourism"="attraction"](area.searchArea)${around};
    relation["tourism"="attraction"](area.searchArea)${around};

    node["amenity"="arts_centre"](area.searchArea)${around};
    way["amenity"="arts_centre"](area.searchArea)${around};
    relation["amenity"="arts_centre"](area.searchArea)${around};

    node["amenity"="community_centre"](area.searchArea)${around};
    way["amenity"="community_centre"](area.searchArea)${around};
    relation["amenity"="community_centre"](area.searchArea)${around};

    node["amenity"="library"](area.searchArea)${around};
    way["amenity"="library"](area.searchArea)${around};
    relation["amenity"="library"](area.searchArea)${around};

    node["amenity"="cinema"](area.searchArea)${around};
    way["amenity"="cinema"](area.searchArea)${around};
    relation["amenity"="cinema"](area.searchArea)${around};
  );
  out center;
`;
};


const extendedCulturalSiteQuery = (radius, lat, lon) => {
  const useAround = radius && lat && lon;
  const around = useAround ? `(around:${radius},${lat},${lon})` : '';
  const AREA_ID = 3600000000 + CHEMNITZ_RELATION_ID;

  return `
[out:json][timeout:60];
area(${AREA_ID})->.searchArea;
(
  // 기존 문화 관련 요소
  node["tourism"="museum"](area.searchArea)${around};
  way["tourism"="museum"](area.searchArea)${around};
  relation["tourism"="museum"](area.searchArea)${around};

  node["tourism"="artwork"](area.searchArea)${around};
  way["tourism"="artwork"](area.searchArea)${around};
  relation["tourism"="artwork"](area.searchArea)${around};

  node["tourism"="gallery"](area.searchArea)${around};
  way["tourism"="gallery"](area.searchArea)${around};
  relation["tourism"="gallery"](area.searchArea)${around};

  node["art_gallery"="yes"](area.searchArea)${around};
  way["art_gallery"="yes"](area.searchArea)${around};
  relation["art_gallery"="yes"](area.searchArea)${around};

  node["amenity"="theatre"](area.searchArea)${around};
  way["amenity"="theatre"](area.searchArea)${around};
  relation["amenity"="theatre"](area.searchArea)${around};

  node["amenity"="restaurant"](area.searchArea)${around};
  way["amenity"="restaurant"](area.searchArea)${around};
  relation["amenity"="restaurant"](area.searchArea)${around};

  node["tourism"="attraction"](area.searchArea)${around};
  way["tourism"="attraction"](area.searchArea)${around};
  relation["tourism"="attraction"](area.searchArea)${around};

  node["amenity"="arts_centre"](area.searchArea)${around};
  way["amenity"="arts_centre"](area.searchArea)${around};
  relation["amenity"="arts_centre"](area.searchArea)${around};

  node["amenity"="community_centre"](area.searchArea)${around};
  way["amenity"="community_centre"](area.searchArea)${around};
  relation["amenity"="community_centre"](area.searchArea)${around};

  node["amenity"="library"](area.searchArea)${around};
  way["amenity"="library"](area.searchArea)${around};
  relation["amenity"="library"](area.searchArea)${around};

  node["amenity"="cinema"](area.searchArea)${around};
  way["amenity"="cinema"](area.searchArea)${around};
  relation["amenity"="cinema"](area.searchArea)${around};

  // 추가: key 값이 다음에 해당하는 정보들 포함
  node["historic"](area.searchArea)${around};
  way["historic"](area.searchArea)${around};
  relation["historic"](area.searchArea)${around};

  node["heritage"](area.searchArea)${around};
  way["heritage"](area.searchArea)${around};
  relation["heritage"](area.searchArea)${around};

  node["building"](area.searchArea)${around};
  way["building"](area.searchArea)${around};
  relation["building"](area.searchArea)${around};

  node["leisure"](area.searchArea)${around};
  way["leisure"](area.searchArea)${around};
  relation["leisure"](area.searchArea)${around};

  node["shop"](area.searchArea)${around};
  way["shop"](area.searchArea)${around};
  relation["shop"](area.searchArea)${around};

  node["wikipedia"](area.searchArea)${around};
  way["wikipedia"](area.searchArea)${around};
  relation["wikipedia"](area.searchArea)${around};
);
out center;
`;
};


module.exports = {
  singleElementQuery,
  CHEMNITZ_RELATION_ID,
  baseCulturalSiteQuery,
  extendedCulturalSiteQuery
};








