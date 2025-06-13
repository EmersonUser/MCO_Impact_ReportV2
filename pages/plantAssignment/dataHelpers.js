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
        Plant: data?.ItemPlants || [], // ✅ Ensure Plant data is correctly stored
        ItemId: data?.ItemId || "N/A", // ✅ Added to be accessible in `tableColumns`
      };
    } else {
      console.log("change data datahelper", data?.Change || CAData.CAName ||"N/A");
       
      return {
        Plant: data?.title || "N/A",
        Seq: data?.Seq || "1",
        Status: data?.PlantStatus || "Pending",
        "MFG Change": data?.MFGChange || "N/A",
        "MFG Status": data?.MFGStatus || "N/A",
        Change: data?.Change || CAData.CAName ||"N/A",
        "Change Status": data?.ChangeStatus || CAData.CAStatus ||"N/A",
        "Oracle Template": data.OracleTemplate || "N/A",
        "ERP Status": "Active" || "N/A",
        "ERP Export": "Yes" || "N/A",
        "Lead Plant": false,
        MBom: data.MBOM ? "Make" : "Buy" || "N/A",
        "Sort Value": "",
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
      { accessorKey: "ItemName", header: "Item Name" },
      { 
        accessorKey: "Plant",
        header: "Plant",
        cell: ({ row }) => (
          <PlantRenderer
            plants={row.original.Plant} // ✅ Uses correct row data
            itemId={row.original.ItemId} // ✅ Passes item ID
            isRemoveMode={isRemoveMode}
            handleRemovePlant={handleRemovePlant}
          />
        ),
      },
    ];
  }

  return [
    { accessorKey: "Plant", header: "Plant"},
    { accessorKey: "Seq", header: "Seq" },
    { accessorKey: "Status", header: "Status" },
    { accessorKey: "Change", header: "Change" },
    { accessorKey: "Change Status", header: "Change Status" },
    { accessorKey: "MFG Change", header: "MFG Change" },
    { accessorKey: "MFG Status", header: "MFG Status" },
    { accessorKey: "Oracle Template", header: "Oracle" },
    {
      accessorKey: "MBom",
      header: "MBom",
      
    },
    { accessorKey: "ERP Status", header: "ERP Status" },
    { accessorKey: "ERP Export", header: "ERP Export" },
    { accessorKey: "Lead Plant", header: "Lead Plant" },
    { accessorKey: "Sort Value", header: "Sort Value" },
  ];
};

export const uniqueColumns = [
  { accessorKey: "Available Plant", header: "Available Plant" },
];

// export function processErrorObj(
//   errorObj,
//   assignedPlant,
//   uniquePlant,
//   updatedAssignedClasses
// ) {
//   console.log("Assigned Plants are:", assignedPlant);
//   console.log("unique Plants are:", uniquePlant);
//   errorObj.forEach((item) => {
//     if (item.type === "New") {
//       // Remove from assignedPlant

//       assignedPlant = assignedPlant.filter(
//         (plant) => plant.title !== item.title
//       );

//       // Add to uniquePlant if not already present
//       if (!uniquePlant.some((plant) => plant.title === item.title)) {
//         uniquePlant.push(item);
//       }
//     } else if (item.type === "Update") {
//       // Modify mbom to "buy" in assignedPlant
//       assignedPlant = assignedPlant.map((plant) =>
//         plant.title === item.title ? { ...plant, MBom: "buy" } : plant
//       );
//     }
//   });

//   // Update the table (assuming a render function exists)

//   return { assignedPlant, uniquePlant };
// }

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
