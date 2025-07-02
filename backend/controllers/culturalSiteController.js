const CulturalSite = require('../models/CulturalSite');
const Review = require('../models/Review')
const User = require('../models/User')
const ExcludeSourceId = require('../models/ExcludeSourceId');
const asyncHandler = require('../utils/asyncHandler')
const mongoose = require('mongoose')
const AppError = require('../utils/AppError')
const { addSourceIdToExclusion } = require('../services/excludeSourceIdService');
const { isPointInChemnitz, isValidLatLng } = require('../utils/locationUtils')
const { extendedCulturalSiteQuery } = require('../config/osmData');
const { queryOverpass } = require('../services/overpassService')
const { processOsmElementForCulturalSite } = require('../utils/osmDataProcessor');
const { CULTURAL_SITE_UPDATABLE_FIELDS, CULTURAL_CATEGORY } = require('../config/culturalSiteConfig');

const getAllCulturalSites = asyncHandler(async (req, res, next) => {
    // 1. Initialize aggregation pipeline
    let pipeline = [];

    // --- Calculate additional fields in the aggregation pipeline (rating, review count) ---
    // 2. Join review data to calculate average rating and review count
    pipeline.push(
        {
            $lookup: {
                from: 'reviews', // Collection name for Review model (lowercase, plural)
                localField: 'reviews', // 'reviews' field of CulturalSite
                foreignField: '_id', // '_id' field of Review
                as: 'reviewsData' // Field name to store joined review data
            }
        },
        {
            $addFields: {
                averageRating: { $ifNull: [{ $avg: '$reviewsData.rating' }, 0] },
                reviewCount: { $size: '$reviewsData' } // Calculate review count
            }
        }
    );

    // 3. Add sorting functionality (by rating, favorites, review count)
    // http://localhost:5000/api/v1/cultural-sites?sort=averageRating,-favoritesCount,reviewCount
    let sortStage = {};
    if (req.query.sort) {
        const sortByFields = req.query.sort.split(','); // Split by comma
        sortByFields.forEach(field => {
            field = field.trim();
            if (field.startsWith('-')) {
                sortStage[field.substring(1)] = -1; // Descending
            } else {
                sortStage[field] = 1; // Ascending
            }
        });
    } else {
        // Default sort: latest first
        sortStage = { createdAt: -1 };
    }
    pipeline.push({ $sort: sortStage });

    // 4. Pagination (calculate total count beforehand)
    // Pattern to get total count and actual data together in an aggregation pipeline (Recommended!)
    // Currently, the limit is temporarily set to 1000. If exceeded, viewport-based rendering, etc., is required.
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const totalResultsPipeline = [...pipeline]; // Copy current filtering pipeline
    totalResultsPipeline.push({ $count: 'total' }); // Add stage to count total results

    let totalResultDoc = await CulturalSite.aggregate(totalResultsPipeline);
    const totalResults = totalResultDoc.length > 0 ? totalResultDoc[0].total : 0;
    const totalPages = Math.ceil(totalResults / limit);

    // Add pagination stages for actual data retrieval
    pipeline.push(
        { $skip: skip },
        { $limit: limit }
    );

    // 8. Final field selection ($project) - include only necessary fields
    pipeline.push({
        $project: {
            name: 1,
            description: 1,
            category: 1,
            location: 1,
            address: 1,
            website: 1,
            imageUrl: 1,
            openingHours: 1,
            licenseInfo: 1,
            sourceId: 1,
            favoritesCount: 1,
            proposedBy: 1,
            registeredBy: 1,
            createdAt: 1,
            updatedAt: 1,
            averageRating: 1, // Include calculated average rating
            reviewCount: 1 // Include calculated review count
        }
    });

    const culturalSites = await CulturalSite.aggregate(pipeline);

    res.status(200).json({
        status: 'success',
        results: culturalSites.length, // Number of documents on the current page
        totalResults: totalResults, // Total number of documents matching all search criteria
        page: page,
        totalPages: totalPages,
        limit: limit,
        data: {
            culturalSites: culturalSites
        }
    });
});

