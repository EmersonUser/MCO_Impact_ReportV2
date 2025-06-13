// pages/revisionFloat/dataHelpers.js
import { FaRegCopy } from "react-icons/fa";
import { AiOutlineClose } from "react-icons/ai"; // Ant Design Icons (React Icons)

export const PlantRenderer = ({
  plants = [],
  itemId,
  isRemoveMode,
  handleRemovePlant,
}) => {
  console.log("PlantRenderer received plants:", plants); // Debugging
  if (!plants?.length) return "N/A";

  return (
    <>
      {plants.map((plant) => (
        <span
          key={plant.PlantID}
          style={{
            marginRight: "8px",
            display: "inline-flex",
            alignItems: "center",
            color: plant.color || "black", // Apply red or green based on color property
            fontWeight: "bold", // Optional: Make it more visible
          }}
        >
          {plant.PlantName}
          {isRemoveMode && plant.PlantERPStatus === "Pending" && (
            <AiOutlineClose
              size={16}
              style={{ cursor: "pointer", color: "red", marginLeft: "4px" }}
              onClick={() => handleRemovePlant(itemId, plant.PlantID)}
            />
          )}
        </span>
      ))}
    </>
  );
};

export const getCardData = (droppedObjectData) => {
  if (!droppedObjectData || !droppedObjectData.cardData) {
    return null;
  }

  const item = droppedObjectData.cardData;

  let cardData = {
    title: item.Title || "N/A",
    type: item.Type || "N/A",
    "Maturity State": item["Maturity State"] || "N/A",
    owner: item.Owner || "N/A",
    "Collaborative Space Title": item["Collaborative Space Title"] || "N/A",
    Description: item.Description || "N/A",
    "Dropped Revision": item["Dropped Revision"] || "N/A",
    "Latest Released Revision": item["Latest Released Revision"] || "N/A",
    "CAD Format": item["CAD Format"] || "N/A",
    imageURL:
      item.imageURL ||
      "https://oi000186152-us1-space.3dexperience.3ds.com/enovia/snresources/images/icons/large/I_VPMNavProduct108x144.png", // You might want a placeholder image URL
  };

  if (item.Type !== "Document") {
    cardData.EIN = item.EIN || "N/A";
    cardData["CAD Format"] = item["CAD Format"] || "N/A";
  }
  return cardData;
};

export const getTableData = (tableData, type, CAData) => {
  console.log("cadata datahelpers",CAData );
  
  if (!tableData) return [];

  return tableData.map((data) => {
    if (type === "Change Action") {
      return {
        ItemName: data?.ItemTitle || "N/A",
        ItemRev: data?.ItemRev || "N/A",
        ItemType: data?.ItemType || "N/A",
        ItemId: data?.ItemId || "N/A", 
        ItemSeq: data?.ItemSeq || "N/A",
        ItemMakeBuy: data?.ItemMBOM || "N/A",
        ItemNextSeqMCO: data?.ItemNextSeqMCO || "N/A",
      };
    } 
  });
};

export const getMBOMConnTableData = (tableData, type, CAData) => {
  console.log("cadata datahelpers",CAData );
  
  if (!tableData) return [];

  return tableData.map((data) => {
    if (type === "Change Action") {
      return {
        ItemFromName: data?.ItemFromTitle || "N/A",
        ItemToName: data?.ItemToTitle || "N/A",
        ItemRev: data?.ItemRev || "N/A",
        ItemType: data?.ItemType || "N/A",
        ItemId: data?.ItemId || "N/A", 
        ItemSeq: data?.ItemSeq || "N/A",
        ItemNextSeqMCO: data?.ItemNextSeqMCO || "N/A",
      };
    } 
  });
};

export const getUniqueTableData = (uniqueData) => {
  if (!uniqueData) return [];
  return uniqueData.map((plant) => ({
    "Available Plant": plant?.title || "N/A",
  }));
};

