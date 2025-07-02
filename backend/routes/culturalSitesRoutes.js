const express = require('express');
const router = express.Router();

const culturalSitesController = require('../controllers/culturalSiteController')
const authController = require('../controllers/authController')
const reviewRouter = require('./reviewsRoutes');

// 리뷰 라우트
router.use('/:culturalSiteId/reviews', reviewRouter);

// 좌표 기준 주위 cultural site 가져오기
router.get('/nearby-osm',
  authController.protect, 
  authController.restrictTo('admin', 'user'),
  culturalSitesController.getNearbyOsmCulturalSites)

// schema에 일치하는 데이터를 db에 저장
router.post('/', 
  authController.protect,
  authController.restrictTo('admin'),
  culturalSitesController.saveCulturalSiteToDb)

// 전체 조회 + 필터링 (query: category, name)
router.get('/', culturalSitesController.getAllCulturalSites);

// 단건 조회
router.get('/:id', culturalSitesController.getCulturalSiteById);

// 문화 유적지 정보 업데이트 (관리자용, 인증 필요)
router.put('/:id',
  authController.protect, 
  authController.restrictTo('admin'), 
  culturalSitesController.updateCulturalSiteById);

// DELETE /:id: 문화 유적지 삭제 (관리자용, 인증 필요)
router.delete('/:id',
  authController.protect, 
  authController.restrictTo('admin'), 
  culturalSitesController.deleteCulturalSiteById);



module.exports = router;
