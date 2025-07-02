// backend/src/routes/userRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

// 모든 즐겨찾기 관련 작업은 로그인된 사용자만 가능하도록 보호합니다.
router.use(authController.protect);

// role 변경(admin만 가능)
// PATCH /api/v1/users/updateRole/:userId
router.patch(
  '/updateRole/:userId',
  authController.restrictTo('admin'),
  authController.updateUserRole
);

// 내 정보 가지고오기
router.get('/me', userController.getMe);
// 내 정보 업데이트
router.patch('/updateMe', userController.updateMe);
// 계정 삭제
router.delete('/deleteMe', userController.deleteMe);
// 사용자 정보 가지고오기
router.get('/:userId', userController.getUserById);
// 모든 사용자 정보 가지고오기
router.get('/', authController.restrictTo('admin'), userController.getAllUsers);


// 즐겨찾기 조회 (사용자 프로필에서 즐겨찾기 목록을 볼 때)
// /api/v1/users/me/favorites
router.get('/me/favorites', userController.getFavoriteSites);

// 즐겨찾기 추가: 특정 문화유산 ID를 URL 파라미터로 받음
// /api/v1/users/me/favorites/:siteId
router.post('/me/favorites/:siteId', userController.addFavoriteSite);

// 즐겨찾기 제거: 특정 문화유산 ID를 URL 파라미터로 받음
// /api/v1/users/me/favorites/:siteId
router.delete('/me/favorites/:siteId', userController.removeFavoriteSite);

router.get('/me/reviews', userController.getMyReviews);


module.exports = router;