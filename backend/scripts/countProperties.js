/**
 * geojson파일의 properties 필드가 가지고 있는 필드의 종류와 개수를 카운트하는 함수.
 * A function that counts the types and number of fields contained in the properties field of a geojson file.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data', 'FILENAME.geojson');

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err);
        return;
    }

    try {
        const geojson = JSON.parse(data);
        const propertyCounts = {};

        if (Array.isArray(geojson)) { // If it's an array of features
            geojson.forEach(feature => {
                if (feature.properties && typeof feature.properties === 'object') {
                    for (const propName in feature.properties) {
                        if (feature.properties.hasOwnProperty(propName)) {
                            propertyCounts[propName] = (propertyCounts[propName] || 0) + 1;
                        }
                    }
                }
            });
        }
        else if (geojson.features && Array.isArray(geojson.features)) { // If it's a FeatureCollection
            geojson.features.forEach(feature => {
                if (feature.properties && typeof feature.properties === 'object') {
                    for (const propName in feature.properties) {
                        if (feature.properties.hasOwnProperty(propName)) {
                            propertyCounts[propName] = (propertyCounts[propName] || 0) + 1;
                        }
                    }
                }
            });
        }

        // Sort the properties by their count in descending order
        const sortedPropertyCounts = Object.entries(propertyCounts).sort(([, countA], [, countB]) => countB - countA);

        console.log("Property counts across all features:");
        sortedPropertyCounts.forEach(([propName, count]) => {
            console.log(`  '${propName}': ${count} times`);
        });
        console.log(`Total number of properties: ${sortedPropertyCounts.length}`);


    } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
    }
});