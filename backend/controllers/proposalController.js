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
const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');

// Create Proposal by User
const createProposal = asyncHandler(async (req, res, next) => {
    const { proposalType, proposalMessage, ...rawData } = req.body;
    if (!proposalType) {
        return next(new AppError('Proposal type (proposalType) is required.', 400));
    }

    let newProposal;
    const userId = req.user.id; // Get the ID of the proposing user

    // --- NEW: Universal check for any existing pending proposal for the same cultural site by the same user
    // This applies to 'update' and 'delete' proposal types where 'culturalSite' ID is relevant.
    // 'create' proposals are handled separately as their uniqueness is based on 'sourceId'.
    if (proposalType === 'update' || proposalType === 'delete') {
        const culturalSiteId = rawData.culturalSite;
        if (!culturalSiteId) {
            return next(new AppError('Cultural site ID (culturalSite) is required.', 400));
        }

        const existingPendingProposal = await Proposal.findOne({
            culturalSite: culturalSiteId,
            proposedBy: userId,
            status: 'pending' // Check for *any* type of pending proposal
        });

        if (existingPendingProposal) {
            let message = 'A ';
            if (existingPendingProposal.proposalType === 'update') {
                message += 'modification proposal';
            } else if (existingPendingProposal.proposalType === 'delete') {
                message += 'deletion proposal';
            } else if (existingPendingProposal.proposalType === 'create') {
                // This case should ideally not be hit if culturalSiteId is present,
                // but good to cover.
                message += 'creation proposal';
            }
            message += ' for this cultural site has already been submitted and is pending review.';
            return next(new AppError(message, 409));
        }
    }

    switch (proposalType) {
        case 'create':
            const proposedSourceId = rawData.sourceId;
            if (!proposedSourceId) {
                return next(new AppError('sourceId is required when proposing a new cultural site. (e.g., node/12345, way/56789)', 400));
            }

            const sourceIdParts = proposedSourceId.split('/');
            if (sourceIdParts.length !== 2 || (sourceIdParts[0] !== 'node' && sourceIdParts[0] !== 'way' &&
                sourceIdParts[0] !== 'relation') || isNaN(parseInt(sourceIdParts[1]))) {
                return next(new AppError('Invalid sourceId format. (e.g., node/12345, way/56789, relation/123)', 400));
            }
            const osmType = sourceIdParts[0];
            const osmId = parseInt(sourceIdParts[1]);

            const existingCulturalSite = await CulturalSite.findOne({ sourceId: proposedSourceId });
            if (existingCulturalSite) {
                return next(new AppError(`A cultural site with sourceId (${proposedSourceId}) is already registered. Please use a modification proposal.`, 409));
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
                return next(new AppError('A creation proposal for this OSM ID has already been submitted and is pending review.', 409));
            }

            let actualOsmElement;
            let actualSourceId;
            let actualLocation;

            try {
                const osmResponse = await queryOverpass(singleElementQuery(osmType, osmId));
                actualOsmElement = osmResponse.elements[0];

                if (!actualOsmElement) {
                    return next(new AppError(`No element corresponding to the proposed OSM ID (${proposedSourceId}) could be found in Overpass API.`, 404));
                }

                actualSourceId = `${actualOsmElement.type}/${actualOsmElement.id}`;
                const processedFromOsm = await processOsmElementForCulturalSite(actualOsmElement);
                actualLocation = processedFromOsm.location;

                if (proposedSourceId !== actualSourceId) {
                    console.warn(`Client provided sourceId mismatch: Expected ${actualSourceId}, Got ${proposedSourceId}`);
                    return next(new AppError('The provided sourceId does not match the actual OSM data.', 400));
                }

                if (!rawData.location) {
                    return next(new AppError('Valid location information (location) is required when proposing a new cultural site.', 400));
                }
                if (rawData.location.type !== 'Point' || rawData.location.coordinates.length !== 2 || !isValidLatLng(rawData.location.coordinates[0], rawData.location.coordinates[1])) {
                    return next(new AppError('The provided location information (location) format is invalid.', 400));
                }
                if (!isPointInChemnitz(rawData.location.coordinates[1], rawData.location.coordinates[0])) {
                    return next(new AppError('The provided location information (location) is outside Chemnitz.', 400));
                }

                const clientCoord = [rawData.location.coordinates[0], rawData.location.coordinates[1]];
                const osmCoord = [actualLocation.coordinates[0], actualLocation.coordinates[1]];

                if (!areCoordinatesMatching(clientCoord, osmCoord)) {
                    return next(new AppError('The provided location information does not match the actual OSM node. Please select the exact location on the map.', 400));
                }

            } catch (error) {
                console.error('Error fetching or processing OSM data during proposal creation:', error);
                if (error.response) {
                    console.error('Overpass API Response Error:', error.response.status, error.response.data);
                    return next(new AppError(`OSM API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`, error.response.status));
                }
                return next(new AppError(`Unknown error fetching or processing OSM data: ${error.message}`, 500));
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
                return next(new AppError(`Invalid category value: ${proposedChangesForCreate.category}`, 400));
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
                return next(new AppError('Cultural site to modify not found.', 404));
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
                return next(new AppError('Valid changes are required for a modification proposal. (Please provide values different from existing ones)', 400));
            }

            if (proposedChangesForUpdate.category && proposedChangesForUpdate.category.newValue && !CULTURAL_CATEGORY.includes(proposedChangesForUpdate.category.newValue)) {
                return next(new AppError(`Invalid category value: ${proposedChangesForUpdate.category.newValue}`, 400));
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
                return next(new AppError('Cultural site to delete not found.', 404));
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
            return next(new AppError('Unknown proposal type.', 400));
    }

    res.status(201).json({
        status: 'success',
        message: 'Proposal successfully submitted.',
        data: {
            proposal: newProposal
        }
    });
});

// user 본인이 작성한 proposals 가지고오기
const getProposalsByUserId = asyncHandler(async (req, res, next) => {
    const userId = req.user.id; // 현재 로그인한 사용자의 ID를 가져옵니다.

    const proposals = await Proposal.find({ proposedBy: userId })
        .populate('culturalSite', 'name description category address website imageUrl openingHours') // 관련 문화유산 정보 포함
        .populate('proposedBy', 'name email') // 제안한 사용자 정보 포함
        .sort('-createdAt'); // 최신순으로 정렬

    res.status(200).json({
        status: 'success',
        results: proposals.length,
        data: {
            proposals
        }
    });
});

// 모든 proposals 조회
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

// 특정 제안 상세 조회
const getProposalById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const proposal = await Proposal.findById(id)
        .populate('culturalSite', 'name sourceId location')
        .populate('proposedBy', 'name email')
        .populate('reviewedBy', 'name email');

    if (!proposal) {
        return next(new AppError('No proposal found with that ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            proposal
        }
    });
});

