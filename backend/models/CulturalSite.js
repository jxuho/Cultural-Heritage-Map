// backend/models/culturalSite.js
const mongoose = require('mongoose');
const {CULTURAL_CATEGORY} = require('../config/culturalSiteConfig')


const culturalSiteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, '이름은 최소 2자 이상이어야 합니다.'],
        maxlength: [100, '이름은 최대 100자를 초과할 수 없습니다.']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, '설명은 최대 1000자를 초과할 수 없습니다.']
    },
    category: {
        type: String,
        enum: CULTURAL_CATEGORY,
        required: true,
        trim: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'], // GeoJSON Point 타입
            required: true
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            index: '2dsphere', // 지리 공간 쿼리를 위한 인덱스
            validate: {
                validator: function (v) {
                    return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
                },
                message: '위치 좌표(경도, 위도)가 유효한 범위에 있지 않습니다. 경도는 -180~180, 위도는 -90~90.'
            }
        },
    },
    address: {
        type: String,
        trim: true,
        required: true
    },
    website: {
        type: String,
        trim: true,
    },
    imageUrl: {
        type: String,
        trim: true
    },
    openingHours: {
        type: String,
        trim: true
    },
    licenseInfo: {
        type: String,
        default: "Data © OpenStreetMap contributors, ODbL.", // 기본 라이선스 정보
        trim: true
    },
    sourceId: { // Overpass API의 OSM ID (node/way/relation ID)
        type: String,
        required: true,
        unique: true, // 중복 방지
        trim: true
    },
    reviews: [{ // 이 문화 유적지에 대한 모든 리뷰를 저장하는 배열
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    favoritesCount: { // 이 문화 유적지를 즐겨찾기에 추가한 사용자 수
        type: Number,
        default: 0,
        min: 0
    },
    // 원본 GeoJSON 데이터의 'properties' 객체를 그대로 저장하여 데이터 보존
    originalTags: {
        type: mongoose.Schema.Types.Mixed, // 유연한 스키마 타입
        required: true
    },
    proposedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    registeredBy: { // 이 문화 유적지를 등록한 admin ID
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    active: { // 소프트 삭제용 필드. 구현 안됨.
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true // createdAt, updatedAt 타임스탬프 자동 추가
});


module.exports = mongoose.model('CulturalSite', culturalSiteSchema);