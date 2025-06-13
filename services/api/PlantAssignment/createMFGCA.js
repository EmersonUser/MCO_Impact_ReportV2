import * as XLSX from "xlsx";
import { getAllPlants } from "./allPlantSevice";
import { fetchCsrfToken } from "./fetchCsrfService";
import axios from "axios";
import { FaRegCopy } from "react-icons/fa";
// Import useToastWithProgress
 
// const { showSuccessToastWithProgress, showErrorToastWithProgress } = useToastWithProgress();
 
 
const fetchData = async (
  url,
  body = null,
  method = "GET"
  // headers = {}
) => {
  console.log("Fetching URL:", url);
  console.log("Method is:");
  console.log("Request Body:", JSON.stringify(body, null, 2));
 
  try {
    const response = await axios({
      url,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      data: body, // Include body only if provided
    });
 
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Request failed:", error);
    throw error; // Propagate the error to the caller
  }
};
// Function to create the manufacturing CA body from Excel data and allPlants
export const createManufacturingCABody = async (
  excelData,
  allPlantsData,
  companyName,
  collabSpace
) => {
  const items = [];
  const uniquePlantTitles = new Set();
 
  for (let i = 1; i < excelData.length; i++) {
    const row = excelData[i];
    if (row.length >= 2 && row[0] && row[1]) {
      const itemName = row[0].toString().trim();
      const plantsList = row[1].toString().includes(",")
        ? row[1]
            .toString()
            .split(",")
            .map((p) => p.trim())
        : [row[1].toString().trim()];
      items.push({
        name: itemName,
        plants: plantsList,
      });
      plantsList.forEach((plant) => uniquePlantTitles.add(plant));
    }
  }
 
  const parentPlants = [];
  uniquePlantTitles.forEach((plantTitle) => {
    const matchedPlant = allPlantsData.find((plant) => {
      const normalizedTitle = plant.title.replace(/^Plant\s+/, "");
      return normalizedTitle === plantTitle || plant.title === plantTitle;
    });
    if (matchedPlant) {
      parentPlants.push({
        PlantName: matchedPlant.title.replace(/^Plant\s+/, ""),
        PlantID: matchedPlant.id,
      });
    }
  });
 
  return {
    CATitle: "FromAutomation",
    CAOrganization: companyName, // company name credentials
    CACollabSpace: collabSpace, // from credentials
    CAOwner: "e1331143",
    Items: items,
    ParentPlants: parentPlants,
  };
};
 
// Function to make the API call
export const callManufacturingCAApi = async (body) => {
  const manufacturingCAUrl =
    "https://saasimplementationserverdev.azurewebsites.net/flowDownCA/createMFGCA";
 
 // console.log("Headers for Manufacturing CA API:", CAHeaders);
 
  const response = await fetchData(
    manufacturingCAUrl,
    body,
    "POST"
  );
  console.log("Manufacturing CA Response:", JSON.stringify(response));
  return response;
};
 
