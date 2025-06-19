// backend/models/Proposal.js
const mongoose = require('mongoose');
const { CULTURAL_SITE_UPDATABLE_FIELDS } = require('../config/culturalSiteConfig'); // CULTURAL_SITE_UPDATABLE_FIELDS 임포트

const proposalSchema = new mongoose.Schema({
    culturalSite: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CulturalSite',
        // proposalType이 'create'가 아닐 때만 culturalSite ID가 필수
        required: [
            function () { return this.proposalType !== 'create'; },
            '수정 또는 삭제 제안 시 문화유산 ID(culturalSite)는 필수입니다.'
        ]
    },
    proposedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '제안한 사용자 ID는 필수입니다.']
    },
    proposalType: { // 제안의 종류 (추가: 'delete')
        type: String,
        enum: ['create', 'update', 'delete'], // 'create': 새로운 문화유산 등록 제안, 'update': 기존 문화유산 수정 제안, 'delete': 문화유산 삭제 제안
        required: [true, '제안 유형은 필수입니다.']
    },
    // 제안된 변경 사항을 저장할 객체. 삭제 제안의 경우 비어있을 수 있음.
    proposedChanges: {
        type: mongoose.Schema.Types.Mixed,
        validate: {
            validator: function (v) {
                this.validatorMessage = '제안된 변경 사항이 유효하지 않습니다.';

                if (this.proposalType === 'update' || this.proposalType === 'create') {
                    if (!v || typeof v !== 'object' || Object.keys(v).length === 0) {
                        this.validatorMessage = '생성 또는 수정 제안의 경우 제안된 변경 사항이 비어있을 수 없습니다.'; 
                        return false;
                    }

                    // --- 'create' 타입 제안에 대한 유효성 검사 ---
                    if (this.proposalType === 'create') {
                        // 서버에서 주입되는 필드 포함 (name, category는 클라이언트도 제공해야 함)
                        const requiredFieldsForCreate = ['name', 'category', 'location', 'sourceId', 'originalTags']; // 'originalTags' 추가!
                        for (const field of requiredFieldsForCreate) {
                            if (v[field] === undefined || v[field] === null || (typeof v[field] === 'string' && v[field].trim() === '')) {
                                this.validatorMessage = `새로운 문화유산 제안 시 필수 필드(${field})가 누락되었습니다.`; 
                                return false;
                            }
                        }

                        // location GeoJSON 형식 유효성 검사 (서버에서 올바르게 주입했는지 재확인)
                        if (v.location.type !== 'Point' || !Array.isArray(v.location.coordinates) || v.location.coordinates.length !== 2 ||
                            v.location.coordinates[0] < -180 || v.location.coordinates[0] > 180 ||
                            v.location.coordinates[1] < -90 || v.location.coordinates[1] > 90) {
                            this.validatorMessage = '새로운 문화유산 제안 시 유효한 위치 정보(location)가 필요합니다.'; 
                            return false;
                        }

                        // 허용된 필드만 포함되었는지 검사 (화이트리스트 방식)
                        const allowedFieldsForCreate = new Set([
                            ...CULTURAL_SITE_UPDATABLE_FIELDS,
                            'sourceId',
                            'location',
                            'licenseInfo',
                            'originalTags' // 'originalTags' 추가! [cite: 95]
                        ]);
                        const proposedKeys = Object.keys(v); 
                        for (const key of proposedKeys) {
                            if (!allowedFieldsForCreate.has(key)) {
                                this.validatorMessage = `새로운 문화유산 제안에 허용되지 않은 필드(${key})가 포함되어 있습니다.`;
                                return false;
                            }
                            // For 'create', proposedChanges should directly contain the new values.
                            // We don't expect oldValue for 'create' type.
                            if (typeof v[key] === 'object' && v[key] !== null && ('oldValue' in v[key] || 'newValue' in v[key])) {
                                this.validatorMessage = `생성 제안의 경우 proposedChanges 필드는 직접 새 값을 포함해야 합니다. (oldValue, newValue 구조 불가) (${key})`; 
                                return false;
                            }
                        }
                    }

                    // --- 'update' 타입 제안에 대한 필드 유효성 검사 ---
                    // ... 기존 로직 그대로 유지 ...

                } else if (this.proposalType === 'delete') {
                    if (v && Object.keys(v).length > 0) {
                        this.validatorMessage = '문화유산 삭제 제안에는 변경 사항이 포함될 수 없습니다.';
                        return false;
                    }
                }
                return true; 
            },
            message: function () {
                return this.validatorMessage || '제안된 변경 사항이 유효하지 않습니다.';
            }
        }
    },
    proposalMessage: {
        type: String,
        trim: true,
        maxlength: [500, '제안 메시지는 500자를 초과할 수 없습니다.'],
        default: '' // 메시지가 없을 경우 기본값
    },
    status: { // 제안의 상태 (대기 중, 수락됨, 거절됨)
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    reviewedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [
            function () { return this.status === 'accepted' || this.status === 'rejected'; },
            '제안이 검토된 경우 검토한 관리자 ID는 필수입니다.'
        ]
    },
    adminComment: {
        type: String,
        required: [
            function () { return this.status === 'accepted' || this.status === 'rejected'; },
            '제안이 검토된 경우 관리자 코멘트는 필수입니다.'
        ]
    },
    reviewedAt: Date, // 제안 검토 날짜
}, {
    timestamps: true // createdAt, updatedAt 자동 추가
});


proposalSchema.index(
    { culturalSite: 1, proposedBy: 1, status: 1 },
    {
        unique: true,
        // 이 인덱스는 proposalType이 'create'가 아니고,
        // culturalSite 필드가 존재하며 null이 아닌 경우에만 적용됩니다.
        // 즉, 'create' 타입의 제안(culturalSite가 null)에는 이 고유성 제약이 적용되지 않습니다.
        partialFilterExpression: {
            proposalType: { $ne: 'create' },
            culturalSite: { $exists: true, $ne: null }
        },
        name: 'unique_pending_update_delete_proposal' // 인덱스 이름을 명확하게 지정
    }
);

module.exports = mongoose.model('Proposal', proposalSchema);