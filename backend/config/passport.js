require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // User 모델 가져오기

// Google OAuth 2.0 Strategy 설정
passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // '/api/v1/auth/google/callback'
        passReqToCallback: true // req 객체에 접근하기 위해
    },
    async (request, accessToken, refreshToken, profile, done) => {
        // 이 콜백 함수는 Google에서 인증이 성공했을 때 호출됩니다.
        try {
            // Google ID를 사용하여 기존 사용자 찾기
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // 사용자가 이미 존재하면 로그인 처리
                return done(null, user);
            } else {
                // 사용자가 존재하지 않으면 새로운 사용자 생성
                user = await User.create({
                    googleId: profile.id,
                    username: profile.displayName, // Google 프로필에서 이름 가져오기
                    email: profile.emails[0].value, // Google 프로필에서 이메일 가져오기
                    profileImage: profile.photos[0].value, // Google 프로필에서 사진 가져오기
                    // role은 기본값 'user'로 설정됩니다.
                });
                return done(null, user);
            }
        } catch (err) {
            return done(err, false);
        }
    }
));