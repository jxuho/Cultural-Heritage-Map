// backend/controllers/reviewController.js
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const CulturalSite = require('../models/CulturalSite'); // CulturalSite 모델 임포트
const User = require('../models/User')
const mongoose = require('mongoose');

// 모든 리뷰 조회 (필터링 및 정렬 가능)
const getAllReviews = asyncHandler(async (req, res, next) => {
    let filter = {};
    const CulturalSite = require('../models/CulturalSite'); // CulturalSite 모델을 가져와야 합니다.
    const mongoose = require('mongoose'); // mongoose를 가져와 isObjectIdOrHexString을 사용합니다.


    // 1. req.params.culturalSiteId가 있는 경우 문화유산 존재 여부 확인
    if (req.params.culturalSiteId) {
        // ID 유효성 검사
        if (!mongoose.isObjectIdOrHexString(req.params.culturalSiteId)) {
            return next(new AppError('id is not valid.', 400));
        }

        const culturalSite = await CulturalSite.findById(req.params.culturalSiteId);

        if (!culturalSite) {
            // 해당 문화유산이 존재하지 않으면 404 에러 반환
            return next(new AppError('Cannot find the cultural site.', 404));
        }
        filter = { culturalSite: req.params.culturalSiteId };
    }

    // 2. 특정 user에 대한 리뷰 필터링 (새로 추가)
    // /api/reviews?user=userId
    if (req.query.user) {
        // 사용자 ID 유효성 검사 (선택 사항이지만 권장)
        if (!mongoose.isObjectIdOrHexString(req.query.user)) {
            return next(new AppError('invalid user.', 400));
        }
        filter.user = req.query.user;
    }

    const reviews = await Review.find(filter)
        .populate({
            path: 'culturalSite',
            select: 'name' // 문화유산 이름만 가져옴
        })
        .populate({
            path: 'user',
            select: 'username profileImage' // 사용자 이름, 프로필 사진만 가져옴
        })
        .sort('-createdAt'); // 최신순 정렬;

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

// 특정 리뷰 조회
const getReviewById = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.reviewId)
        .populate({
            path: 'culturalSite',
            select: 'name'
        })
        .populate({
            path: 'user',
            select: 'username'
        });

    if (!review) {
        return next(new AppError('There are no reviews with that ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    });
});

// 새로운 리뷰 생성 (로그인한 사용자만 가능)
const createReview = asyncHandler(async (req, res, next) => {
    if (!req.body.culturalSite) req.body.culturalSite = req.params.culturalSiteId; // URL 파라미터에서 culturalSiteId 가져오기 
    if (!req.body.user) req.body.user = req.user.id; // 현재 로그인한 사용자 ID 

    const existingCulturalSite = await CulturalSite.findById(req.body.culturalSite);
    if (!existingCulturalSite) {
        return next(new AppError('No cultural heritages found to leave a review for.', 404));
    }

    // 이미 리뷰를 남겼는지 확인
    const existingReview = await Review.findOne({ user: req.body.user, culturalSite: req.body.culturalSite });
    if (existingReview) {
        return next(new AppError('You have already left a review for this cultural heritage.', 409)); // 409 Conflict
    }

    const { culturalSite, user, rating, comment } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const newReview = new Review({
            culturalSite,
            user,
            rating,
            comment
        });

        // 1. Review 문서 저장 (세션 포함)
        const savedReview = await newReview.save({ session });

        // 2. CulturalSite의 reviews 배열 업데이트 (세션 포함)
        // $addToSet을 사용하여 중복 추가 방지
        await CulturalSite.findByIdAndUpdate(
            culturalSite,
            { $addToSet: { reviews: savedReview._id } },
            { session, new: true } // new: true는 업데이트 후의 문서를 반환 (여기서는 필요 없지만 좋은 습관)
        );

        await session.commitTransaction(); // 모든 작업 성공 시 커밋

        res.status(201).json({
            status: 'success',
            data: {
                review: savedReview
            }
        });
    } catch (error) {
        await session.abortTransaction(); // 오류 발생 시 롤백
        console.error('리뷰 생성 트랜잭션 실패:', error);
        return next(new AppError('리뷰 생성 중 오류가 발생했습니다.', 500));
    } finally {
        session.endSession(); // 세션 종료
    }
});

// 리뷰 업데이트 (리뷰 작성자만 가능)
const updateReviewById = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
        return next(new AppError('There are no reviews with that ID.', 404));
    }

    // 리뷰 작성자와 현재 로그인한 사용자가 일치하는지 확인
    if (review.user.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to edit this review.', 403));
    }

    const updatedReview = await Review.findByIdAndUpdate(req.params.reviewId, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            review: updatedReview
        }
    });
});

// 리뷰 삭제 (리뷰 작성자 또는 관리자)
const deleteReviewById = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await Review.findById(req.params.reviewId).session(session);
        if (!review) {
            await session.abortTransaction(); // 리뷰가 없으면 롤백
            return next(new AppError('There are no reviews with that ID.', 404));
        }

        // 리뷰 작성자 또는 관리자인지 확인
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            await session.abortTransaction(); // 권한 없으면 롤백
            return next(new AppError('You do not have permission to delete this review.', 403));
        }

        // 1. Review 문서 삭제 (세션 포함)
        await Review.findByIdAndDelete(req.params.reviewId, { session });

        // 2. CulturalSite의 reviews 배열에서 제거 (세션 포함)
        await CulturalSite.findByIdAndUpdate(
            review.culturalSite,
            { $pull: { reviews: review._id } },
            { session }
        );

        // User.reviews 배열에서 제거 로직은 제거 (User 스키마에서 필드 제거)

        await session.commitTransaction(); // 모든 작업 성공 시 커밋

        res.status(204).json({ // 204 No Content는 성공적으로 삭제되었지만 응답 본문에 데이터가 없음을 의미합니다. [cite: 242]
            status: 'success',
            data: null
        });
    } catch (error) {
        await session.abortTransaction(); // 오류 발생 시 롤백
        console.error('Review delete transaction failed:', error);
        return next(new AppError('An error occurred while deleting the review.', 500));
    } finally {
        session.endSession(); // 세션 종료
    }
});

module.exports = {
    getAllReviews,
    getReviewById,
    createReview,
    updateReviewById,
    deleteReviewById
}