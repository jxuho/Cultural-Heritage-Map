// backend/utils/osmDataProcessor.js

// osm 데이터를 받아서 mongodb 스키마에 맞게 변경


const axios = require('axios');
const { NOMINATIM_API_URL } = require('../config/apiUrls');
const AppError = require('../utils/AppError');
const { CULTURAL_CATEGORY } = require('../config/culturalSiteConfig'); // CULTURAL_CATEGORY 임포트

/**
 * OSM element의 tags를 기반으로 CulturalSite의 name을 결정합니다.
 * @param {object} tags - OSM element의 tags 객체.
 * @param {string} sourceId - OSM element의 sourceId.
 * @returns {string} 결정된 이름.
 */
const determineCulturalSiteName = (tags, sourceId) => {
    if (tags.name) {
        return tags.name;
    } else if (tags.artwork_type) {
        return tags.artwork_type;
    } else if (tags.description) {
        return tags.description;
    } else if (tags.tourism) {
        return tags.tourism;
    } else if (tags.amenity) {
        return tags.amenity;
    } else {
        return `Unnamed Site (ID: ${sourceId})`;
    }
};

/**
 * OSM element의 tags를 기반으로 CulturalSite의 description을 결정합니다.
 * @param {object} tags - OSM element의 tags 객체.
 * @param {string} name - 결정된 CulturalSite의 이름.
 * @returns {string} 결정된 설명.
 */
const determineCulturalSiteDescription = (tags, name) => {
    let description = tags.description || tags.note || tags.long_description || '';
    return description;
};


// 정보 받아왔을 때, 메시지 표시
/**
 * OSM element의 tags 또는 Nominatim 역지오코딩을 통해 CulturalSite의 주소를 결정합니다.
 * @param {object} tags - OSM element의 tags 객체.
 * @param {number} lat - 위도.
 * @param {number} lon - 경도.
 * @param {string} name - CulturalSite의 이름.
 * @param {string} sourceId - OSM element의 sourceId.
 * @returns {Promise<string>} 결정된 주소.
 */
const determineCulturalSiteAddress = async (tags, lat, lon, name, sourceId) => {
    let address = '';
    if (tags['addr:street'] && tags['addr:housenumber']) {
        address = `${tags['addr:street']} ${tags['addr:housenumber']}`;
    } else if (tags['addr:full']) {
        address = tags['addr:full'];
    } else if (tags.address) {
        address = tags.address;
    } else if (tags.street && tags.housenumber) {
        address = `${tags.street} ${tags.housenumber}`;
    }
    if (tags['addr:postcode'] && address) address += `, ${tags['addr:postcode']}`;
    if (tags['addr:city'] && address) address += `, ${tags['addr:city']}`;
    else if (!address && tags.city) address = tags.city;

    // 주소 정보가 없으면 Nominatim API를 통해 역지오코딩 시도
    if (!address && lat && lon) {
        try {
            const nominatimResponse = await axios.get(NOMINATIM_API_URL, {
                params: {
                    lat: lat,
                    lon: lon,
                    format: 'json',
                    'accept-language': 'en',
                    zoom: 18,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'ChemnitzCulturalSitesApp/1.0 (jxuholee@gmail.com)'
                }
            });
            const nominatimData = nominatimResponse.data;

            if (nominatimData && nominatimData.address) {
                const addr = nominatimData.address;
                let inferredAddress = '';

                // 우선순위에 따라 주소 구성
                if (addr.road && addr.house_number) {
                    inferredAddress = `${addr.road} ${addr.house_number}`;
                } else if (addr.road) {
                    inferredAddress = addr.road;
                } else if (addr.building) {
                    inferredAddress = addr.building;
                } else if (addr.hamlet) {
                    inferredAddress = addr.hamlet;
                } else if (addr.village) {
                    inferredAddress = addr.village;
                } else if (addr.town) {
                    inferredAddress = addr.town;
                } else if (addr.city) {
                    inferredAddress = addr.city;
                }

                if (addr.postcode && inferredAddress) inferredAddress += `, ${addr.postcode}`;
                if (addr.city && inferredAddress && addr.city !== inferredAddress) inferredAddress += `, ${addr.city}`;
                else if (!inferredAddress && addr.city) inferredAddress = addr.city;

                if (inferredAddress) {
                    address = inferredAddress;
                    console.log(`Inferred address for ${name} (ID: ${sourceId}): ${address}`);
                }
            }
        } catch (nominatimError) {
            console.warn(`Could not infer address for ${name} (ID: ${sourceId}) at [${lon}, ${lat}]:`, nominatimError.message);
        }
    }
    return address;
};


// reverse geocodig 없이 address를 결정
const determineCulturalSiteAddressFromTags = (tags) => {
    let address = '';
    if (tags['addr:street'] && tags['addr:housenumber']) {
        address = `${tags['addr:street']} ${tags['addr:housenumber']}`;
    } else if (tags['addr:full']) {
        address = tags['addr:full'];
    } else if (tags.address) {
        address = tags.address;
    } else if (tags.street && tags.housenumber) {
        address = `${tags.street} ${tags.housenumber}`;
    }
    if (tags['addr:postcode'] && address) address += `, ${tags['addr:postcode']}`;
    if (tags['addr:city'] && address) address += `, ${tags['addr:city']}`;
    else if (!address && tags.city) address = tags.city;
    return address;
};

