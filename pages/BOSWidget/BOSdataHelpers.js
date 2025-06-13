// pages/revisionFloat/dataHelpers.js
import { FaRegCopy } from "react-icons/fa";
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

export const getTableData = (bosData, type) => {
  if (!bosData) return [];

  return bosData.map((data) => {
    let rowData = {
      Title: data?.childTitle || "N/A",
      Revision: data?.childRevision || "1",
      State: data?.childState || "N/A",
      "Print On Purchase Order Required":
        data.PrintOnPurchaseOrderRequired || "No",
      "Print On Work Order Required": data.PrintOnWorkOrderRequired || "No",
      "Work Order Document Required": data.WorkOrderDocumentRequired || "No",
      "Print On report Order Required": data.PrintOnReportOrderRequired || "No",
      "SAP/JDE": data["SAP/JDE"] || "No",
    };

    // Add "IsLatest" key only if type === "Document"
    if (type === "Document") {
      rowData.IsLatest = data?.childLatest || "FALSE";
    }

    return rowData;
  });
};

export const tableColumns = (type, latestRevision, droppedRevision) => {
  const baseColumns = [
    { accessorKey: "Title", header: "Title" },
    { accessorKey: "Revision", header: "Revision" },
    { accessorKey: "State", header: "State" },
  ];

  if (type === "Document") {
    baseColumns.push({ accessorKey: "IsLatest", header: "Is Latest" });
  }

  const editableColumns = [
    "Print On Purchase Order Required",
    "Print On Work Order Required",
    "Work Order Document Required",
    "Print On report Order Required",
    "SAP/JDE",
  ].map((columnKey) => ({
    accessorKey: columnKey,
    header: columnKey,
    cell: ({ row, getValue, table }) => {
      // Determine if the cell should be editable
      const isEditable =
        type === "Document"
          ? row.original.IsLatest !== "FALSE" // Editable only if IsLatest is NOT "FALSE"
          : !latestRevision || latestRevision === droppedRevision;

      const handleDropdownChange = (e) => {
        const updatedValue = e.target.value;
        const updatedData = table
          .getRowModel()
          .rows.map((r) =>
            r.id === row.id
              ? { ...r.original, [columnKey]: updatedValue }
              : r.original
          );

        table.options.meta?.updateTableData(updatedData);
      };

      return isEditable ? (
        <select
          value={getValue()}
          onChange={handleDropdownChange}
          className="appearance-none bg-transparent border-none cursor-pointer focus:outline-none"
          style={{
            width: "70%",
            padding: "5px 0",
            fontSize: "14px",
            background: "none",
            border: "none",
            textAlign: "left",
          }}
          onMouseOver={(e) => (e.target.style.border = "1px solid #ccc")}
          onMouseOut={(e) => (e.target.style.border = "none")}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      ) : (
        <span>{getValue()}</span> // Show non-editable text if conditions fail
      );
    },
  }));

  return [...baseColumns, ...editableColumns];
};

// export const tableColumns = (type, latestRevision, droppedRevision) => [
//   { accessorKey: "Title", header: "Title" },
//   { accessorKey: "Revision", header: "Revision" },
//   { accessorKey: "State", header: "State" },
//   ...[
//     "Print On Purchase Order Required",
//     "Print On Work Order Required",
//     "Work Order Document Required",
//     "Print On report Order Required",
//     "SAP/JDE",
//   ].map((columnKey) => ({
//     accessorKey: columnKey,
//     header: columnKey,
//     cell: ({ row, getValue, table }) => {
//       const handleDropdownChange = (e) => {
//         const updatedValue = e.target.value;
//         const updatedData = table
//           .getRowModel()
//           .rows.map((r) =>
//             r.id === row.id
//               ? { ...r.original, [columnKey]: updatedValue }
//               : r.original
//           );

//         table.options.meta?.updateTableData(updatedData);
//       };

//       return (
//         <select
//           value={getValue()}
//           onChange={handleDropdownChange}
//           className="appearance-none bg-transparent border-none cursor-pointer focus:outline-none"
//           style={{
//             width: "70%",
//             padding: "5px",
//             fontSize: "14px",
//             color: "#333",
//             background: "none",
//             border: "none",
//             textAlign: "left",
//           }}
//           onMouseOver={(e) => (e.target.style.border = "1px solid #ccc")}
//           onMouseOut={(e) => (e.target.style.border = "none")}
//         >
//           <option value="Yes">Yes</option>
//           <option value="No">No</option>
//         </select>
//       );
//     },
//   })),
// ];

// {
//   accessorKey: "MBom",
//   header: "MBom",
//   cell: ({ row, getValue, table }) => {
//     const handleDropdownChange = (e) => {
//       if (!CAName) return; // Prevent changes when disabled
//       const updatedValue = e.target.value;

//       // Update the table data state here
//       const updatedData = table
//         .getRowModel()
//         .rows.map((r) =>
//           r.id === row.id ? { ...r.original, MBom: updatedValue } : r.original
//         );

//       table.options.meta?.updateTableData(updatedData); // Call custom table update function
//     };

//     return (
//       <select
//         value={getValue()}
//         onChange={handleDropdownChange}
//         disabled={!CAName} // Disable dropdown if CAName is false
//         className={`appearance-none bg-transparent border-none cursor-pointer focus:outline-none`}
//         style={{
//           ...(CAName === false && { appearance: "none" }), // Apply appearance: none only if CAName is false
//           width: "70%",
//           padding: "5px",
//           fontSize: "14px",
//           color: "#333",
//           background: "none",
//           border: "none",
//           textAlign: "left",
//         }}
//         onMouseOver={(e) => {
//           if (CAName) e.target.style.border = "1px solid #ccc";
//         }}
//         onMouseOut={(e) => {
//           if (CAName) e.target.style.border = "none";
//         }}
//       >
//         <option value="Make">Make</option>
//         <option value="Buy">Buy</option>
//       </select>
//     );
//   },
// },
