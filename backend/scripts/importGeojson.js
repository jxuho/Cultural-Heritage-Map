// importGeojson.js
require('dotenv').config();
const fsAsync = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const CulturalSite = require('../models/CulturalSite'); // CulturalSite 모델 경로
const { processOsmElementForCulturalSite } = require('../utils/osmDataProcessor');

/**
 * turbo가 아닌, osm api에서 받아온 정보(elements)를 mongodb에 저장하는 함수.
 * /backend/data 내부의 최신 chemnitz_cultural_sites_[시간].geojson을 가지고온다.
 * @param {boolean} performReverseGeocoding - 역지오코딩을 수행할지 여부 (true/false).
 * node scripts/importGeojson.js
 * node scripts/importGeojson.js --no-reverse-geocode
 */
const importGeojson = async (performReverseGeocoding) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
        const dataPath = await getLatestCulturalSitesFile();
        if (!dataPath) {
            console.error('No valid GeoJSON file found.');
            return;
        }
        const raw = await fsAsync.readFile(dataPath, 'utf8');
        const geojson = JSON.parse(raw);

        const culturalSitesToInsert = [];

        // overpass-turbo (GeoJSON FeatureCollection)
        if (geojson.features) {
            for (const feature of geojson.features) {
                const properties = feature.properties;
                const geometry = feature.geometry;
                const osmElementLike = {
                    type: properties['@type'] || 'unknown',
                    id: properties['@id'] || feature.id,
                    geometry: {
                        type: geometry.type,
                        coordinates: geometry.coordinates // [lon, lat]
                    },
                    tags: properties
                };

                if (!osmElementLike.id || !osmElementLike.geometry || !osmElementLike.geometry.coordinates) {
                    console.warn('Skipping feature due to missing sourceId or geometry:', JSON.stringify(feature));
                    continue;
                }
                try {
                    // processOsmElementForCulturalSite를 사용하여 데이터 가공
                    // 여기에 인자를 직접 전달합니다.
                    const culturalSiteData = await processOsmElementForCulturalSite(osmElementLike, performReverseGeocoding);
                    culturalSitesToInsert.push(culturalSiteData);
                } catch (error) {
                    console.warn(`Error processing GeoJSON element ${osmElementLike.id}: ${error.message}`);
                }
            }
        } else {
            // Overpass API (elements)
            for (const element of geojson.elements) {
                if (!element.type || !element.id) {
                    console.warn('Skipping element due to missing sourceId or geometry:', JSON.stringify(element));
                    continue;
                }
                try {
                    // processOsmElementForCulturalSite를 사용하여 데이터 가공
                    // 여기에 인자를 직접 전달합니다.
                    const culturalSiteData = await processOsmElementForCulturalSite(element, performReverseGeocoding);
                    culturalSitesToInsert.push(culturalSiteData);
                } catch (error) {
                    console.warn(`Error processing GeoJSON element ${element.id}: ${error.message}`);
                }
            }
        }

        await CulturalSite.deleteMany({});
        console.log('Existing CulturalSites deleted.');

        const result = await CulturalSite.insertMany(culturalSitesToInsert, { ordered: false });
        console.log(`Successfully inserted ${result.length} CulturalSites.`);

    } catch (error) {
        console.error('Error importing data:', error);
        if (error.writeErrors) {
            console.error('Write Errors:', error.writeErrors.map(e => e.errmsg));
        }
    } finally {
        mongoose.disconnect();
        console.log('MongoDB Disconnected.');
    }
};

async function getLatestCulturalSitesFile() {
    const dataDir = path.join(__dirname, '../data');
    const fileNamePattern = /^chemnitz_cultural_sites_(\d{13})\.(geo)?json$/;

    try {
        const files = await fsAsync.readdir(dataDir);
        let latestFile = null;
        let latestTimestamp = 0;

        for (const file of files) {
            const match = file.match(fileNamePattern);
            if (match) {
                const timestampPart = parseInt(match[1], 10);
                if (timestampPart > latestTimestamp) {
                    latestTimestamp = timestampPart;
                    latestFile = file;
                }
            }
        }

        if (latestFile) {
            const latestFilePath = path.join(dataDir, latestFile);
            console.log(`Found the latest cultural sites file: ${latestFilePath}`);
            return latestFilePath;
        } else {
            console.warn('No recent "chemnitz_cultural_sites_TIMESTAMP.json" files found in the data directory.');
            return null;
        }
    } catch (error) {
        console.error('Error while searching for the latest cultural sites file:', error);
        throw error;
    }
}

// 명령줄 인자 처리: --no-reverse-geocode 플래그 확인
const args = process.argv.slice(2); // node, importGeojson.js 다음의 인자들
const shouldPerformReverseGeocoding = !args.includes('--no-reverse-geocode');

// importGeojson 함수를 호출하면서 결정된 인자를 전달합니다.
importGeojson(shouldPerformReverseGeocoding);