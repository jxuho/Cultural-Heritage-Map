const express = require('express');
const passport = require('passport'); // Passport.js 미들웨어
const authController = require('../controllers/authController');

const router = express.Router();

// Google 로그인 시작 (사용자를 Google 인증 페이지로 리다이렉트)
router.get('/google', passport.authenticate('google', {
	scope: ['profile', 'email'],
	prompt: 'select_account' // 이미 Google에 로그인되어 있더라도 계정 선택 화면을 강제로 표시
}));

// Google 로그인 콜백 (Google로부터 인증 응답을 받고 처리)
router.get(
	'/google/callback',
	passport.authenticate('google', {
		failureRedirect: 'http://localhost:3000/', // 인증 실패 시 리다이렉트할 프론트엔드 URL
		session: false // JWT를 사용하므로 세션은 사용하지 않음
	}),
	authController.googleAuthCallback // 성공 시 JWT 발행 및 응답 처리
);

// 로그아웃 라우트 (JWT 쿠키 삭제)
router.post('/logout', authController.logout);

module.exports = router;