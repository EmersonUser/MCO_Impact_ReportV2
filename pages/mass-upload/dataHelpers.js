// pages/revisionFloat/dataHelpers.js

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

const CheckmarkCell = () => (
  <FontAwesomeIcon icon={faCheck} className="green-icon" />
);

const CrossmarkCell = () => (
  <FontAwesomeIcon icon={faXmark} className="cross-icon" />
);

export const getCardData = (cardData) => {
  if (!cardData || typeof cardData !== "object") {
    return null;
  }

  return {
    title: cardData.Title || "N/A",
    type: cardData.Type || "N/A",
    "Maturity State": cardData["Maturity State"] || "N/A",
    owner: cardData.Owner || "N/A",
    "Collaborative Space Title": cardData["Collaborative Space Title"] || "N/A",
    Description: cardData.Description || "N/A",
    "Dropped Revision": cardData["Dropped Revision"] || "N/A",
    "Latest Released Revision": cardData["Latest Released Revision"] || "N/A",
    "CAD Format": cardData["CAD Format"] || "N/A",
    imageURL:
      cardData.imageURL ||
      "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/snresources/images/icons/large/I_VPMNavProduct108x144.png", // You might want a placeholder image URL
    ...(cardData.Type !== "Document" && {
      EIN: cardData.EIN || "N/A",
      "CAD Format": cardData["CAD Format"] || "N/A",
    }),
  };
};

export const getTableData = (parentDetails, cardData) => {
  if (!parentDetails || !Array.isArray(parentDetails.data)) {
    console.warn("[getTableData] ⚠️ No parent details available. Returning empty array.");
    return [];
  }
  return parentDetails.data.map((parent) => ({
    EIN: parent.EIN || "N/A",
    Title: parent.Title || "N/A",
    Description: parent.Description || "N/A",
    Type: parent.Type || "N/A",
    Revision: parent["Dropped Revision"] || "N/A",
    "Dropped Revision ID": parent["Dropped Revision ID"] || "N/A",
    "Connected Child Revision": parent.connectedChildRev || "N/A",
    "Latest child connected": parent.toBeChildRevConnected ? false : true,
    "To-Be child connected": parent.toBeChildRevConnected || "-",
    State: parent["Maturity State"] || "N/A",
    Owner: parent.Owner || "N/A",
    "CAD Format": parent["CAD Format"] || "N/A",
    Collabspace: parent["Collaborative Space Title"] || "N/A",

    // Add relationship field if the type is Document
    ...(cardData?.Type === "Document" && {
      relationship: parent.relationship || "N/A",
    }),
  }));
};

export const tableColumns = [
  {
    accessorKey: "EIN",
    header: "EIN",
    columnPinning: true,
  },
  { accessorKey: "Title", header: "Title" },
  { accessorKey: "Description", header: "Description" },
  { accessorKey: "Type", header: "Type" },
  { accessorKey: "Revision", header: "Revision" },
  {
    accessorKey: "Connected Child Revision",
    header: "Connected Revision",
  },
  {
    accessorKey: "Latest child connected",
    header: "latest Revision Connected",
    cell: ({ cell }) => {
      const value = cell.getValue();
      // Render a checkmark if true, a cross if false
      return value ? <CheckmarkCell /> : <CrossmarkCell />;
    },
  },
  {
    accessorKey: "To-Be child connected",
    header: "Revision to-be Connected",
  },
  {
    accessorKey: "relationship",
    header: "Relationship",
  },
  { accessorKey: "State", header: "State" },
  { accessorKey: "Owner", header: "Owner" },
  { accessorKey: "CAD Format", header: "CAD Format" },
  { accessorKey: "Collabspace", header: "Collabspace" },
];