const getCulturalSiteById = asyncHandler(async (req, res, next) => {
    const siteId = req.params.id;

    // 클라이언트에서 전달받는 정렬 기준 파라미터 (예: ?reviewSort=newest, ?reviewSort=highestRating, ?reviewSort=lowestRating)
    const reviewSortParam = req.query.reviewSort || 'newest'; // 기본값은 최신순

    // 1. 유효한 ObjectId인지 확인 (선택 사항이지만 좋은 습관)
    if (!mongoose.isObjectIdOrHexString(siteId)) { // mongoose.isObjectIdOrHexString를 사용하여 유효성 검사 강화
        return next(new AppError('Not valid Id.', 400));
    }

    const pipeline = [
        {
            $match: { _id: mongoose.Types.ObjectId.createFromHexString(siteId) } // 특정 _id와 일치하는 문서 찾기
        },
        {
            $lookup: {
                from: 'reviews', // Review 모델의 컬렉션 이름 (소문자, 복수형)
                localField: 'reviews', // CulturalSite의 reviews 필드 (ObjectId 배열)
                foreignField: '_id', // Review의 _id 필드
                as: 'reviewsData' // 조인된 리뷰 데이터가 저장될 임시 필드
            }
        },
         // 리뷰 데이터 배열을 개별 문서로 분리합니다. 리뷰가 없어도 문화유산 문서가 유지되도록 합니다.
        {
            $unwind: {
                path: '$reviewsData',
                preserveNullAndEmptyArrays: true // 리뷰가 없는 경우에도 문화유산 문서가 유지되도록
            }
        },
        {
            $lookup: {
                from: 'users', // User 모델의 컬렉션 이름
                localField: 'reviewsData.user', // reviewsData의 user 필드
                foreignField: '_id', // User의 _id 필드
                as: 'reviewsData.userPopulated' // 조인된 유저 정보가 저장될 필드
            }
        },
        {
            $unwind: {
                path: '$reviewsData.userPopulated',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                // reviewsData에 userPopulated의 원하는 필드만 복사
                'reviewsData.user': {
                    _id: '$reviewsData.userPopulated._id',
                    username: '$reviewsData.userPopulated.username',
                    profileImage: '$reviewsData.userPopulated.profileImage'
                }
            }
        },
        {
            $group: {
                _id: '$_id', // culturalSite의 _id로 그룹화
                name: { $first: '$name' },
                description: { $first: '$description' },
                category: { $first: '$category' },
                location: { $first: '$location' },
                address: { $first: '$address' },
                website: { $first: '$website' },
                imageUrl: { $first: '$imageUrl' },
                openingHours: { $first: '$openingHours' },
                licenseInfo: { $first: '$licenseInfo' },
                sourceId: { $first: '$sourceId' },
                favoritesCount: { $first: '$favoritesCount' },
                proposedBy: { $first: '$proposedBy' },
                registeredBy: { $first: '$registeredBy' },
                createdAt: { $first: '$createdAt' },
                updatedAt: { $first: '$updatedAt' },
                // 리뷰 정보 다시 배열로 모으기 (정렬 옵션 적용 전)
                reviews: {
                    $push: {
                        $cond: {
                            if: { $ne: ['$reviewsData', null] }, // reviewsData가 null이 아닌 경우에만 push
                            then: {
                                _id: '$reviewsData._id',
                                rating: '$reviewsData.rating',
                                comment: '$reviewsData.comment',
                                createdAt: '$reviewsData.createdAt',
                                user: '$reviewsData.user'
                            },
                            else: '$$REMOVE' // null인 경우 제거
                        }
                    }
                }
            }
        },
        // 리뷰 배열 정리 (null/빈 객체 제거)
        {
            $addFields: {
                reviews: {
                    $filter: {
                        input: '$reviews',
                        as: 'review',
                        cond: { $ne: ['$$review', null] }
                    }
                }
            }
        }
    ];

    // 리뷰 정렬 로직 추가
    let reviewSortOrder = {};
    if (reviewSortParam === 'newest') {
        reviewSortOrder = { createdAt: -1 }; // 최신순
    } else if (reviewSortParam === 'highestRating') {
        reviewSortOrder = { rating: -1 }; // 평점 높은 순
    } else if (reviewSortParam === 'lowestRating') {
        reviewSortOrder = { rating: 1 }; // 평점 낮은 순
    } else {
        reviewSortOrder = { createdAt: -1 }; // 기본값
    }

    pipeline.push(
        {
            $addFields: {
                reviews: {
                    $sortArray: {
                        input: '$reviews',
                        sortBy: reviewSortOrder // 동적으로 정렬 기준 적용
                    }
                }
            }
        },
        // 최종적으로 averageRating과 reviewCount 계산
        {
            $addFields: {
                averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
                reviewCount: { $size: '$reviews' }
            }
        },
        {
            $project: { // 최종 결과 문서에 포함될 필드들을 선택.
                name: 1,
                description: 1,
                category: 1,
                location: 1,
                address: 1,
                website: 1,
                imageUrl: 1,
                openingHours: 1,
                licenseInfo: 1,
                sourceId: 1,
                favoritesCount: 1,
                proposedBy: 1,
                registeredBy: 1,
                createdAt: 1,
                updatedAt: 1,
                reviews: 1, // 리뷰 데이터도 함께 반환
                averageRating: 1,
                reviewCount: 1
            }
        }
    );

    const culturalSite = await CulturalSite.aggregate(pipeline);

    // --- 여기부터 백엔드 응답 직전 JavaScript를 이용한 데이터 후처리 ---
    // reviews배열이 비어있을 경우, reviews: [user: {}]가 반환되는 문제 해결하기 위함.
    // aggregation pipeline으로 해결하려 했으나, 실패함. 아래 js를 통해 조작하는 방법은 차선책.
    let finalCulturalSite = culturalSite[0];

    // 1. reviews 배열 필터링: _id가 없거나 user._id가 없는 리뷰 제거
    // reviews: [{ user: {} }] 와 같은 형태를 걸러냅니다.
    if (finalCulturalSite.reviews && finalCulturalSite.reviews.length > 0) {
        finalCulturalSite.reviews = finalCulturalSite.reviews.filter(review =>
            review && review._id && review.user && review.user._id // 리뷰 객체, 리뷰 _id, user 객체, user _id 모두 유효해야 함
        );
    } else {
        // reviews 배열 자체가 없거나 비어있는 경우를 대비 (null 대신 빈 배열로 초기화)
        finalCulturalSite.reviews = [];
    }

    // 2. 필터링된 reviews 배열을 기반으로 averageRating 및 reviewCount 재계산
    if (finalCulturalSite.reviews.length > 0) {
        const totalRating = finalCulturalSite.reviews.reduce((sum, review) => sum + review.rating, 0);
        finalCulturalSite.averageRating = parseFloat((totalRating / finalCulturalSite.reviews.length).toFixed(1));
        finalCulturalSite.reviewCount = finalCulturalSite.reviews.length;
    } else {
        finalCulturalSite.averageRating = 0;
        finalCulturalSite.reviewCount = 0;
    }
    // --- 후처리 끝 ---

    res.status(200).json({
        status: 'success',
        data: {
            culturalSite: finalCulturalSite  // aggregate는 배열을 반환하므로 첫 번째 요소 사용
        }
    });
})