// 제안 수락
const acceptProposal = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { adminComment } = req.body;

    // 트랜잭션 시작
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const proposal = await Proposal.findById(id).session(session);

        if (!proposal) {
            return next(new AppError('Proposal not found.', 404));
        }

        if (proposal.status !== 'pending') {
            return next(new AppError('This proposal has already been processed.', 400));
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
                    throw new AppError('Missing required information for creating a new cultural site.', 400);
                }

                culturalSite = await CulturalSite.create([newCulturalSiteData], { session });

                break;
            case 'update':
                culturalSite = await CulturalSite.findById(proposal.culturalSite).session(session);
                if (!culturalSite) {
                    throw new AppError('Target cultural site for modification not found.', 404);
                }

                const updateData = {};
                for (const field of CULTURAL_SITE_UPDATABLE_FIELDS) {
                    if (proposal.proposedChanges[field] !== undefined && proposal.proposedChanges[field].newValue !== undefined) {
                        updateData[field] = proposal.proposedChanges[field].newValue;
                    }
                }

                Object.assign(culturalSite, updateData);
                await culturalSite.save({ session });

                break;
            case 'delete':
                originalCulturalSite = await CulturalSite.findById(proposal.culturalSite).session(session);
                if (!originalCulturalSite) {
                    console.warn(`Cultural site to delete ${proposal.culturalSite} not found. It might have been deleted already.`);
                } else {
                    // 1. Delete associated reviews (already correct based on previous understanding)
                    await Review.deleteMany({ culturalSite: originalCulturalSite._id }).session(session);
                    console.log(`Deleted reviews for cultural site: ${originalCulturalSite._id}`);

                    // 2. Remove the culturalSite ID from all users' favoriteSites arrays
                    // Use $pull to remove all occurrences of the culturalSite's ID
                    await User.updateMany(
                        { culturalSites: originalCulturalSite._id }, // Find users who have this site in their favorites
                        { $pull: { culturalSites: originalCulturalSite._id } }, // Remove it from the array
                        { session }
                    );
                    console.log(`Removed cultural site ${originalCulturalSite._id} from users' favorite lists.`);

                    // 3. Delete the cultural site itself
                    await CulturalSite.findByIdAndDelete(proposal.culturalSite).session(session);
                    console.log(`Cultural site ${originalCulturalSite._id} successfully deleted.`);
                }

                if (originalCulturalSite && originalCulturalSite.sourceId) {
                    await ExcludeSourceId.findOneAndUpdate(
                        { sourceId: originalCulturalSite.sourceId },
                        { sourceId: originalCulturalSite.sourceId, reason: 'Deleted by user proposal' },
                        { upsert: true, new: true, session }
                    );
                    console.log(`SourceId ${originalCulturalSite.sourceId} added to ExcludeSourceId collection.`);
                } else {
                    console.warn(`Could not add sourceId to ExcludeSourceId for deleted cultural site. proposal.culturalSite: ${proposal.culturalSite}`);
                }

                break;
            default:
                throw new AppError('Unknown proposal type.', 400);
        }

        // 제안 상태 업데이트
        proposal.status = 'accepted';
        proposal.reviewedBy = req.user.id;
        proposal.reviewedAt = Date.now();
        proposal.adminComment = adminComment || 'Accepted';
        await proposal.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            status: 'success',
            message: 'Proposal successfully accepted.',
            data: {
                proposal,
                culturalSite
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Transaction error during proposal acceptance:', error);
        return next(error instanceof AppError ? error : new AppError(`Error accepting proposal: ${error.message}`, 500));
    }
});

// 제안 거절
const rejectProposal = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { adminComment } = req.body; // 관리자의 거절 사유

    const proposal = await Proposal.findById(id);

    if (!proposal) {
        return next(new AppError('No proposal found with that ID.', 404));
    }
    if (proposal.status !== 'pending') {
        return next(new AppError('This proposal has already been reviewed.', 400));
    }

    proposal.status = 'rejected';
    proposal.reviewedBy = req.user.id;
    proposal.reviewedAt = Date.now();
    proposal.adminComment = adminComment || 'Proposal rejected.';
    await proposal.save();

    res.status(200).json({
        status: 'success',
        message: 'Proposal successfully rejected.',
        data: {
            proposal
        }
    });
});

module.exports = {
    createProposal,
    getProposalsByUserId,
    getAllProposals,
    getProposalById,
    acceptProposal,
    rejectProposal
}