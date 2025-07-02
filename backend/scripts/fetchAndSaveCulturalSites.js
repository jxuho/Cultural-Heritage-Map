/**
 * OSM에 query를 적용해서 geojson파일을 가지고온다.
 */
const fs = require('fs');
const path = require('path');

const {baseCulturalSiteQuery} = require('../config/osmData')
const { queryOverpass } = require('../services/overpassService');

async function fetchAndSaveCulturalSites() {
    console.log('Starting to import Chemnitz cultural sites data from Overpass API...');
    const OVERPASS_QUERY = baseCulturalSiteQuery();
    try {
        const osmData = await queryOverpass(OVERPASS_QUERY);
        const fileName = `chemnitz_cultural_sites_${Date.now()}.json`;
        const filePath = path.join(__dirname, '../data', fileName); // 'data' 폴더에 저장

        // 'data' 폴더가 없으면 생성
        const dataDir = path.join(__dirname, '../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFile(filePath, JSON.stringify(osmData, null, 2), (err) => {
            if (err) {
                console.error('An error occurred while saving the file:', err);
            } else {
                console.log(`OSM data was successfully saved to ${filePath}.`);
                console.log(`A total of ${osmData.elements ? osmData.elements.length : 0} cultural sites were retrieved.`);
            }
        });

    } catch (error) {
        console.error('Error occurred while calling Overpass API:', error.message);
        if (error.response) {
            console.error('Response Status Code:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// 함수 실행
fetchAndSaveCulturalSites();