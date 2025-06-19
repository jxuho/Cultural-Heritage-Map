// backend/controllers/proposalController.js

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Proposal = require('../models/Proposal');
const CulturalSite = require('../models/CulturalSite');
const ExcludeSourceId = require('../models/ExcludeSourceId')
const { CULTURAL_SITE_UPDATABLE_FIELDS } = require('../config/culturalSiteConfig');
const { CULTURAL_CATEGORY } = require('../config/culturalSiteConfig');
const { queryOverpass } = require('../services/overpassService');
const { processOsmElementForCulturalSite } = require('../utils/osmDataProcessor');
const { singleElementQuery } = require('../config/osmData');
const { isValidLatLng, isPointInChemnitz, areCoordinatesMatching } = require('../utils/locationUtils')
const mongoose = require('mongoose')

// const createProposal = asyncHandler(async (req, res, next) => {
//     const { proposalType, proposalMessage, ...rawData } = req.body;
//     if (!proposalType) {
//         return next(new AppError('제안 유형(proposalType)은 필수입니다.', 400));
//     }

//     let newProposal;

//     switch (proposalType) {
//         case 'create':
//             const proposedSourceId = rawData.sourceId;
//             if (!proposedSourceId) {
//                 return next(new AppError('새로운 문화유산 제안 시 sourceId는 필수입니다. (예: node/12345, way/56789)', 400));
//             }

//             const sourceIdParts = proposedSourceId.split('/');
//             if (sourceIdParts.length !== 2 || (sourceIdParts[0] !== 'node' && sourceIdParts[0] !== 'way' &&
//                 sourceIdParts[0] !== 'relation') || isNaN(parseInt(sourceIdParts[1]))) {
//                 return next(new AppError('유효하지 않은 sourceId 형식입니다. (예: node/12345, way/56789, relation/123)', 400));
//             }
//             const osmType = sourceIdParts[0];
//             const osmId = parseInt(sourceIdParts[1]);

//             const existingCulturalSite = await CulturalSite.findOne({ sourceId: proposedSourceId });
//             if (existingCulturalSite) {
//                 return next(new AppError(`해당 sourceId (${proposedSourceId})를 가진 문화유산은 이미 등록되어 있습니다. 수정 제안을 사용해주세요.`, 409));
//             }

//             let actualOsmElement;
//             let actualSourceId;
//             let actualLocation;

//             try {
//                 // Overpass API 쿼리에 'out geom;' 또는 'out center;' 포함 여부 확인
//                 // queryOverpass 함수가 'geom'을 요청하도록 설정되어 있어야 way의 노드 좌표를 받음
//                 const osmResponse = await queryOverpass(singleElementQuery(osmType, osmId));
//                 actualOsmElement = osmResponse.elements[0];

//                 if (!actualOsmElement) {
//                     return next(new AppError(`제안된 OSM ID (${proposedSourceId})에 해당하는 요소를 Overpass API에서 찾을 수 없습니다.`, 404));
//                 }

//                 actualSourceId = `${actualOsmElement.type}/${actualOsmElement.id}`;
//                 // processOsmElementForCulturalSite 함수가 way/relation의 경우 중심점 (Point)이 아닌
//                 // LineString/Polygon 또는 노드 배열을 반환하도록 수정 고려
//                 const processedFromOsm = await processOsmElementForCulturalSite(actualOsmElement);
//                 actualLocation = processedFromOsm.location; // 이것이 Point 타입으로 변환될 것임 [cite: 14]

//                 if (proposedSourceId !== actualSourceId) {
//                     console.warn(`Client provided sourceId mismatch: Expected ${actualSourceId}, Got ${proposedSourceId}`);
//                     return next(new AppError('제공된 sourceId가 실제 OSM 데이터와 일치하지 않습니다.', 400));
//                 }

//                 if (!rawData.location) {
//                     return next(new AppError('새로운 문화유산 제안 시 유효한 위치 정보(location)는 필수입니다.', 400));
//                 }
//                 if (rawData.location.type !== 'Point' || rawData.location.coordinates.length !== 2 || !isValidLatLng(rawData.location.coordinates[0], rawData.location.coordinates[1])) {
//                     return next(new AppError('제공된 위치 정보(location) 형식이 유효하지 않습니다.', 400));
//                 }
//                 if (!isPointInChemnitz(rawData.location.coordinates[1], rawData.location.coordinates[0])) {
//                     return next(new AppError('제공된 위치 정보(location)가 Chemnitz를 벗어납니다.', 400));
//                 }

