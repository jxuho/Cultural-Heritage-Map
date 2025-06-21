import { useState, useMemo } from "react";
import {
  useProposalModeration,
} from "../../hooks/data/useProposalQueries";
import { useProposals } from "../../hooks/data/useProposalQueries";
import BackButton from "../BackButton";

const Proposals = () => {
  const [sortOption, setSortOption] = useState("-createdAt"); // 기본 정렬: 최신 순
  // adminNote를 각 proposal._id에 매핑하여 저장하는 객체 상태로 변경
  const [adminComment, setadminComment] = useState({});

  const { data: proposals = [], isLoading, isError, error } = useProposals();
  const {
    mutate: moderateProposal,
    isPending: isModerationPending,
    isError: isModerationError,
    error: moderationError,
  } = useProposalModeration();

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
        case "-reviewedAt":
          if (!a.reviewedAt && !b.reviewedAt) comparison = 0;
          else if (!a.reviewedAt) comparison = 1;
          else if (!b.reviewedAt) comparison = -1;
          else comparison = new Date(b.reviewedAt) - new Date(a.reviewedAt);
          break;
        case "reviewedAt":
          if (!a.reviewedAt && !b.reviewedAt) comparison = 0;
          else if (!a.reviewedAt) comparison = -1;
          else if (!b.reviewedAt) comparison = 1;
          else comparison = new Date(a.reviewedAt) - new Date(b.reviewedAt);
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

  // 각 proposal의 adminNote를 업데이트하는 헬퍼 함수
  const handleAdminNoteChange = (proposalId, note) => {
    setadminComment((prevNotes) => ({
      ...prevNotes,
      [proposalId]: note,
    }));
  };

  // 제안 승인 핸들러
  const handleAccept = (proposalId) => {
    const note = adminComment[proposalId] || "";
    if (!note.trim()) {
      alert("승인 시 관리자 메모를 입력해야 합니다.");
      return;
    }
    moderateProposal({ proposalId, actionType: "accept", adminComment: note });
  };

  // 제안 거절 핸들러
  const handleReject = (proposalId) => {
    const note = adminComment[proposalId] || "";
    if (!note.trim()) {
      alert("거절 시 관리자 메모를 입력해야 합니다.");
      return;
    }
    moderateProposal({ proposalId, actionType: "reject", adminComment: note });
  };

  // Helper function to safely render values from proposedChanges
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
    return <div className="text-center p-6 text-xl">Loading proposals...</div>;
  }

  if (isError) {
    return (
      <div className="text-center p-6 text-xl text-red-600">
        Error loading proposals: {error.message}
      </div>
    );
  }

  if (!sortedProposals.length) {
    return (
      <div className="text-center p-6 text-xl text-gray-600">
        No proposals found.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Add BackButton here, typically at the top left */}
      <div className="flex justify-start mb-4">
        <BackButton />
      </div>

      <h2 className="text-3xl font-bold mb-6 text-center">All Proposals</h2>

      {/* Sorting Controls */}
      <div className="mb-6 flex justify-end">
        <label
          htmlFor="sort-proposals"
          className="mr-2 text-gray-700 font-medium"
        >
          Sort By:
        </label>
        <select
          id="sort-proposals"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="-createdAt">Created (Newest First)</option>
          <option value="createdAt">Created (Oldest First)</option>
          <option value="-reviewedAt">Reviewed (Newest First)</option>
          <option value="reviewedAt">Reviewed (Oldest First)</option>
          <option value="status">Status (A-Z)</option>
          <option value="-status">Status (Z-A)</option>
        </select>
      </div>

      {/* Global moderation status, if any, can still be displayed here */}
      {isModerationPending && (
        <p className="text-blue-600 mt-2 text-center">Processing...</p>
      )}
      {isModerationError && (
        <p className="text-red-600 mt-2 text-center">
          Error: {moderationError.message}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedProposals.map((proposal) => (
          <div
            key={proposal._id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <h3 className="text-xl font-semibold mb-2">
              {proposal.proposalType}
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
            {proposal.culturalSite && (
              <>
                <p className="text-gray-700 mb-1">
                  <strong>Cultural Site: </strong>
                  {proposal.culturalSite.name || "N/A"}
                </p>
                {proposal.culturalSite.description && (
                  <p className="text-gray-700 mb-1">
                    <strong>Description: </strong>
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
                    <strong>Opening Hours: </strong>
                    {proposal.culturalSite.openingHours}
                  </p>
                )}
              </>
            )}

            <p className="text-gray-700 mb-1">
              <strong>Proposed By: </strong>
              {proposal.proposedBy?.email || "N/A"}
            </p>

            {proposal.proposalMessage && (
              <p className="text-gray-700 mb-1">
                <strong>Proposal Message:</strong> {proposal.proposalMessage}
              </p>
            )}

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
                    )
                    .map(([key, value]) => (
                      <li key={key}>
                        {key}:
                        {renderProposedValue(key, value, proposal.proposalType)}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {proposal.adminComment && (
              <p className="text-gray-700 mt-2">
                <strong>Admin Comment:</strong> {proposal.adminComment}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Created:
              {new Date(proposal.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {proposal.reviewedAt && (
              <p className="text-sm text-gray-500">
                Reviewed: Created:
                {new Date(proposal.reviewedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            {/* 관리자 메모 입력 필드 (각 카드 내부) */}
            {proposal.status === "pending" && (
              <div className="mt-4 p-3 border rounded-md bg-gray-50">
                <label
                  htmlFor={`adminComment-${proposal._id}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Admin Notes:
                </label>
                <textarea
                  id={`adminComment-${proposal._id}`}
                  value={adminComment[proposal._id] || ""}
                  onChange={(e) =>
                    handleAdminNoteChange(proposal._id, e.target.value)
                  }
                  rows="2"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Write down accept or reject message"
                ></textarea>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAccept(proposal._id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    // 해당 제안의 메모가 없거나, 처리 중일 경우 비활성화
                    disabled={
                      isModerationPending || !adminComment[proposal._id]?.trim()
                    }
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(proposal._id)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    // 해당 제안의 메모가 없거나, 처리 중일 경우 비활성화
                    disabled={
                      isModerationPending || !adminComment[proposal._id]?.trim()
                    }
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Proposals;
