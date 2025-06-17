// src/components/SidePanel/ProposalForm.jsx
import React, { useState, useEffect } from 'react';
import useUiStore from '../../store/uiStore';
// useAuthStore를 임포트하여 사용자의 역할을 가져옵니다.
import useAuthStore from '../../store/authStore';
import { useSubmitProposal, useCreateCulturalSite } from '../../hooks/useCulturalSitesQueries';

const ProposalForm = () => {
  const { proposalFormData, closeProposalForm, closeSidePanel } = useUiStore();
  const { user } = useAuthStore(); // 사용자 정보 가져오기
  const role = user?.role; // 사용자의 역할 추출

  const submitProposalMutation = useSubmitProposal(); // 기존 제안 제출 훅
  const createCulturalSiteMutation = useCreateCulturalSite(); // 새로운 문화 유적지 생성 훅 (관리자용)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    imageUrl: '',
    openingHours: '',
    address: '',
    website: '',
    proposalMessage: '', // 일반 사용자 제안 시에만 필요
    location: null,
    licenseInfo: '',
    sourceId: '',
    originalTags: {},
  });
  const [formErrors, setFormErrors] = useState({});
  const [submissionError, setSubmissionError] = useState(null); // 서버 응답 에러 메시지

  useEffect(() => {
    if (proposalFormData) {
      setFormData({
        name: proposalFormData.name || '',
        description: proposalFormData.description || '',
        category: proposalFormData.category || '',
        imageUrl: proposalFormData.imageUrl || '',
        openingHours: proposalFormData.openingHours || '',
        address: proposalFormData.address || '',
        website: proposalFormData.website || '',
        proposalMessage: '', // Always start empty for the user to fill
        location: proposalFormData.location,
        licenseInfo: proposalFormData.licenseInfo || '',
        sourceId: proposalFormData.sourceId || '',
        originalTags: proposalFormData.originalTags || {},
      });
      setFormErrors({});
      setSubmissionError(null);
    }
  }, [proposalFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
    }
    setSubmissionError(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Cultural site name is required.';
    if (!formData.category.trim()) errors.category = 'Category is required.';
    if (!formData.address.trim()) errors.address = 'Address is required.';
    // Admin이 아닌 경우에만 proposalMessage가 필수
    if (role !== 'admin' && !formData.proposalMessage.trim()) errors.proposalMessage = 'Proposal message is required.';
    if (!formData.location || !formData.location.coordinates || formData.location.coordinates.length !== 2) {
      errors.location = 'Invalid location information.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const commonSiteData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      address: formData.address,
      website: formData.website,
      imageUrl: formData.imageUrl,
      openingHours: formData.openingHours,
      licenseInfo: formData.licenseInfo,
      sourceId: formData.sourceId,
      originalTags: formData.originalTags,
    };

    try {
      if (role === 'admin') {
        // 관리자인 경우, 즉시 문화 유적지 추가 엔드포인트 호출
        await createCulturalSiteMutation.mutateAsync(commonSiteData);
        alert('New cultural site added successfully by admin!');
      } else {
        // 일반 사용자인 경우, 제안 제출 엔드포인트 호출
        const proposalBody = {
          proposalType: "create",
          proposalMessage: formData.proposalMessage,
          ...commonSiteData,
        };
        await submitProposalMutation.mutateAsync(proposalBody);
        alert('Proposal submitted successfully!');
      }
      closeProposalForm();
      closeSidePanel();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred.';
      setSubmissionError(errorMessage);
    }
  };

  // 현재 제출 상태를 결정합니다.
  const isSubmitting = role === 'admin' ? createCulturalSiteMutation.isLoading : submitProposalMutation.isLoading;

  if (isSubmitting) {
    return (
      <div className="p-4 text-gray-600 text-center relative">
         <div className="absolute top-4 right-4">
            <button
              className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
              onClick={closeProposalForm}
              aria-label="Close proposal form"
            >
              &times;
            </button>
          </div>
        <p className="mt-10">Submitting...</p>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mt-4"></div>
      </div>
    );
  }

  if (!proposalFormData) {
    return <div className="p-4 text-gray-600 text-center">Loading cultural site information to propose...</div>;
  }

  const categories = ['museum', 'gallery', 'memorial', 'historic_site', 'park', 'other'];

  return (
    <div className="flex-grow overflow-y-auto p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
          onClick={closeProposalForm}
          aria-label="Close proposal form"
        >
          &times;
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4 pr-10">
        {role === 'admin' ? 'Add New Cultural Site (Admin)' : 'Propose New Cultural Site'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.keys(formErrors).length > 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Validation Error!</strong>
            <span className="block sm:inline"> Please correct the highlighted fields.</span>
          </div>
        )}

        {submissionError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Submission Failed!</strong>
            <span className="block sm:inline"> {submissionError}</span>
          </div>
        )}

        {/* Editable Fields */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL</label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., http://example.com/image.jpg"
          />
        </div>

        <div>
          <label htmlFor="openingHours" className="block text-sm font-medium text-gray-700">Opening Hours</label>
          <input
            type="text"
            id="openingHours"
            name="openingHours"
            value={formData.openingHours}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Mo-Fr 09:00-17:00"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., https://example.com"
          />
        </div>

        {/* Non-editable fields (display only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Latitude (Read-Only)</label>
          <input
            type="text"
            value={formData.location?.coordinates[1] || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
            readOnly
          />
          {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Longitude (Read-Only)</label>
          <input
            type="text"
            value={formData.location?.coordinates[0] || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Original OSM ID (Read-Only)</label>
          <input
            type="text"
            value={formData.sourceId}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
            readOnly
          />
        </div>

        {/* Proposal Message (Conditional: only for non-admins) */}
        {role !== 'admin' && (
          <div>
            <label htmlFor="proposalMessage" className="block text-sm font-medium text-gray-700">Proposal Message *</label>
            <textarea
              id="proposalMessage"
              name="proposalMessage"
              value={formData.proposalMessage}
              onChange={handleChange}
              rows="4"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide a detailed reason for proposing this cultural site."
            ></textarea>
            {formErrors.proposalMessage && <p className="text-red-500 text-xs mt-1">{formErrors.proposalMessage}</p>}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : (role === 'admin' ? 'Add New Cultural Site' : 'Submit Proposal')}
        </button>
      </form>
    </div>
  );
};

export default ProposalForm;