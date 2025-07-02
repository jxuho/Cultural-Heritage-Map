const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken'); // JWT 토큰 생성을 위해 필요

// JWT 토큰 생성 함수 (일반적으로 사용되는 방식)
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// JWT를 쿠키에 담아 전송하는 함수
const createSendToken = (user, statusCode, res) => { 
    const token = signToken(user._id); // signToken 함수는 정의되어 있어야 합니다.

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // 운영 환경에서는 true, 개발 환경에서는 false 또는 환경 변수 사용
        sameSite: 'Lax', // 이전에 확인한 쿠키의 sameSite와 일치해야 합니다.
        path: '/'
    };

    res.cookie('jwt', token, cookieOptions);
};

// Google OAuth 콜백 처리
const googleAuthCallback = asyncHandler(async (req, res, next) => {
    // Passport.js가 req.user에 인증된 사용자 정보를 자동으로 넣어줍니다.
    // 이는 Passport GoogleStrategy의 `done` 콜백에서 반환된 user 객체입니다.
    if (!req.user) {
        return next(new AppError('Google auth failed.', 401));
    }

    // req.user는 Passport GoogleStrategy의 verify callback에서 반환된 User 모델 인스턴스입니다.
    createSendToken(req.user, 200, res);

    // 로그인 후 리다이렉트할 프론트엔드 URL (필요에 따라 설정)
    return res.redirect('http://localhost:3000/');
});

// 사용자 인증 미들웨어 (JWT 검증)
const protect = asyncHandler(async (req, res, next) => {
    let token;
    // 1) 토큰이 요청 헤더에 있는지 확인
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError('You are not logged in! Please log in to access this.', 401)
        );
    }

    // 2) 토큰 검증
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    // 3) 토큰에 해당하는 사용자가 존재하는지 확인
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new AppError('There is no user who corresponds to this token.', 401)
        );
    }

    // 4) 사용자 정보를 요청 객체에 추가
    req.user = currentUser;
    next();
});

// 역할 기반 권한 부여 (필요시)
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles 배열에 현재 사용자의 역할이 포함되어 있는지 확인
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('Do not have auth to do this.', 403)
            );
        }
        next();
    };
};

// 로그아웃
const logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(0),
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({ status: 'success' });
};

// Admin only: Change user roles
const updateUserRole = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const { newRole } = req.body;

    // 1. Prevent self role update
    if (req.user.id === userId) {
        return next(new AppError('You cannot change yourself.', 403));
    }

    // 2. Validate new role
    if (!['user', 'admin'].includes(newRole)) {
        return next(new AppError('Not valid. please choose one of user, admin', 400));
    }

    // 3. Find user to update
    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('There is no user who has the id.', 404));
    }

    // 4. Update role
    user.role = newRole;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: `User ${user.username} role changed into ${newRole}.`,
        data: { user }
    });
});



module.exports = {
    googleAuthCallback,
    protect,
    restrictTo,
    logout,
    updateUserRole
};