//                 const clientCoord = [rawData.location.coordinates[0], rawData.location.coordinates[1]];
//                 const osmCoord = [actualLocation.coordinates[0], actualLocation.coordinates[1]];


//                 if (!areCoordinatesMatching(clientCoord, osmCoord)) {
//                     return next(new AppError('제공된 위치 정보가 실제 OSM 노드와 일치하지 않습니다. 지도의 정확한 위치를 선택해주세요.', 400));
//                 }


//             } catch (error) {
//                 console.error('제안 생성 중 Overpass API에서 OSM 데이터를 가져오거나 처리하는 중 오류 발생:', error);
//                 if (error.response) {
//                     console.error('Overpass API Response Error:', error.response.status, error.response.data);
//                     return next(new AppError(`OSM API 오류: ${error.response.status} - ${JSON.stringify(error.response.data)}`, error.response.status));
//                 }
//                 return next(new AppError(`OSM 데이터를 가져오거나 처리하는 중 알 수 없는 오류 발생: ${error.message}`, 500));
//             }

//             const proposedChangesForCreate = processOsmElementForCulturalSite(actualOsmElement);
//             for (const field of CULTURAL_SITE_UPDATABLE_FIELDS)
//                 if (rawData[field] !== undefined) {
//                     proposedChangesForCreate[field] = rawData[field];
//                 }

//             // 서버에서 검증된 필수 필드들을 proposedChangesForCreate에 직접 추가
//             proposedChangesForCreate.sourceId = actualSourceId;
//             proposedChangesForCreate.location = actualLocation;
//             proposedChangesForCreate.originalTags = actualOsmElement.tags;

//             if (proposedChangesForCreate.category && !CULTURAL_CATEGORY.includes(proposedChangesForCreate.category)) {
//                 return next(new AppError(`유효하지 않은 카테고리 값입니다: ${proposedChangesForCreate.category}`, 400));
//             }

//             newProposal = await Proposal.create({
//                 proposedBy: req.user.id,
//                 proposalType: 'create',
//                 proposedChanges: proposedChangesForCreate,
//                 proposalMessage: proposalMessage,
//                 status: 'pending'
//             });
//             break;

//         case 'update':
//             const culturalSiteIdForUpdate = rawData.culturalSite;
//             if (!culturalSiteIdForUpdate) {
//                 return next(new AppError('수정할 문화유산의 ID(culturalSite)는 필수입니다.', 400));
//             }

//             const culturalSiteToUpdate = await CulturalSite.findById(culturalSiteIdForUpdate);
//             if (!culturalSiteToUpdate) {
//                 return next(new AppError('수정할 문화유산을 찾을 수 없습니다.', 404));
//             }

//             const proposedChangesForUpdate = {};
//             for (const field of CULTURAL_SITE_UPDATABLE_FIELDS) {
//                 if (rawData[field] !== undefined) {
//                     if (JSON.stringify(culturalSiteToUpdate[field]) !== JSON.stringify(rawData[field])) {
//                         proposedChangesForUpdate[field] = {
//                             oldValue: culturalSiteToUpdate[field],
//                             newValue: rawData[field]
//                         };
//                     }
//                 }
//             }

//             if (Object.keys(proposedChangesForUpdate).length === 0) {
//                 return next(new AppError('수정 제안을 위해 유효한 변경 사항이 필요합니다. (기존 값과 다른 값을 제공해주세요)', 400));
//             }

//             if (proposedChangesForUpdate.category && proposedChangesForUpdate.category.newValue && !CULTURAL_CATEGORY.includes(proposedChangesForUpdate.category.newValue)) {
//                 return next(new AppError(`유효하지 않은 카테고리 값입니다: ${proposedChangesForUpdate.category.newValue}`, 400));
//             }

//             const existingUpdateProposal = await Proposal.findOne({
//                 culturalSite: culturalSiteIdForUpdate,
//                 proposalType: 'update',
//                 status: 'pending'
//             });
//             if (existingUpdateProposal) {
//                 return next(new AppError('이미 이 문화유산에 대한 수정 제안이 제출되어 검토 대기 중입니다.', 409));
//             }

