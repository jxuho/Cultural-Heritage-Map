import React, { useState, useEffect, ChangeEvent } from "react";
import useUiStore from "../../store/uiStore";
import useAuthStore from "../../store/authStore";
import { useCreateCulturalSite } from "../../hooks/data/useCulturalSitesQueries";
import { useSubmitProposal } from "../../hooks/data/useProposalQueries";
import { CULTURAL_CATEGORY } from "../../config/culturalSiteConfig";
import { Point } from "leaflet";

// --- Types & Interfaces ---
interface LocationData {
  type: Point;
  coordinates: [number, number]; // [longitude, latitude]
}

interface FormData {
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  openingHours: string;
  address: string;
  website: string;
  proposalMessage: string;
  location: LocationData | null;
  licenseInfo: string;
  sourceId: string;
  originalTags: Record<string, any>;
}

interface FormErrors {
  name?: string;
  category?: string;
  address?: string;
  proposalMessage?: string;
  location?: string;
}

const CreateForm: React.FC = () => {
  // --- Zustand ---
  const { createFormData, closeCreateForm, closeSidePanel } = useUiStore();
  const { user } = useAuthStore();
  const role = user?.role;

  // --- Mutations ---
  const submitProposalMutation = useSubmitProposal();
  const createCulturalSiteMutation = useCreateCulturalSite();

  // --- State ---
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "",
    imageUrl: "",
    openingHours: "",
    address: "",
    website: "",
    proposalMessage: "",
    location: null,
    licenseInfo: "",
    sourceId: "",
    originalTags: {},
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (createFormData) {
      setFormData({
        name: createFormData.name || "",
        description: createFormData.description || "",
        category: createFormData.category || "",
        imageUrl: createFormData.imageUrl || "",
        openingHours: createFormData.openingHours || "",
        address: createFormData.address || "",
        website: createFormData.website || "",
        proposalMessage: "",
        location: createFormData.location || null,
        licenseInfo: createFormData.licenseInfo || "",
        sourceId: createFormData.sourceId || "",
        originalTags: createFormData.originalTags || {},
      });
      setFormErrors({});
      setSubmissionError(null);
    }
  }, [createFormData]);

  // --- Handlers ---
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // 에러 상태 초기화
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
    }
    setSubmissionError(null);
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) errors.name = "Cultural site name is required.";
    if (!formData.category.trim()) errors.category = "Category is required.";
    if (!formData.address.trim()) errors.address = "Address is required.";

    if (role !== "admin" && !formData.proposalMessage.trim())
      errors.proposalMessage = "Proposal message is required.";

    if (
      !formData.location ||
      !formData.location.coordinates ||
      formData.location.coordinates.length !== 2
    ) {
      errors.location = "Invalid location information.";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
      location: {
        type: "Point" as const,
        coordinates: formData.location!.coordinates,
      },
      address: formData.address,
      website: formData.website,
      imageUrl: formData.imageUrl,
      openingHours: formData.openingHours,
      licenseInfo: formData.licenseInfo,
      sourceId: formData.sourceId,
      originalTags: formData.originalTags,
    };

    try {
      if (role === "admin") {
        await createCulturalSiteMutation.mutateAsync(commonSiteData);
        alert("New cultural site added successfully by admin!");
      } else {
        const proposalBody = {
          proposalType: "create" as const,
          proposalMessage: formData.proposalMessage,
          ...commonSiteData,
        };
        await submitProposalMutation.mutateAsync(proposalBody);
        alert("Proposal submitted successfully!");
      }
      closeCreateForm();
      closeSidePanel();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unknown error occurred.";
      setSubmissionError(errorMessage);
    }
  };

  // --- Derived State ---
  const isSubmitting =
    role === "admin"
      ? createCulturalSiteMutation.isPending // v5에서는 isLoading 대신 isPending 사용 권장
      : submitProposalMutation.isPending;

  const categories = CULTURAL_CATEGORY;

  // --- Rendering ---
  if (isSubmitting) {
    return (
      <div className="p-4 text-gray-600 text-center relative">
        <div className="absolute top-4 right-4">
          <button
            className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
            onClick={() => {
              closeCreateForm();
              closeSidePanel();
            }}
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

  if (!createFormData) {
    return (
      <div className="p-4 text-gray-600 text-center">
        Loading cultural site information to propose...
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
          onClick={() => {
            closeCreateForm();
            closeSidePanel();
          }}
          aria-label="Close proposal form"
        >
          &times;
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4 pr-10">
        {role === "admin"
          ? "Add New Cultural Site (Admin)"
          : "Propose New Cultural Site"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {Object.keys(formErrors).length > 0 && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Validation Error!</strong>
            <span className="block sm:inline">
              {" "}
              Please correct the highlighted fields.
            </span>
          </div>
        )}

        {submissionError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Submission Failed!</strong>
            <span className="block sm:inline"> {submissionError}</span>
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {formErrors.name && (
            <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {formErrors.category && (
            <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
          )}
        </div>

        {/* Image URL */}
        <div>
          <label
            htmlFor="imageUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Image URL
          </label>
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

        {/* Opening Hours */}
        <div>
          <label
            htmlFor="openingHours"
            className="block text-sm font-medium text-gray-700"
          >
            Opening Hours
          </label>
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

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700"
          >
            Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {formErrors.address && (
            <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700"
          >
            Website
          </label>
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

        {/* Location Info (Read-Only) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Latitude (Read-Only)
            </label>
            <input
              type="text"
              value={formData.location?.coordinates[1] || ""}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Longitude (Read-Only)
            </label>
            <input
              type="text"
              value={formData.location?.coordinates[0] || ""}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
        </div>
        {formErrors.location && (
          <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
        )}

        {/* Source ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Original OSM ID (Read-Only)
          </label>
          <input
            type="text"
            value={formData.sourceId}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
            readOnly
          />
        </div>

        {/* Proposal Message */}
        {role !== "admin" && (
          <div>
            <label
              htmlFor="proposalMessage"
              className="block text-sm font-medium text-gray-700"
            >
              Proposal Message *
            </label>
            <textarea
              id="proposalMessage"
              name="proposalMessage"
              value={formData.proposalMessage}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide a detailed reason for proposing this cultural site."
            ></textarea>
            {formErrors.proposalMessage && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.proposalMessage}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : role === "admin"
              ? "Add New Cultural Site"
              : "Submit Proposal"}
        </button>
      </form>
    </div>
  );
};

export default CreateForm;
