import { useState, useMemo } from "react";
import { useMyProposals } from "../../hooks/data/useProposalQueries";
import BackButton from "../BackButton";

const MyProposalsList = () => {
  // We'll keep sorting for the user's view, allowing them to sort by status or date
  const [sortOption, setSortOption] = useState("-createdAt"); // Default sort: Newest first

  // Use the custom hook for fetching user's proposals
  const { data: proposals = [], isLoading, isError, error } = useMyProposals();

  const sortedProposals = useMemo(() => {
    if (!proposals.length) return [];

    const sortableProposals = [...proposals];

    sortableProposals.sort((a, b) => {
      let comparison = 0;

      switch (sortOption) {
        case "-createdAt":
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "-status":
          comparison = b.status.localeCompare(a.status);
          break;
        default:
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }
      return comparison;
    });

    return sortableProposals;
  }, [proposals, sortOption]);

  // Helper function to safely render values from proposedChanges (copied from Proposals for consistency)
  const renderProposedValue = (key, value, proposalType) => {
    if (
      key === "location" &&
      typeof value === "object" &&
      value !== null &&
      value.type === "Point" &&
      Array.isArray(value.coordinates)
    ) {
      return `[Lon: ${value.coordinates[0]}, Lat: ${value.coordinates[1]}]`;
    }

    if (proposalType === "create") {
      if (typeof value === "object" && value !== null) {
        return JSON.stringify(value);
      }
      return `"${value}"`;
    } else {
      let oldValue = value.oldValue;
      let newValue = value.newValue;

      if (typeof oldValue === "object" && oldValue !== null) {
        oldValue = JSON.stringify(oldValue);
      } else {
        oldValue = `"${oldValue}"`;
      }

      if (typeof newValue === "object" && newValue !== null) {
        newValue = JSON.stringify(newValue);
      } else {
        newValue = `"${newValue}"`;
      }
      return `Old - ${oldValue}, New - ${newValue}`;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-6 text-xl">Loading your proposals...</div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-6 text-xl text-red-600">
        Error loading your proposals: {error.message}
      </div>
    );
  }

  if (!sortedProposals.length) {
    return (
      <div className="text-center p-6 text-xl text-gray-600">
        You haven't submitted any proposals yet.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Add BackButton here, typically at the top left */}
      <div className="flex justify-start mb-4">
        <BackButton />
      </div>

      <h2 className="text-3xl font-bold mb-6 text-center">
        My Submitted Proposals
      </h2>

      {/* Sorting Controls */}
      <div className="mb-6 flex justify-end">
        <label
          htmlFor="sort-my-proposals"
          className="mr-2 text-gray-700 font-medium"
        >
          Sort By:
        </label>
        <select
          id="sort-my-proposals"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="-createdAt">Created (Newest First)</option>
          <option value="createdAt">Created (Oldest First)</option>
          <option value="status">Status (A-Z)</option>
          <option value="-status">Status (Z-A)</option>
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedProposals.map((proposal) => (
          <div
            key={proposal._id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <h3 className="text-xl font-semibold mb-2">
              {proposal.proposalType === "create"
                ? "New Site Proposal"
                : "Update Proposal"}
            </h3>
            <p className="text-gray-700 mb-1">
              <strong>Status: </strong>
              <span
                className={`font-medium ${
                  proposal.status === "pending"
                    ? "text-yellow-600"
                    : proposal.status === "accepted"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {proposal.status}
              </span>
            </p>
            {/* Cultural Site details for 'update' and 'delete' proposals */}
            {proposal.culturalSite && (
              <>
                <p className="text-gray-700 mb-1">
                  <strong>Cultural Site:</strong>
                  {proposal.culturalSite.name || "N/A"}
                </p>
                {proposal.culturalSite.description && (
                  <p className="text-gray-700 mb-1">
                    <strong>Description:</strong>
                    {proposal.culturalSite.description}
                  </p>
                )}
                {proposal.culturalSite.category && (
                  <p className="text-gray-700 mb-1">
                    <strong>Category:</strong> {proposal.culturalSite.category}
                  </p>
                )}
                {proposal.culturalSite.address && (
                  <p className="text-gray-700 mb-1">
                    <strong>Address:</strong> {proposal.culturalSite.address}
                  </p>
                )}
                {proposal.culturalSite.website && (
                  <a
                    href={proposal.culturalSite.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mb-1 block"
                  >
                    <strong>Website</strong>
                  </a>
                )}
                {proposal.culturalSite.imageUrl && (
                  <img
                    src={proposal.culturalSite.imageUrl}
                    alt={proposal.culturalSite.name}
                    className="w-full h-48 object-cover rounded-md mb-2"
                  />
                )}
                {proposal.culturalSite.openingHours && (
                  <p className="text-gray-700 mb-1">
                    <strong>Opening Hours:</strong>
                    {proposal.culturalSite.openingHours}
                  </p>
                )}
              </>
            )}

            {/* Proposal Message */}
            {proposal.proposalMessage && (
              <p className="text-gray-700 mb-1">
                <strong>Your Message:</strong> {proposal.proposalMessage}
              </p>
            )}

            {/* Proposed Changes */}
            {proposal.proposedChanges && (
              <div className="mt-2">
                <strong>Proposed Details:</strong>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {Object.entries(proposal.proposedChanges)
                    .filter(
                      ([key]) =>
                        !(
                          proposal.proposalType === "create" &&
                          key === "originalTags"
                        )
                    ) // Filter out originalTags for 'create' proposals
                    .map(([key, value]) => (
                      <li key={key}>
                        {key}:
                        {renderProposedValue(key, value, proposal.proposalType)}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Admin Comment (if reviewed) */}
            {proposal.adminComment && (
              <div className="mt-2 p-3 border rounded-md bg-gray-50">
                <p className="text-gray-700">
                  <strong>Admin Comment:</strong> {proposal.adminComment}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Submitted: {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </p>
            {proposal.reviewedAt && (
              <p className="text-sm text-gray-500">
                Reviewed: {new Date(proposal.reviewedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

export default MyProposalsList;