//             newProposal = await Proposal.create({
//                 culturalSite: culturalSiteIdForUpdate,
//                 proposedBy: req.user.id,
//                 proposalType: 'update',
//                 proposedChanges: proposedChangesForUpdate,
//                 proposalMessage: proposalMessage,
//                 status: 'pending'
//             });
//             break;

//         case 'delete':
//             const culturalSiteIdForDelete = rawData.culturalSite;
//             if (!culturalSiteIdForDelete) {
//                 return next(new AppError('삭제할 문화유산의 ID(culturalSite)는 필수입니다.', 400));
//             }

//             const culturalSiteToDelete = await CulturalSite.findById(culturalSiteIdForDelete);
//             if (!culturalSiteToDelete) {
//                 return next(new AppError('삭제할 문화유산을 찾을 수 없습니다.', 404));
//             }

//             const existingDeleteProposal = await Proposal.findOne({
//                 culturalSite: culturalSiteIdForDelete,
//                 proposalType: 'delete',
//                 status: 'pending'
//             });
//             if (existingDeleteProposal) {
//                 return next(new AppError('이미 이 문화유산에 대한 삭제 제안이 제출되어 검토 대기 중입니다.', 409));
//             }

//             newProposal = await Proposal.create({
//                 culturalSite: culturalSiteIdForDelete,
//                 proposedBy: req.user.id,
//                 proposalType: 'delete',
//                 proposedChanges: {},
//                 proposalMessage: proposalMessage,
//                 status: 'pending'
//             });
//             break;

//         default:
//             return next(new AppError('알 수 없는 제안 유형입니다.', 400));
//     }

//     res.status(201).json({
//         status: 'success',
//         message: '제안이 성공적으로 제출되었습니다.',
//         data: {
//             proposal: newProposal
//         }
//     });
// });



// --- 관리자 역할 (Admin) ---

// 1. 모든 제안 조회