const updateCulturalSiteById = asyncHandler(async (req, res, next) => {
    // 1. 관리자 권한 확인
    if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('You do not have permission to edit cultural heritage. Only administrators can do so.', 403));
    }

    // 2. 수정 허용된 필드만 추출하여 updateData 구성
    const updateData = {};
    for (const field of CULTURAL_SITE_UPDATABLE_FIELDS) {
        // req.body에 해당 필드가 정의되어 있고 null이 아니라면 (null은 업데이트 시키고 싶지 않은 경우)
        if (req.body[field] !== undefined) {
            updateData[field] = req.body[field];
        }
    }

    // 3. 각 필드에 대한 추가 유효성 검사 (Mongoose Validator 외에 여기서 미리 처리할 수도 있습니다.)
    // 예: category 필드가 CULTURAL_CATEGORY enum에 있는지 수동 검사
    if (updateData.category && !CULTURAL_CATEGORY.includes(updateData.category)) {
        return next(new AppError(`Invalid category value: ${updateData.category}`, 400));
    }
    // name 필드의 길이 검사 (Mongoose validator가 있지만, 클라이언트에게 더 빠른 피드백을 줄 수 있음)
    if (updateData.name && (updateData.name.length < 2 || updateData.name.length > 100)) {
        return next(new AppError('Name must be between 2 and 100 characters long.', 400));
    }
    // description 필드의 길이 검사
    if (updateData.description && updateData.description.length > 1000) {
        return next(new AppError('Description cannot exceed 1000 characters.', 400));
    }

    // 4. 업데이트할 필드가 없는 경우
    if (Object.keys(updateData).length === 0) {
        return next(new AppError('The field to be updated is not provided or is invalid.', 400));
    }

    // 5. CulturalSite 문서 업데이트
    // { new: true } : 업데이트 후의 문서를 반환합니다.
    // { runValidators: true } : 스키마에 정의된 유효성 검사(minlength, maxlength, enum 등)를 실행합니다.
    const culturalSite = await CulturalSite.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
        // true로 설정하면 updateData에 없는 필드들도 기본값으로 설정됩니다.
        // 하지만 여기서는 updateData에 명시적으로 추가된 필드만 업데이트하므로 default 옵션은 기본값으로 둡니다.
    });

    // 6. 문서가 존재하지 않는 경우 처리
    if (!culturalSite) {
        return next(new AppError('No cultural heritage with that ID found.', 404));
    }

    // 7. 성공 응답 반환
    res.status(200).json({
        status: 'success',
        message: 'Cultural heritage information has been successfully updated.',
        data: {
            culturalSite // 업데이트된 문화유산 정보를 응답
        }
    });
});