// Function to handle file change (only validation)
export const handleFileChange = async (
  event,
  setValidationErrors,
  setShowErrorsModal,
  showErrorToast,
  showSuccessToast,
  setValidatedData, // New parameter to store validated data
  setSelectedFiles,
  setIsCreateButtonDisabled
) => {
 
  console.log("[handleFileChange] Function triggered");
 
  const files = event.target.files;
  const validExtensions = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]; // MIME types for .xls and .xlsx
 
  // Check if all files are valid Excel files
  const invalidFiles = Array.from(files).filter(
    (file) =>
      !validExtensions.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".xls") &&
      !file.name.toLowerCase().endsWith(".xlsx")
  );
 
  if (invalidFiles.length > 0) {
    showErrorToast("Only Excel files (.xls, .xlsx) can be uploaded");
    event.target.value = ""; // Reset the file input
    setIsCreateButtonDisabled(true); // Disable the button if invalid files are present
    return;
  }
 
  const file = files[0];
  const reader = new FileReader();
 
  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Get data as a 2D array
 
    console.log("Parsed Excel Data:", jsonData);
 
    // Validation: Check if the file is empty
    if (jsonData.length === 0) {
      showErrorToast("File is empty");
      setIsCreateButtonDisabled(true);
      return;
    }
 
   
 
    // Validation: Check if headers match "Item" and "Plants"
    const normalizedHeaders = jsonData[0].map((header) =>
      header?.toString().trim().toLowerCase()
    ); // Normalize headers
    console.log("Normalized Headers:", normalizedHeaders);
 
    if (normalizedHeaders[0] !== "item" || normalizedHeaders[1] !== "plants") {
      showErrorToast(
        "File headers are incorrect. Expected headers: 'Item' and 'Plants'"
      );
      setIsCreateButtonDisabled(true);
      return;
    }
 
    // Validation: Check if the file contains only headers and no data
    if (jsonData.length === 1) {
      showErrorToast("No data present in the file. Only headers are present.");
      return;
    }
 
    const errors = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const item = row[0];
      const plants = row[1];
 
      if (!item && plants) {
        errors.push({
          rowNumber: i + 1,
          columnName: "Item",
          errorDescription: "Items can't be empty",
        });
      }
 
      if (item && !plants) {
        errors.push({
          rowNumber: i + 1,
          columnName: "Plants",
          errorDescription: "Plants value is missing",
        });
      }
    }
 
    console.log("Validation Errors:", errors);
 
    if (errors.length > 0) {
      const formattedErrors = errors.map(
        (error) =>
          `Row ${error.rowNumber}: "${error.columnName}" value ${error.errorDescription}`
      );
 
      console.log("[createMFGCA.js] Formatted Errors:", formattedErrors);
 
      setValidationErrors(formattedErrors);
      setShowErrorsModal(true);
      setIsCreateButtonDisabled(true);
    } else {
      showSuccessToast("File uploaded successfully with no errors");
      setValidatedData(jsonData); // Store validated data for further processing
      setSelectedFiles(file);// Update selectedFiles state only after successful validation
      setIsCreateButtonDisabled(false);
    }
  };
 
  reader.onerror = () => {
    showErrorToast("Failed to read the file. Please try again.");
    setIsCreateButtonDisabled(true);
  };
 
  reader.readAsArrayBuffer(file);
};
 
// New function to process Manufacturing CA
export const processManufacturingCA = async (
  validatedData,
  showSuccessToastWithProgress,
  showErrorToastWithProgress,
  handleReset
) => {
  try {
 
    const csrfTokenHeaders = await fetchCsrfToken();
    const CAHeaders = {
      "Content-Type": "application/json",
      ...csrfTokenHeaders
    };
    let credentials = window.widget.getValue("Credentials");
    console.log("credentials createMFGCA", credentials);
    const credentialsParts = credentials.split(".");
    console.log("credentialsParts", credentialsParts);
    const companyName = credentialsParts[1]; // Value after the first dot
    console.log("Company Name:", companyName);
    const collabSpace = credentialsParts[2]; // Value after the second dot
 
    console.log("Collab Space:", collabSpace);
 
    const allPlantsData = await getAllPlants([collabSpace], CAHeaders, "");
    console.log("Fetched allPlantsData:", allPlantsData);
 
    const manufacturingCABody = await createManufacturingCABody(
      validatedData,
      allPlantsData,
      companyName,
      collabSpace
    );
    console.log(
      "[processManufacturingCA] Manufacturing CA Body (JSON):",
      JSON.stringify(manufacturingCABody, null, 2)
    );
 
    // Pass headers to callManufacturingCAApi
    const response = await callManufacturingCAApi(
      manufacturingCABody
    );
    console.log("[processManufacturingCA] Manufacturing CA API Response:", response);
 
    // Extract CAName from the response
    const CAName = response?.CAName ;
    //showSuccessToastWithProgress(`Manufacturing CA created successfully! Name: ${CAName}`);
    showSuccessToastWithProgress(
    <div style={{ display: "flex", alignItems: "center" }}>
    <span>
      Manufacturing CA created successfully! Name: <strong>{CAName}</strong>
    </span>
    <button
      onClick={(event) => {
        event.stopPropagation(); // Prevent the toast from closing
        navigator.clipboard.writeText(CAName); // Copy the CAName to clipboard
      }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        marginLeft: "8px",
        color: "grey",
      }}
      title="Copy CA Name"
    >
      <FaRegCopy size={14} />
    </button>
  </div>
    );
    handleReset();
    // showSuccessToast("Manufacturing CA created successfully!");
  } catch (error) {
    console.error("Error in processManufacturingCA:", error);
    showErrorToastWithProgress("Failed to create Manufacturing CA. Please try again.");
  }
};