const createProposal = asyncHandler(async (req, res, next) => {
    const { proposalType, proposalMessage, ...rawData } = req.body;
    if (!proposalType) {
        return next(new AppError('제안 유형(proposalType)은 필수입니다.', 400));
    }

    let newProposal;
    const userId = req.user.id; // Get the ID of the proposing user

    // --- NEW: Universal check for any existing pending proposal for the same cultural site by the same user
    // This applies to 'update' and 'delete' proposal types where 'culturalSite' ID is relevant.
    // 'create' proposals are handled separately as their uniqueness is based on 'sourceId'.
    if (proposalType === 'update' || proposalType === 'delete') {
        const culturalSiteId = rawData.culturalSite;
        if (!culturalSiteId) {
            return next(new AppError('문화유산 ID(culturalSite)는 필수입니다.', 400));
        }

        const existingPendingProposal = await Proposal.findOne({
            culturalSite: culturalSiteId,
            proposedBy: userId,
            status: 'pending' // Check for *any* type of pending proposal
        });

        if (existingPendingProposal) {
            let message = '이미 이 문화유산에 대한 ';
            if (existingPendingProposal.proposalType === 'update') {
                message += '수정 제안이';
            } else if (existingPendingProposal.proposalType === 'delete') {
                message += '삭제 제안이';
            } else if (existingPendingProposal.proposalType === 'create') {
                // This case should ideally not be hit if culturalSiteId is present,
                // but good to cover.
                message += '생성 제안이';
            }
            message += ' 제출되어 검토 대기 중입니다.';
            return next(new AppError(message, 409));
        }
    }

    switch (proposalType) {
        case 'create':
            const proposedSourceId = rawData.sourceId;
            if (!proposedSourceId) {
                return next(new AppError('새로운 문화유산 제안 시 sourceId는 필수입니다. (예: node/12345, way/56789)', 400));
            }

            const sourceIdParts = proposedSourceId.split('/');
            if (sourceIdParts.length !== 2 || (sourceIdParts[0] !== 'node' && sourceIdParts[0] !== 'way' &&
                sourceIdParts[0] !== 'relation') || isNaN(parseInt(sourceIdParts[1]))) {
                return next(new AppError('유효하지 않은 sourceId 형식입니다. (예: node/12345, way/56789, relation/123)', 400));
            }
            const osmType = sourceIdParts[0];
            const osmId = parseInt(sourceIdParts[1]);

            const existingCulturalSite = await CulturalSite.findOne({ sourceId: proposedSourceId });
            if (existingCulturalSite) {
                return next(new AppError(`해당 sourceId (${proposedSourceId})를 가진 문화유산은 이미 등록되어 있습니다. 수정 제안을 사용해주세요.`, 409));
            }

            // Specific check for existing pending 'create' proposal for the same sourceId by the same user
            // This is still needed because the universal check above uses culturalSite, not sourceId.
            const existingCreateProposal = await Proposal.findOne({
                'proposedChanges.sourceId': proposedSourceId, // Assuming sourceId is stored in proposedChanges for create proposals
                proposedBy: userId,
                proposalType: 'create', // Crucially, specify 'create' type here
                status: 'pending'
            });
            if (existingCreateProposal) {
                return next(new AppError('이미 이 OSM ID에 대한 생성 제안이 제출되어 검토 대기 중입니다.', 409));
            }

            let actualOsmElement;
            let actualSourceId;
            let actualLocation;

            try {
                const osmResponse = await queryOverpass(singleElementQuery(osmType, osmId));
                actualOsmElement = osmResponse.elements[0];

                if (!actualOsmElement) {
                    return next(new AppError(`제안된 OSM ID (${proposedSourceId})에 해당하는 요소를 Overpass API에서 찾을 수 없습니다.`, 404));
                }

                actualSourceId = `${actualOsmElement.type}/${actualOsmElement.id}`;
                const processedFromOsm = await processOsmElementForCulturalSite(actualOsmElement);
                actualLocation = processedFromOsm.location;

                if (proposedSourceId !== actualSourceId) {
                    console.warn(`Client provided sourceId mismatch: Expected ${actualSourceId}, Got ${proposedSourceId}`);
                    return next(new AppError('제공된 sourceId가 실제 OSM 데이터와 일치하지 않습니다.', 400));
                }

                if (!rawData.location) {
                    return next(new AppError('새로운 문화유산 제안 시 유효한 위치 정보(location)는 필수입니다.', 400));
                }
                if (rawData.location.type !== 'Point' || rawData.location.coordinates.length !== 2 || !isValidLatLng(rawData.location.coordinates[0], rawData.location.coordinates[1])) {
                    return next(new AppError('제공된 위치 정보(location) 형식이 유효하지 않습니다.', 400));
                }
                if (!isPointInChemnitz(rawData.location.coordinates[1], rawData.location.coordinates[0])) {
                    return next(new AppError('제공된 위치 정보(location)가 Chemnitz를 벗어납니다.', 400));
                }

                const clientCoord = [rawData.location.coordinates[0], rawData.location.coordinates[1]];
                const osmCoord = [actualLocation.coordinates[0], actualLocation.coordinates[1]];

                if (!areCoordinatesMatching(clientCoord, osmCoord)) {
                    return next(new AppError('제공된 위치 정보가 실제 OSM 노드와 일치하지 않습니다. 지도의 정확한 위치를 선택해주세요.', 400));
                }

            } catch (error) {
                console.error('제안 생성 중 Overpass API에서 OSM 데이터를 가져오거나 처리하는 중 오류 발생:', error);
                if (error.response) {
                    console.error('Overpass API Response Error:', error.response.status, error.response.data);
                    return next(new AppError(`OSM API 오류: ${error.response.status} - ${JSON.stringify(error.response.data)}`, error.response.status));
                }
                return next(new AppError(`OSM 데이터를 가져오거나 처리하는 중 알 수 없는 오류 발생: ${error.message}`, 500));
            }

            const proposedChangesForCreate = processOsmElementForCulturalSite(actualOsmElement);
            for (const field of CULTURAL_SITE_UPDATABLE_FIELDS)
                if (rawData[field] !== undefined) {
                    proposedChangesForCreate[field] = rawData[field];
                }

            proposedChangesForCreate.sourceId = actualSourceId;
            proposedChangesForCreate.location = actualLocation;
            proposedChangesForCreate.originalTags = actualOsmElement.tags;

            if (proposedChangesForCreate.category && !CULTURAL_CATEGORY.includes(proposedChangesForCreate.category)) {
                return next(new AppError(`유효하지 않은 카테고리 값입니다: ${proposedChangesForCreate.category}`, 400));
            }

            newProposal = await Proposal.create({
                proposedBy: userId,
                proposalType: 'create',
                proposedChanges: proposedChangesForCreate,
                proposalMessage: proposalMessage,
                status: 'pending'
            });
            break;

        case 'update':
            const culturalSiteIdForUpdate = rawData.culturalSite;
            // No need for individual `existingUpdateProposal` check here, as it's covered by the universal check above.
            const culturalSiteToUpdate = await CulturalSite.findById(culturalSiteIdForUpdate);
            if (!culturalSiteToUpdate) {
                return next(new AppError('수정할 문화유산을 찾을 수 없습니다.', 404));
            }

            const proposedChangesForUpdate = {};
            for (const field of CULTURAL_SITE_UPDATABLE_FIELDS) {
                if (rawData[field] !== undefined) {
                    if (JSON.stringify(culturalSiteToUpdate[field]) !== JSON.stringify(rawData[field])) {
                        proposedChangesForUpdate[field] = {
                            oldValue: culturalSiteToUpdate[field],
                            newValue: rawData[field]
                        };
                    }
                }
            }

            if (Object.keys(proposedChangesForUpdate).length === 0) {
                return next(new AppError('수정 제안을 위해 유효한 변경 사항이 필요합니다. (기존 값과 다른 값을 제공해주세요)', 400));
            }

            if (proposedChangesForUpdate.category && proposedChangesForUpdate.category.newValue && !CULTURAL_CATEGORY.includes(proposedChangesForUpdate.category.newValue)) {
                return next(new AppError(`유효하지 않은 카테고리 값입니다: ${proposedChangesForUpdate.category.newValue}`, 400));
            }

            newProposal = await Proposal.create({
                culturalSite: culturalSiteIdForUpdate,
                proposedBy: userId,
                proposalType: 'update',
                proposedChanges: proposedChangesForUpdate,
                proposalMessage: proposalMessage,
                status: 'pending'
            });
            break;

        case 'delete':
            const culturalSiteIdForDelete = rawData.culturalSite;
            // No need for individual `existingDeleteProposal` check here, as it's covered by the universal check above.
            const culturalSiteToDelete = await CulturalSite.findById(culturalSiteIdForDelete);
            if (!culturalSiteToDelete) {
                return next(new AppError('삭제할 문화유산을 찾을 수 없습니다.', 404));
            }

            newProposal = await Proposal.create({
                culturalSite: culturalSiteIdForDelete,
                proposedBy: userId,
                proposalType: 'delete',
                proposedChanges: {}, // No specific changes for deletion
                proposalMessage: proposalMessage,
                status: 'pending'
            });
            break;

        default:
            return next(new AppError('알 수 없는 제안 유형입니다.', 400));
    }

    res.status(201).json({
        status: 'success',
        message: '제안이 성공적으로 제출되었습니다.',
        data: {
            proposal: newProposal
        }
    });
});


