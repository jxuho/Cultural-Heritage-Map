// backend/controllers/userController.js (예시)
require('dotenv').config();
const User = require('../models/User');
const Review = require('../models/Review')
const Proposal = require('../models/Proposal')
const CulturalSite = require('../models/CulturalSite')
const AppError = require('../utils/AppError')
const mongoose = require('mongoose')
const asyncHandler = require('../utils/asyncHandler')


// 내 정보 조회 (GET /api/v1/users/me)
const getMe = asyncHandler(async (req, res, next) => {
    // req.user는 인증 미들웨어(authController.protect)에서 설정한 현재 로그인 사용자 객체입니다.
    // 이 객체는 MongoDB에서 조회된 사용자 문서입니다.
    if (!req.user) {
        return next(new AppError('로그인된 사용자를 찾을 수 없습니다.', 401));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: req.user // req.user는 이미 populate 되어 있거나 필요한 필드를 가지고 있을 것입니다.
        }
    });
});

// 내 정보 수정 (PATCH /api/v1/users/updateMe)
const updateMe = asyncHandler(async (req, res, next) => {
    // // 1. 비밀번호 관련 데이터가 요청 본문에 있다면 에러 발생 (Google OAuth2 사용 시)
    // if (req.body.password || req.body.passwordConfirm) {
    //     return next(new AppError('이메일/비밀번호 인증이 아니므로 비밀번호는 여기서 업데이트할 수 없습니다.', 400));
    // }

    // 2. 허용된 필드만 필터링 (사용자가 임의의 필드를 수정하는 것을 방지)
    const filteredBody = {};
    const allowedFields = ['username', 'profileImage', 'bio']; // 허용할 필드 지정

    Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
            filteredBody[key] = req.body[key];
        }
    });

    // 3. 사용자 정보 업데이트
    // req.user.id는 인증 미들웨어에서 가져온 현재 로그인 사용자의 ID입니다.
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, // 업데이트된 문서를 반환
        runValidators: true // 모델 스키마의 유효성 검사 실행
    });

    res.status(200).json({
        status: 'success',
        message: '프로필이 성공적으로 업데이트되었습니다.',
        data: {
            user: updatedUser
        }
    });
});

// 내 계정 삭제 (DELETE /api/v1/users/deleteMe)
const deleteMe = asyncHandler(async (req, res, next) => {
    const userToDelete = await User.findById(req.user.id);

    if (!userToDelete) {
        return next(new AppError('삭제할 사용자를 찾을 수 없습니다.', 404));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = userToDelete._id;
        const userFavoriteSites = userToDelete.favoriteSites;

        // 1. 사용자 하드 삭제
        await User.findByIdAndDelete(userId, { session });

        // 2. 이 사용자가 proposedBy로 있는 CulturalSite 문서의 해당 필드 값을 null로 변경
        await CulturalSite.updateMany(
            { proposedBy: userId },
            { $set: { proposedBy: null } },
            { session }
        );

        // 3. 이 사용자가 작성한 모든 리뷰들을 하드삭제
        //    (그리고 해당 리뷰들이 속한 CulturalSite의 reviewsCount 감소 및 reviews 배열에서 ObjectId 제거)
        const reviewsToDelete = await Review.find({ user: userId }).session(session);

        if (reviewsToDelete.length > 0) {
            // 삭제할 리뷰들의 ID 목록을 먼저 추출
            const reviewIdsToDelete = reviewsToDelete.map(review => review._id);

            // Review 문서 자체를 삭제
            await Review.deleteMany({ user: userId }, { session });

            // 해당 리뷰들이 연결된 모든 CulturalSite ID를 중복 없이 수집
            const affectedCulturalSiteIds = [...new Set(reviewsToDelete.map(review => review.culturalSite.toString()))];

            // 각 CulturalSite에 대해 reviews 배열에서 삭제된 리뷰 ID를 제거하고, reviewsCount를 정확히 감소
            for (const siteId of affectedCulturalSiteIds) {
                // 이 사용자가 이 특정 문화유산에 몇 개의 리뷰를 작성했는지 계산
                const reviewsCountForThisSiteByUser = reviewsToDelete.filter(
                    review => review.culturalSite.toString() === siteId
                ).length;

                await CulturalSite.findByIdAndUpdate(
                    siteId,
                    {
                        $pullAll: { reviews: reviewIdsToDelete }, // CulturalSite의 reviews 배열에서 해당 ID들 제거
                        $inc: { reviewsCount: -reviewsCountForThisSiteByUser } // 해당 문화유산의 reviewsCount 감소
                    },
                    { session }
                );
            }
        }

        // 4. 이 사용자가 제안한 모든 Proposals 문서를 하드 삭제
        await Proposal.deleteMany({ proposedBy: userId }, { session });

        // 5. 이 사용자가 favorite으로 추가했던 모든 CulturalSite의 favoritesCount를 -1
        if (userFavoriteSites && userFavoriteSites.length > 0) {
            await CulturalSite.updateMany(
                { _id: { $in: userFavoriteSites } },
                { $inc: { favoritesCount: -1 } },
                { session }
            );
        }

        await session.commitTransaction();

        res.cookie('jwt', 'loggedout', {
            expires: new Date(0),
            httpOnly: true, // 자바스크립트 접근 방지 (보안 권장)
            sameSite: 'Lax', // CSRF 보호 (상황에 따라 'None' 또는 'Strict' 선택)
            secure: process.env.NODE_ENV === 'production', // HTTPS 환경에서만 전송 (운영 환경 필수)
            path: '/'
        });

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });

        // 클라이언트 (React, Vue, Angular 등)에서는 이 응답을 받은 후
        // window.location.href = 'http://localhost:5000/'; // 또는 React Router의 history.push('/login')
        // 와 같이 처리합니다.

    } catch (error) {
        await session.abortTransaction();
        console.error('사용자 삭제 트랜잭션 실패:', error);
        return next(new AppError('계정 삭제 중 오류가 발생했습니다. 다시 시도해주세요.', 500));
    } finally {
        session.endSession();
    }
});