const deleteCulturalSiteById = asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('문화유산을 직접 등록할 권한이 없습니다. 관리자만 가능합니다.', 403));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const culturalSite = await CulturalSite.findById(req.params.id).session(session);

        if (!culturalSite) {
            await session.abortTransaction();
            return next(new AppError('해당 ID를 가진 문화유산이 없습니다.', 404));
        }
        // CulturalSite 삭제
        await CulturalSite.findByIdAndDelete(req.params.id, { session });

        // 관련 리뷰 삭제 및 사용자 리뷰 목록에서 제거
        if (culturalSite.reviews && culturalSite.reviews.length > 0) {
            await Review.deleteMany({ culturalSite: culturalSite._id }, { session });
            const usersWithDeletedReviews = await User.find({ reviews: { $in: culturalSite.reviews } }).session(session);
            for (const userDoc of usersWithDeletedReviews) {
                await User.findByIdAndUpdate(
                    userDoc._id,
                    { $pullAll: { reviews: culturalSite.reviews } },
                    { session }
                );
            }
        }

        // 사용자 즐겨찾기 목록에서 문화유산 제거
        await User.updateMany(
            { favoriteSites: req.params.id },
            { $pull: { favoriteSites: req.params.id } },
            { session }
        );

        // ExcludeSourceId에 sourceId 추가
        await addSourceIdToExclusion(culturalSite.sourceId, session);

        await session.commitTransaction();

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('문화유산 삭제 트랜잭션 실패:', error);

        // `addSourceIdToExclusion`에서 발생할 수 있는 중복 키 오류 처리
        if (error.code === 11000) {
            return next(new AppError('제외 목록에 이미 존재하는 ID입니다.', 409));
        }

        return next(new AppError('문화유산 삭제 중 오류가 발생했습니다.', 500));
    } finally {
        session.endSession();
    }
});