const getAllProposals = asyncHandler(async (req, res, next) => {
    // 쿼리 파라미터로 필터링 (선택 사항: status, type 등)
    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }
    if (req.query.type) {
        filter.proposalType = req.query.type;
    }

    const proposals = await Proposal.find(filter)
        .populate('culturalSite', 'name description category address website imageUrl openingHours') // 관련 문화유산 정보 일부를 populate
        .populate('proposedBy', 'name email') // 제안한 사용자 정보 populate
        .sort('-createdAt'); // 최신 순으로 정렬

    res.status(200).json({
        status: 'success',
        results: proposals.length,
        data: {
            proposals
        }
    });
});

// 2. 특정 제안 상세 조회
const getProposalById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const proposal = await Proposal.findById(id)
        .populate('culturalSite', 'name sourceId location')
        .populate('proposedBy', 'name email')
        .populate('reviewedBy', 'name email');

    if (!proposal) {
        return next(new AppError('해당 ID를 가진 제안을 찾을 수 없습니다.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            proposal
        }
    });
});

// 3. 제안 수락
const acceptProposal = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { adminComment } = req.body; // 관리자의 승인 사유

    // 트랜잭션 시작
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const proposal = await Proposal.findById(id).session(session);

        if (!proposal) {
            return next(new AppError('제안을 찾을 수 없습니다.', 404));
        }

        if (proposal.status !== 'pending') {
            return next(new AppError('이미 처리된 제안입니다.', 400));
        }

        let culturalSite;
        let originalCulturalSite; // 삭제 제안 시 sourceId를 가져올 용도

        switch (proposal.proposalType) {
            case 'create':
                // 새로운 문화유산 생성
                const newCulturalSiteData = {
                    ...proposal.proposedChanges,
                    registeredBy: req.user.id,
                    proposedBy: proposal.proposedBy
                };

                if (!newCulturalSiteData.name || !newCulturalSiteData.category || !newCulturalSiteData.location || !newCulturalSiteData.sourceId) {
                    throw new AppError('새로운 문화유산 생성에 필요한 필수 정보가 누락되었습니다.', 400);
                }

                culturalSite = await CulturalSite.create([newCulturalSiteData], { session });

                break;
            case 'update':
                culturalSite = await CulturalSite.findById(proposal.culturalSite).session(session);
                if (!culturalSite) {
                    throw new AppError('수정 대상 문화유산을 찾을 수 없습니다.', 404);
                }

                // proposedChanges = {category: {oldValue: other, newValue: restaurant}}
                const updateData = {};
                // Apply proposedChanges (which now contain oldValue and newValue)
                for (const field of CULTURAL_SITE_UPDATABLE_FIELDS) {
                    if (proposal.proposedChanges[field] !== undefined && proposal.proposedChanges[field].newValue !== undefined) {
                        updateData[field] = proposal.proposedChanges[field].newValue; // Use newValue
                    }
                }

                Object.assign(culturalSite, updateData);
                await culturalSite.save({ session });

                break;
            case 'delete':
                originalCulturalSite = await CulturalSite.findById(proposal.culturalSite).session(session);
                if (!originalCulturalSite) {
                    console.warn(`삭제 대상 문화유산 ${proposal.culturalSite}를 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.`);
                } else {
                    await CulturalSite.findByIdAndDelete(proposal.culturalSite).session(session);
                }

                if (originalCulturalSite && originalCulturalSite.sourceId) {
                    await ExcludeSourceId.findOneAndUpdate(
                        { sourceId: originalCulturalSite.sourceId },
                        { sourceId: originalCulturalSite.sourceId, reason: '사용자 제안에 의해 삭제됨' },
                        { upsert: true, new: true, session }
                    );
                    console.log(`SourceId ${originalCulturalSite.sourceId} added to ExcludeSourceId collection.`);
                } else {
                    console.warn(`삭제된 문화유산의 sourceId를 ExcludeSourceId에 추가할 수 없습니다. proposal.culturalSite: ${proposal.culturalSite}`);
                }

                break;
            default:
                throw new AppError('알 수 없는 제안 유형입니다.', 400);
        }

        // 제안 상태 업데이트
        proposal.status = 'accepted';
        proposal.reviewedBy = req.user.id;
        proposal.reviewedAt = Date.now();
        proposal.adminComment = adminComment || '승인됨';
        await proposal.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            status: 'success',
            message: '제안이 성공적으로 수락되었습니다.',
            data: {
                proposal,
                culturalSite
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('제안 수락 중 트랜잭션 오류 발생:', error);
        return next(error instanceof AppError ? error : new AppError(`제안 수락 중 오류 발생: ${error.message}`, 500));
    }
});

// 4. 제안 거절
const rejectProposal = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { adminComment } = req.body; // 관리자의 거절 사유

    const proposal = await Proposal.findById(id);

    if (!proposal) {
        return next(new AppError('해당 ID를 가진 제안을 찾을 수 없습니다.', 404));
    }
    if (proposal.status !== 'pending') {
        return next(new AppError('이 제안은 이미 검토되었습니다.', 400));
    }

    proposal.status = 'rejected';
    proposal.reviewedBy = req.user.id;
    proposal.reviewedAt = Date.now();
    proposal.adminComment = adminComment || '제안이 거절되었습니다.';
    await proposal.save();

    res.status(200).json({
        status: 'success',
        message: '제안이 성공적으로 거절되었습니다.',
        data: {
            proposal
        }
    });
});

module.exports = {
    createProposal,
    getAllProposals,
    getProposalById,
    acceptProposal,
    rejectProposal
}