/**
 * OSM element의 tags를 기반으로 CulturalSite의 카테고리를 매핑합니다.
 * @param {object} tags - OSM element의 tags 객체.
 * @returns {string} 매핑된 카테고리.
 * @throws {AppError} - 유효한 카테고리를 결정할 수 없는 경우.
 */
const mapCulturalSiteCategory = (tags) => {
    // 카테고리 매핑 (원하는 카테고리 목록에 맞춰 조정) - 새로운 로직 적용
    let mappedCategory = 'other';
    const amenity = tags.amenity;
    const tourism = tags.tourism;

    if (amenity && tourism) {
        // amenity와 tourism 필드가 모두 존재할 때
        if (amenity === 'restaurant' || amenity === 'Restaurant') {
            mappedCategory = 'restaurant'; // amenity='restaurant'일 때 우선
        } else if (tourism === 'artwork' || tourism === 'Artwork') {
            mappedCategory = 'artwork';
        }
    } else if (amenity) {
        // amenity만 존재할 때
        mappedCategory = amenity.toLowerCase();
    } else if (tourism) {
        // tourism만 존재할 때
        mappedCategory = tourism.toLowerCase();
    }

    const allowedCategories = CULTURAL_CATEGORY; // culturalSiteConfig에서 임포트한 CULTURAL_CATEGORY 사용
    if (!allowedCategories.includes(mappedCategory)) {
        mappedCategory = 'other';
    }

    // 이 부분에서 유효하지 않은 카테고리인 경우 AppError를 throw하는 로직을 제거했습니다.
    // 대신 'other'로 매핑되도록 변경되었습니다.
    return mappedCategory;
};

/**
 * OSM element 객체를 CulturalSite 스키마에 맞는 데이터 형식으로 변환합니다.
 * @param {Object} osmElement - Overpass API에서 받은 단일 OSM element 객체.
 * @returns {Promise<object>} culturalSiteData - CulturalSite 스키마에 맞는 데이터 객체.
 * @throws {AppError} - 필수 필드 누락 또는 유효하지 않은 데이터인 경우.
 */
const processOsmElementForCulturalSite = async (osmElement, performReverseGeocoding = true) => { // Added new parameter with default true
    const { type, id, tags } = osmElement;

    // 1. sourceId 생성
    const sourceId = `${type}/${id}`;

    // 2. OSM 타입에 따라 위도(lat)와 경도(lon) 추출
    let lat, lon;
    // 1. 최우선 순위: 'center' 객체 내부에 lat/lon 필드가 있는 경우 (out center; 옵션의 결과)
    if (osmElement.center && typeof osmElement.center.lat === 'number' && typeof osmElement.center.lon === 'number') {
        lat = osmElement.center.lat;
        lon = osmElement.center.lon;
    }
    // 2. 다음 순위: OSM element에 lat/lon 필드가 직접 있는 경우 (주로 Node 타입)
    else if (typeof osmElement.lat === 'number' && typeof osmElement.lon === 'number') {
        lat = osmElement.lat;
        lon = osmElement.lon;
    }
    // 3. 다음 순위: geometry 필드가 있고 길이가 0보다 큰 경우
    else if (osmElement.geometry && osmElement.geometry.length > 0) {
        lat = osmElement.geometry[0].lat;
        lon = osmElement.geometry[0].lon;
    }
    // 4. 마지막 순위: bounds 필드가 있는 경우 (중심점 계산)
    else if (osmElement.bounds) {
        lat = (osmElement.bounds.minlat + osmElement.bounds.maxlat) / 2;
        lon = (osmElement.bounds.minlon + osmElement.bounds.maxlon) / 2;
    }

    // 어떤 위치 정보도 찾지 못했을 경우의 디버그 로그 및 에러
    if (!(typeof lat === 'number' && typeof lon === 'number')) {
        console.warn(`[DEBUG] Element ${sourceId} (type: ${type}) has no valid lat/lon, geometry, or bounds after all checks. Full element:`, JSON.stringify(osmElement, null, 2));
        throw new AppError(`Could not find valid location information for element ${sourceId} (type: ${type}). (No lat/lon, geometry, bounds)`, 400);
    }

    // 3. 위/경도 유효성 검사
    if (!lat || !lon) {
        throw new AppError(`Skipping element ${sourceId} due to missing coordinates.`, 400);
    }
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    // 4. CulturalSite 필드 결정
    const name = determineCulturalSiteName(tags, sourceId);
    const description = determineCulturalSiteDescription(tags, name);
    // Conditionally call determineCulturalSiteAddress based on the flag
    const address = performReverseGeocoding
        ? await determineCulturalSiteAddress(tags, parsedLat, parsedLon, name, sourceId)
        : determineCulturalSiteAddressFromTags(tags); // New helper to only get address from tags
    const category = mapCulturalSiteCategory(tags); // 변경된 카테고리 매핑 로직 적용

    // 5. 필수 필드 최종 확인
    if (!name || !category || isNaN(parsedLat) || isNaN(parsedLon) || !sourceId) {
        throw new AppError('Essential cultural heritage information (name, category, location, sourceId) cannot be extracted from OSM data.', 400);
    }

    return {
        name,
        description,
        category,
        location: {
            type: 'Point',
            coordinates: [parsedLon, parsedLat]
        },
        address,
        website: tags.website || tags.url || '',
        imageUrl: tags.image || tags.thumbnail || '',
        openingHours: tags.opening_hours || '',
        licenseInfo: "Data © OpenStreetMap contributors, ODbL.",
        sourceId: sourceId,
        originalTags: tags,
    };
};

module.exports = {
    processOsmElementForCulturalSite,
};