import React, { useState, useEffect, ChangeEvent } from "react";
import useUiStore from "../../store/uiStore";
import useAuthStore from "../../store/authStore";
import { useUpdateCulturalSite } from "../../hooks/data/useCulturalSitesQueries";
import { useSubmitProposal } from "../../hooks/data/useProposalQueries";
import { CULTURAL_CATEGORY } from "../../config/culturalSiteConfig";
import { Place } from "../../types/place";

// 폼 내부 상태를 위한 인터페이스
interface UpdateFormData {
  _id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  openingHours: string;
  address: string;
  website: string;
  proposalMessage: string;
  location: {
    type: "Point";
    coordinates: number[];
  } | null;
  licenseInfo: string;
  sourceId: string;
  originalTags: Record<string, any>;
  initialData: Place | null;
}

interface FormErrors {
  name?: string;
  category?: string;
  address?: string;
  location?: string;
  proposalMessage?: string;
  noChanges?: string;
}

const UpdateForm: React.FC = () => {
  const { updateFormData, closeUpdateForm, closeSidePanel } = useUiStore();
  const { user } = useAuthStore();
  const role = user?.role;

  const submitProposalMutation = useSubmitProposal();
  const updateCulturalSiteMutation = useUpdateCulturalSite();

  const [formData, setFormData] = useState<UpdateFormData>({
    _id: "",
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
    initialData: null,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [proposalType, setProposalType] = useState<"update" | "delete">("update");
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    if (updateFormData) {
      const data = updateFormData as Place;
      setFormData({
        _id: data._id || "",
        name: data.name || "",
        description: data.description || "",
        category: data.category || "",
        imageUrl: data.imageUrl || "",
        openingHours: data.openingHours || "",
        address: data.address || "",
        website: data.website || "",
        proposalMessage: "",
        location: data.location ? { ...data.location, type: "Point" } : null,
        licenseInfo: data.licenseInfo || "",
        sourceId: data.sourceId || "",
        originalTags: data.originalTags || {},
        initialData: data,
      });
      setFormErrors({});
      setSubmissionError(null);
      setBackendError(null);
      setProposalType("update");
    }
  }, [updateFormData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
    }
    setSubmissionError(null);
    setBackendError(null);
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.name.trim() && proposalType === "update")
      errors.name = "Cultural site name is required.";
    if (!formData.category.trim() && proposalType === "update")
      errors.category = "Category is required.";
    if (!formData.address.trim() && proposalType === "update")
      errors.address = "Address is required.";
    
    if (
      (!formData.location ||
        !formData.location.coordinates ||
        formData.location.coordinates.length !== 2) &&
      proposalType === "update"
    ) {
      errors.location = "Invalid location information.";
    }

    if (role !== "admin" && !formData.proposalMessage.trim()) {
      errors.proposalMessage = "Proposal message is required.";
    }

    if (role !== "admin" && proposalType === "update" && formData.initialData) {
      // 원본 로직의 변경 감지 (일부 필드 제외)
      const hasChanges = (Object.keys(formData) as Array<keyof UpdateFormData>).some((key) => {
        // 원본의 "^id" 오타 수정 포함 (_id)
        if (["_id", "proposalMessage", "initialData", "proposalType"].includes(key)) {
          return false;
        }
        if (key === "location") {
          const currentCoords = formData.location?.coordinates;
          const initialCoords = formData.initialData?.location?.coordinates;
          return (
            currentCoords?.[0] !== initialCoords?.[0] ||
            currentCoords?.[1] !== initialCoords?.[1]
          );
        }
        // 타입 안전성을 위해 인덱스 시그니처 대응
        return formData[key] !== (formData.initialData as any)[key];
      });

      if (!hasChanges && !formData.proposalMessage.trim()) {
        errors.noChanges = "No changes detected. Please modify a field or provide a proposal message.";
      }
    }
    return errors;
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionError(null);
    setBackendError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const currentSiteData = {
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
      if (role === "admin") {
        await updateCulturalSiteMutation.mutateAsync({
          culturalSiteId: formData._id,
          updateData: currentSiteData as Partial<Place>,
        });
        alert("Cultural site updated successfully by admin!");
      } else {
        let proposalBody: any;

        if (proposalType === "update") {
          const proposedChanges: any = {};
          for (const key in currentSiteData) {
            const k = key as keyof typeof currentSiteData;
            if (k === "location") {
              const currentCoords = currentSiteData.location?.coordinates;
              const initialCoords = formData.initialData?.location?.coordinates;
              if (
                currentCoords?.[0] !== initialCoords?.[0] ||
                currentCoords?.[1] !== initialCoords?.[1]
              ) {
                proposedChanges.location = currentSiteData.location;
              }
            } else if (currentSiteData[k] !== (formData.initialData as any)[k]) {
              proposedChanges[k] = currentSiteData[k];
            }
          }

          proposalBody = {
            proposalType: "update",
            proposalMessage: formData.proposalMessage,
            culturalSite: formData._id,
            ...proposedChanges,
          };
        } else {
          proposalBody = {
            proposalType: "delete",
            proposalMessage: formData.proposalMessage,
            culturalSite: formData._id,
          };
        }

        await submitProposalMutation.mutateAsync(proposalBody);
        alert(`Proposal (${proposalType}) submitted successfully!`);
      }
      closeUpdateForm();
      closeSidePanel();
    } catch (error: any) {
      if (error.response?.data?.message?.includes("E11000")) {
        setBackendError(
          "A pending proposal for this site already exists from your account. Please wait for it to be processed."
        );
      } else {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred during submission.";
        setSubmissionError(errorMessage);
      }
    }
  };

  // React Query 버전에 따라 isLoading 또는 isPending 사용
  const isSubmitting = role === "admin"
    ? updateCulturalSiteMutation.isPending
    : submitProposalMutation.isPending;

  if (isSubmitting) {
    return (
      <div className="p-4 text-gray-600 text-center relative">
        <div className="absolute top-4 right-4">
          <button
            className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
            onClick={() => {
              closeUpdateForm();
              closeSidePanel();
            }}
            aria-label="Close update form"
          >
            &times;
          </button>
        </div>
        <p className="mt-10">Submitting...</p>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mt-4"></div>
      </div>
    );
  }

  if (!updateFormData) {
    return (
      <div className="p-4 text-gray-600 text-center">
        Loading cultural site information for update...
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
          onClick={() => {
            closeUpdateForm();
            closeSidePanel();
          }}
          aria-label="Close update form"
        >
          &times;
        </button>
      </div>

      <h2 className="text-xl font-bold mb-4 pr-10">
        {role === "admin"
          ? "Update Cultural Site (Admin)"
          : "Propose Cultural Site Modification"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {(Object.keys(formErrors).length > 0 ||
          submissionError ||
          backendError) && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Submission Error!</strong>
            {backendError && (
              <span className="block sm:inline"> {backendError}</span>
            )}
            {submissionError && (
              <span className="block sm:inline"> {submissionError}</span>
            )}
            {formErrors.noChanges && (
              <span className="block sm:inline"> {formErrors.noChanges}</span>
            )}
            {Object.keys(formErrors).length > 0 &&
              !backendError &&
              !submissionError && (
                <span className="block sm:inline">
                  {" "}Please correct the highlighted fields.
                </span>
              )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Site ID (Read-Only)
          </label>
          <input
            type="text"
            value={formData._id}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed"
            readOnly
          />
        </div>

        <fieldset disabled={proposalType === "delete"}>
          <legend className="sr-only">Cultural Site Details</legend>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            ></textarea>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">Select Category</option>
              {CULTURAL_CATEGORY.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {formErrors.category && (
              <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
            )}
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., http://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="openingHours" className="block text-sm font-medium text-gray-700">
              Opening Hours
            </label>
            <input
              type="text"
              id="openingHours"
              name="openingHours"
              value={formData.openingHours}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., Mo-Fr 09:00-17:00"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {formErrors.address && (
              <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
            )}
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., https://example.com"
            />
          </div>

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
            {formErrors.location && (
              <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>
            )}
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
        </fieldset>

        {role !== "admin" && (
          <div>
            <label htmlFor="proposalMessage" className="block text-sm font-medium text-gray-700">
              Proposal Message *
            </label>
            <textarea
              id="proposalMessage"
              name="proposalMessage"
              value={formData.proposalMessage}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={
                proposalType === "update"
                  ? "Please provide a detailed reason for proposing these modifications."
                  : "Please provide a detailed reason for suggesting the deletion of this cultural site."
              }
            ></textarea>
            {formErrors.proposalMessage && (
              <p className="text-red-500 text-xs mt-1">
                {formErrors.proposalMessage}
              </p>
            )}
          </div>
        )}

        {role !== "admin" && (
          <div className="flex justify-between mt-4 space-x-2">
            <button
              type="button"
              onClick={() => setProposalType("update")}
              className={`flex-1 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                proposalType === "update"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Update Site
            </button>
            <button
              type="button"
              onClick={() => setProposalType("delete")}
              className={`flex-1 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                proposalType === "delete"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Delete Site
            </button>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : role === "admin"
            ? "Update Cultural Site"
            : proposalType === "update"
            ? "Submit Modification Proposal"
            : "Submit Deletion Proposal"}
        </button>
      </form>
    </div>
  );
};

export default UpdateForm;