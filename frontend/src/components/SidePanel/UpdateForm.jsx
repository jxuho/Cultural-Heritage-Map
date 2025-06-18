// src/components/SidePanel/UpdateForm.jsx
import { useState, useEffect } from "react";
import useUiStore from "../../store/uiStore";
import useAuthStore from "../../store/authStore";
import {
  useSubmitProposal,
  useUpdateCulturalSite,
} from "../../hooks/useCulturalSitesQueries";

const UpdateForm = () => {
  const { updateFormData, closeUpdateForm, closeSidePanel } = useUiStore();
  const { user } = useAuthStore();
  const role = user?.role;

  const submitProposalMutation = useSubmitProposal();
  const updateCulturalSiteMutation = useUpdateCulturalSite();

  const [formData, setFormData] = useState({
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
  const [formErrors, setFormErrors] = useState({});
  const [submissionError, setSubmissionError] = useState(null);
  const [proposalType, setProposalType] = useState("update");

  // New state to hold specific backend error messages
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    if (updateFormData) {
      setFormData({
        _id: updateFormData._id || "",
        name: updateFormData.name || "",
        description: updateFormData.description || "",
        category: updateFormData.category || "",
        imageUrl: updateFormData.imageUrl || "",
        openingHours: updateFormData.openingHours || "",
        address: updateFormData.address || "",
        website: updateFormData.website || "",
        proposalMessage: "",
        location: updateFormData.location,
        licenseInfo: updateFormData.licenseInfo || "",
        sourceId: updateFormData.sourceId || "",
        originalTags: updateFormData.originalTags || {},
        initialData: updateFormData,
      });
      setFormErrors({});
      setSubmissionError(null);
      setBackendError(null); // Reset backend error when form data changes
      setProposalType("update");
    }
  }, [updateFormData]);

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
    setBackendError(null); // Clear backend error on input change
  };

  const validateForm = () => {
    const errors = {};
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

    if (role !== "admin" && proposalType === "update") {
      const hasChanges = Object.keys(formData).some((key) => {
        if (
          ["^id", "proposalMessage", "initialData", "proposalType"].includes(
            key
          )
        ) {
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
        return formData[key] !== formData.initialData[key];
      });

      if (!hasChanges && !errors.proposalMessage) {
        // Ensure proposal message is there if no other changes
        errors.noChanges =
          "No changes detected. Please modify a field or provide a proposal message.";
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError(null);
    setBackendError(null); // Clear any previous backend errors on new submission

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
          updateData: currentSiteData,
        });
        alert("Cultural site updated successfully by admin!");
      } else {
        let proposalBody;

        if (proposalType === "update") {
          const proposedChanges = {};
          for (const key in currentSiteData) {
            if (key === "location") {
              const currentCoords = currentSiteData.location?.coordinates;
              const initialCoords = formData.initialData?.location?.coordinates;
              if (
                currentCoords?.[0] !== initialCoords?.[0] ||
                currentCoords?.[1] !== initialCoords?.[1]
              ) {
                proposedChanges.location = currentSiteData.location;
              }
            } else if (currentSiteData[key] !== formData.initialData[key]) {
              proposedChanges[key] = currentSiteData[key];
            }
          }

          proposalBody = {
            proposalType: "update",
            proposalMessage: formData.proposalMessage,
            culturalSite: formData._id,
            ...proposedChanges,
          };
        } else if (proposalType === "delete") {
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
    } catch (error) {
      // Check for the specific duplicate key error message from MongoDB
      if (
        error.response?.data?.message &&
        error.response.data.message.includes("E11000")
      ) {
        setBackendError(
          "A pending proposal for this site already exists from your account. Please wait for it to be processed."
        );
      } else {
        // Fallback for other errors
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred during submission.";
        setSubmissionError(errorMessage);
      }
    }
  };

  const isSubmitting =
    role === "admin"
      ? updateCulturalSiteMutation.isLoading
      : submitProposalMutation.isLoading;

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

  const categories = [
    "artwork",
    "gallery",
    "museum",
    "restaurant",
    "theatre",
    "arts_centre",
    "community_centre",
    "library",
    "cinema",
    "other",
  ];

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
        {console.log(formErrors)}
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
                  {" "}
                  Please correct the highlighted fields.
                </span>
              )}
          </div>
        )}

        {/* Display the ID of the site being updated/modified */}
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

        {/* Editable Fields (conditionally disabled for delete proposal) */}
        <fieldset disabled={proposalType === "delete"}>
          <legend className="sr-only">Cultural Site Details</legend>
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>

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
              rows="3"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            ></textarea>
          </div>

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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., http://example.com/image.jpg"
            />
          </div>

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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., Mo-Fr 09:00-17:00"
            />
          </div>

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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {formErrors.address && (
              <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
            )}
          </div>

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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="e.g., https://example.com"
            />
          </div>

          {/* Non-editable fields (display only) */}
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

        {/* Proposal Message (Conditional: only for non-admins) */}
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
              rows="4"
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