// 즐겨찾기 추가
const addFavoriteSite = asyncHandler(async (req, res, next) => {
    const { siteId } = req.params;

    if (!siteId) {
        return next(new AppError('추가할 문화유적지 ID는 필수입니다.', 400));
    }

    // CulturalSite 및 User 존재 여부 확인은 트랜잭션 외부에서 먼저 수행
    // 이는 존재하지 않는 문서에 대해 트랜잭션을 시작하지 않도록 하여 효율성을 높입니다.
    const culturalSite = await CulturalSite.findById(siteId);
    if (!culturalSite) {
        return next(new AppError('해당 ID를 가진 문화유적지를 찾을 수 없습니다.', 404));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('사용자를 찾을 수 없습니다.', 404));
    }

    if (user.favoriteSites.includes(siteId)) {
        return next(new AppError('이미 즐겨찾기에 추가된 문화유적지입니다.', 400));
    }

    const session = await mongoose.startSession(); // 세션 시작
    session.startTransaction(); // 트랜잭션 시작

    try {
        // 1. 사용자의 favoriteSites 배열에 추가 (세션과 함께)
        // Mongoose의 $addToSet 연산자를 사용하여 중복 추가를 방지하고 더 효율적으로 업데이트할 수 있습니다.
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { favoriteSites: siteId } }, // siteId를 배열에 추가 (중복이면 추가 안 함)
            { new: true, runValidators: false, session } // 세션 전달
        );

        if (!updatedUser) { // 사용자가 동시에 삭제되는 등의 예외적인 경우
            await session.abortTransaction();
            session.endSession();
            return next(new AppError('사용자를 찾을 수 없어 즐겨찾기를 추가할 수 없습니다.', 404));
        }

        // 2. 해당 문화유산의 favoritesCount 1 증가 (세션과 함께)
        const updatedCulturalSite = await CulturalSite.findByIdAndUpdate(
            siteId,
            { $inc: { favoritesCount: 1 } }, // favoritesCount 필드를 1 증가
            { new: true, runValidators: true, session } // 세션 전달
        );

        if (!updatedCulturalSite) { // 문화유산이 동시에 삭제되는 등의 예외적인 경우
            await session.abortTransaction();
            session.endSession();
            return next(new AppError('문화유적지를 찾을 수 없어 favoritesCount를 업데이트할 수 없습니다.', 404));
        }

        await session.commitTransaction(); // 모든 작업이 성공하면 커밋
        session.endSession(); // 세션 종료

        res.status(200).json({
            status: 'success',
            message: '즐겨찾기에 문화유적지가 추가되었습니다.',
            data: {
                user: updatedUser, // 업데이트된 사용자 정보를 반환
                culturalSite: updatedCulturalSite // 업데이트된 문화유산 정보도 함께 반환
            }
        });
    } catch (error) {
        await session.abortTransaction(); // 오류 발생 시 모든 변경사항 롤백
        session.endSession();
        console.error('즐겨찾기 추가 트랜잭션 중 오류 발생:', error);
        // 클라이언트에게 좀 더 명확한 오류 메시지 제공
        if (error.name === 'ValidationError') {
            return next(new AppError(`데이터 유효성 검사 오류: ${error.message}`, 400));
        }
        return next(new AppError('즐겨찾기 추가 중 오류가 발생했습니다. 다시 시도해주세요.', 500));
    }
});

