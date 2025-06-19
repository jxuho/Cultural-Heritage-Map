const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController'); // 인증 미들웨어

// :culturalSiteId/reviews 라우트를 위해 mergeParams: true
// 부모 라우터(culturalSitesRoutes)에서 넘어온 라우트 파라미터(여기서는 culturalSiteId)를 
// 자식 라우터(reviewsRoutes)의 req.params에 병합(merge)시켜 줍니다.
const router = express.Router({ mergeParams: true });

// 특정 문화유산의 모든 리뷰 조회
router.get('/', reviewController.getAllReviews);

// 특정 문화유산에 대한 리뷰 생성
router.post('/',
  authController.protect,
  authController.restrictTo('user', 'admin'),
  reviewController.createReview)

// 특정 문화유산의 특정 리뷰 조회
router.get('/:reviewId', reviewController.getReviewById);

// 리뷰 수정 (사용자만 가능)
router.patch('/:reviewId',
  authController.protect,
  authController.restrictTo('user', 'admin'),
  reviewController.updateReviewById);

// 리뷰 삭제
router.delete('/:reviewId',
  authController.protect,
  authController.restrictTo('user', 'admin'),
  reviewController.deleteReviewById);

module.exports = router;