export const tableColumns = (CAName, type, isRemoveMode, handleRemovePlant) => {
  console.log("type here is: ", type);
  if (type === "Change Action") {
    return [
      { accessorKey: "ItemName", header: "Name" },
      { accessorKey: "ItemRev", header: "Rev" },
      { accessorKey: "ItemType", header: "Type" },
      { accessorKey: "ItemPolicy", header: "Policy"},
      { accessorKey: "ItemMakeBuy", header: "Make/Buy" },
      { accessorKey: "ItemSeq", header: "Sequence" },
      { accessorKey: "ItemPrevSeqMCO", header: "Prev. Seq. MCO" },
      { accessorKey: "ItemPrevSeqStartDate", header: "Prev. Seq. Start Date" },
      { accessorKey: "ItemNextSeqMCO", header: "Next Seq MCO" },
      { accessorKey: "ItemNextSeqStartDate", header: "Next Seq Start Date" },
    ];
  }
};


export const tableColumnsMBOMConnections = (CAName, type, isRemoveMode, handleRemovePlant) => {
  console.log("type here is: ", type);
  if (type === "Change Action") {
    return [
      { accessorKey: "ItemFromName", header: "From Part" },
      { accessorKey: "ItemToName", header: "To Part" },
      { accessorKey: "ItemFindNumber", header: "F/N" },
      { accessorKey: "ItemRefDes", header: "Ref Des"},
      { accessorKey: "ItemMfgUsageCode", header: "Manufacturing Usage Code" },
      { accessorKey: "ItemSeq", header: "Sequence" },
      { accessorKey: "ItemPrevSeqMCO", header: "Prev. Seq. MCO" },
      { accessorKey: "ItemPrevSeqStartDate", header: "Prev. Seq. Start Date" },
      { accessorKey: "ItemNextSeqMCO", header: "Next Seq MCO" },
      { accessorKey: "ItemNextSeqStartDate", header: "Next Seq Start Date" },
      { accessorKey: "ItemChildMCO", header: "Child MCO" },
      { accessorKey: "ItemChildStartDate", header: "Child Start Date" },
    ];
  }
};

export const uniqueColumns = [
  { accessorKey: "Available Plant", header: "Available Plant" },
];


export function processErrorObj(
  errorObj,
  assignedPlant,
  updatedAssignedClasses,
  uniquePlant
) {
  console.log("Assigned Plants are:", assignedPlant);
  console.log("unique Plants are:", uniquePlant);
  errorObj.forEach((item) => {
    if (item.type === "New") {
      // Remove from assignedPlant

      updatedAssignedClasses = updatedAssignedClasses.filter(
        (plant) => plant.title !== item.title
      );

      // Add to uniquePlant if not already present
      if (!uniquePlant.some((plant) => plant.title === item.title)) {
        uniquePlant.push(item);
      }
    } else if (item.type === "Update") {
      // Modify mbom to "buy" in assignedPlant
      updatedAssignedClasses = updatedAssignedClasses.map((plant) =>
        plant.title === item.title ? { ...plant, MBOM: "false" } : plant
      );
    }
  });

  // Update the table (assuming a render function exists)

  return { updatedAssignedClasses, uniquePlant };
}

export const formattedFinalMessage = (finalMessage) => {
  if (!finalMessage) return "An error occurred.";

  const messageList = finalMessage
    .split("\n")
    .filter((msg) => msg.trim() !== "");

  const handleCopy = () => {
    const textToCopy = messageList.map((msg) => `- ${msg}`).join("\n");
    navigator.clipboard.writeText(textToCopy);
  };

  return (
    <div
      style={{
        userSelect: "text",
        cursor: "text",
        position: "relative",
        paddingRight: "40px",
      }}
    >
      <strong>Errors:</strong>
      <button
        onClick={handleCopy}
        style={{
          position: "absolute",
          right: "10px",
          top: "-12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: "grey",
        }}
      >
        <FaRegCopy size={12} />
      </button>
      <ol>
        {messageList.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ol>
    </div>
  );
};