// 즐겨찾기 제거
const removeFavoriteSite = asyncHandler(async (req, res, next) => {
    const { siteId } = req.params;

    if (!siteId) {
        return next(new AppError('제거할 문화유적지 ID는 필수입니다.', 400));
    }

    const culturalSite = await CulturalSite.findById(siteId);
    if (!culturalSite) {
        return next(new AppError('해당 ID를 가진 문화유적지를 찾을 수 없습니다.', 404));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('사용자를 찾을 수 없습니다.', 404));
    }

    const session = await mongoose.startSession(); // 세션 시작
    session.startTransaction(); // 트랜잭션 시작

    try {
        const initialLength = user.favoriteSites.length;

        // 1. 사용자의 favoriteSites 배열에서 제거 (세션과 함께)
        user.favoriteSites = user.favoriteSites.filter(
            (favSiteId) => favSiteId.toString() !== siteId.toString()
        );

        if (user.favoriteSites.length === initialLength) {
            await session.abortTransaction(); // 변경사항 없으면 롤백
            session.endSession();
            return next(new AppError('즐겨찾기에 해당 문화유적지가 없습니다.', 404));
        }

        await user.save({ validateBeforeSave: false, session }); // 세션 전달

        // 2. 해당 문화유산의 favoritesCount 1 감소 (세션과 함께)
        await CulturalSite.findByIdAndUpdate(
            siteId,
            { $inc: { favoritesCount: -1 } },
            { new: true, runValidators: true, session } // 세션 전달
        );

        await session.commitTransaction(); // 모든 작업이 성공하면 커밋
        session.endSession(); // 세션 종료

        res.status(200).json({
            status: 'success',
            message: '즐겨찾기에서 문화유적지가 제거되었습니다.',
            data: {
                user: user
            }
        });
    } catch (error) {
        await session.abortTransaction(); // 오류 발생 시 모든 변경사항 롤백
        session.endSession();
        console.error('즐겨찾기 제거 트랜잭션 중 오류 발생:', error);
        return next(new AppError('즐겨찾기 제거 중 오류가 발생했습니다. 다시 시도해주세요.', 500));
    }
});

// 즐겨찾기 조회
const getFavoriteSites = asyncHandler(async (req, res, next) => {
    // 사용자의 favoriteSites 필드를 populate하여 문화유적지 정보를 가져옵니다.
    const user = await User.findById(req.user.id).populate({
        path: 'favoriteSites',
        select: 'name category address images' // 필요한 필드만 선택
    });

    if (!user) {
        return next(new AppError('사용자를 찾을 수 없습니다.', 404));
    }

    res.status(200).json({
        status: 'success',
        results: user.favoriteSites.length,
        data: {
            favoriteSites: user.favoriteSites
        }
    });
});



const getMyReviews = asyncHandler(async (req, res, next) => {
  // 현재 로그인한 사용자 ID를 기준으로 리뷰를 찾습니다.
  // req.user는 protect 미들웨어에서 설정된 사용자 정보입니다.
  if (!req.user || !req.user.id) {
    return next(new AppError('로그인된 사용자 정보가 없습니다.', 401));
  }

  const queryObj = { user: req.user.id };

  // APIFeatures를 사용하여 쿼리 파라미터(정렬 등)를 적용합니다.
  let query = Review.find(queryObj);

  // 리뷰에 연결된 culturalSite와 user 정보도 populate합니다.
  query = query.populate({
    path: 'culturalSite',
    select: 'name imageUrl address' // 필요한 필드만 선택
  }).populate({
    path: 'user',
    select: 'username profileImage' // 필요한 필드만 선택
  });

  // 정렬 로직 (클라이언트에서 reviewSort 쿼리 파라미터로 받음)
  if (req.query.reviewSort === 'newest') {
    query = query.sort('-createdAt');
  } else if (req.query.reviewSort === 'highestRating') {
    query = query.sort('-rating');
  } else if (req.query.reviewSort === 'lowestRating') {
    query = query.sort('rating');
  } else {
    // 기본 정렬: 최신순
    query = query.sort('-createdAt');
  }

  const reviews = await query;

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});



module.exports = {
    getMe,
    updateMe,
    deleteMe,
    addFavoriteSite,
    removeFavoriteSite,
    getFavoriteSites,
    getMyReviews
}