/**
 * 클라이언트에서 전달된 위/경도를 기준으로 주위 50m 내에 있는 OSM 장소들을 반환합니다.
 * extendedQuery를 사용한다.
 * CulturalSite 배열을 반환한다.(osm을 가공함)
 * GET /api/v1/cultural-sites/nearby-osm?lat={latitude}&lon={longitude}
 */
const getNearbyOsmCulturalSites = asyncHandler(async (req, res, next) => {
    const { lon, lat, noReverseGeocode } = req.query; // Added noReverseGeocode query parameter

    // Determine the flag for reverse geocoding
    // If noReverseGeocode is 'true' (string), then set performReverseGeocoding to false.
    // Otherwise, it defaults to true.
    const performReverseGeocoding = noReverseGeocode !== 'true';

    // 1. 위/경도 유효성 검사
    if (!isValidLatLng(lon, lat)) {
        return next(new AppError('Effective latitude and longitude query parameters are required.', 400));
    }

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    const radius = 50; // 50m 반경 (Overpass 쿼리에 사용)

    // 2. Chemnitz 시 경계 내부 확인 (선택 사항)
    try {
        if (!isPointInChemnitz(parsedLat, parsedLon)) {
            return next(new AppError('Since the input location is not inside the boundary when Chemnitz, the surrounding OSM cultural heritage cannot be searched.', 400));
        }
    } catch (error) {
        return next(new AppError(`Error occurs during location validation: ${error.message}`, 500));
    }

    // 3. Overpass 쿼리 생성
    const overpassQuery = extendedCulturalSiteQuery(radius, parsedLat, parsedLon);

    // 4. Overpass API 호출
    let osmData;
    try {
        osmData = await queryOverpass(overpassQuery);
    } catch (error) {
        return next(new AppError(`Failed to bring about the surrounding OSM cultural site information: ${error.message}`, 500));
    }

    const osmElements = osmData.elements || [];

    // Pass the performReverseGeocoding flag to the mapping function
    const processedSitesPromises = osmElements.map(el => processOsmElementForCulturalSite(el, performReverseGeocoding));

    let processedSites;
    try {
        processedSites = await Promise.all(processedSitesPromises);
        processedSites = processedSites.filter(site =>
            site !== null && !site.name.startsWith("Unnamed Site (ID:")
        );
    } catch (error) {
        return next(new AppError(`Errors occur during cultural heritage data processing: ${error.message}`, 500));
    }

    // 5. Filter out sites already in your CulturalSite DB ---
    const osmSourceIds = processedSites.map(site => site.sourceId).filter(Boolean); // sourceId가 있는 것만 추출

    let existingCulturalSites = [];
    if (osmSourceIds.length > 0) {
        try {
            // MongoDB에서 해당 sourceId를 가진 CulturalSite들을 찾습니다.
            // CulturalSite 모델에 sourceId 필드가 있다고 가정합니다.
            existingCulturalSites = await CulturalSite.find({
                sourceId: { $in: osmSourceIds }
            }).select('sourceId'); // sourceId만 가져와서 효율성을 높입니다.
        } catch (error) {
            return next(new AppError(`Errors occur during existing cultural site information request: ${error.message}`, 500));
        }
    }

    // 기존 문화재의 sourceId를 Set으로 만들어 빠른 조회를 가능하게 합니다.
    const existingSourceIdsSet = new Set(existingCulturalSites.map(site => site.sourceId));

    // 6. 데이터베이스에 없는 OSM 문화재만 필터링
    const uniqueProcessedSites = processedSites.filter(site =>
        !existingSourceIdsSet.has(site.sourceId)
    );

    // 7. 결과 반환 (단계 번호 조정)
    res.status(200).json({
        status: 'success',
        results: uniqueProcessedSites.length,
        data: {
            osmCulturalSites: uniqueProcessedSites
        }
    });
});

/**
 * CulturalSite 스키마 형식으로 이미 가공된 데이터를 받아서 DB에 저장합니다.
 * 이 함수는 `processAndPreviewOsmCulturalSite`의 결과 또는 클라이언트가 직접 생성한 가공된 데이터를 받습니다.
 * POST /api/v1/cultural-sites/save-processed
 * Request Body: { ... culturalSiteData (CulturalSite Schema compliant) ... }
 */
const saveCulturalSiteToDb = asyncHandler(async (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('가공된 문화유산을 DB에 저장할 권한이 없습니다. 관리자만 가능합니다.', 403));
    }

    const culturalSiteData = req.body; // 이미 CulturalSite 스키마에 맞는 형식이라고 가정

    console.log(culturalSiteData);


    // 필수 필드 존재 여부 재확인 (방어적 코딩)
    if (!culturalSiteData.name || !culturalSiteData.category || !culturalSiteData.location ||
        !Array.isArray(culturalSiteData.location.coordinates) || culturalSiteData.location.coordinates.length !== 2 ||
        !culturalSiteData.sourceId) {
        return next(new AppError('저장할 문화유산 데이터의 필수 필드가 누락되었거나 형식이 올바르지 않습니다.', 400));
    }

    const [parsedLon, parsedLat] = culturalSiteData.location.coordinates;

    // 1. Chemnitz 시 경계 내부 확인 (DB 저장 시 최종 검증)
    try {
        if (!isPointInChemnitz(parsedLat, parsedLon)) {
            return next(new AppError('입력된 위치가 Chemnitz 시 경계 내부에 있지 않습니다. Chemnitz 내의 문화유산만 등록 가능합니다.', 400));
        }
    } catch (error) {
        return next(new AppError(`위치 유효성 검사 중 오류 발생: ${error.message}`, 500));
    }

    // 2. sourceId 중복 검사 (DB에 이미 있는지)
    const existingCulturalSite = await CulturalSite.findOne({ sourceId: culturalSiteData.sourceId });
    if (existingCulturalSite) {
        return next(new AppError(`sourceId '${culturalSiteData.sourceId}'는 이미 등록된 문화유산입니다.`, 409));
    }

    // 3. sourceId가 제외 목록(ExcludeSourceId)에 있는지 확인
    const isExcluded = await ExcludeSourceId.findOne({ sourceId: culturalSiteData.sourceId });
    if (isExcluded) {
        return next(new AppError(`sourceId '${culturalSiteData.sourceId}'는 등록이 금지된 목록에 있습니다.`, 403));
    }

    // 4. CulturalSite 인스턴스 생성 및 저장
    try {
        const newCulturalSite = await CulturalSite.create({
            ...culturalSiteData,
            registeredBy: req.user.id // 누가 등록했는지 기록
        });

        res.status(201).json({
            status: 'success',
            message: '가공된 문화유산이 성공적으로 DB에 저장되었습니다.',
            data: {
                culturalSite: newCulturalSite
            }
        });
    } catch (error) {
        console.error('Error saving processed cultural site to DB:', error);
        if (error.code === 11000) {
            return next(new AppError(`데이터베이스 저장 중 중복 오류가 발생했습니다: ${error.message}`, 409));
        }
        return next(new AppError(`가공된 문화유산 저장 중 오류 발생: ${error.message}`, 500));
    }
});




module.exports = {
    getAllCulturalSites,
    getCulturalSiteById,
    saveCulturalSiteToDb,
    updateCulturalSiteById,
    deleteCulturalSiteById,
    getNearbyOsmCulturalSites
}