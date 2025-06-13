import React, { useState, useEffect, useRef } from "react";
import "./Mockup.css";
import { Form, Stack } from "react-bootstrap";
import CustomButton from "../../components/Button/Button";
import FileUpload from "../../components/FileUploader/FileUploader";
import { downloadTemplate } from "../../utils/downloadTemplate";
import useToast from "../../hooks/useToast";
import Loader from "../../components/Loader/Loader";
import validateFile from "./validateFile";
import CustomSelect from "../../components/Select/customSelect";
import { globalCollabSpaceTitles } from "../../services/api/droppableService";
import ContentErrorsModal from "../../components/Modals/ContentErrorsModal";
import ConfirmationModal from "../../components/Modals/ConfirmationModal";
import ColumnMappingModal from "../../components/Modals/ColumnMappingModal";
import api from "../../utils/api";
import useMassUpload from "../../hooks/Mass-Upload/useMassUpload";
import useFetchDocumentData from "../../hooks/Mass-Upload/useMassUploadDocument";

const API_ENDPOINTS = {
  1: "/massUpload/uploadPhysicalProduct",
  2: "/massUpload/uploadProductStructure",
  3: "/massUpload/uploadDocument",
  4: "/massUpload/uploadProductDocument",
};

// Replace the transformSheetDataWithMappings function with this implementation

const transformSheetDataWithMappings = (
  sheetData,
  columnMappings,
  operationType,
  mappedAttributesData // Add this parameter
) => {
  // Debug log column names and some sample values
  if (sheetData.length > 0) {
    console.log(
      "Actual column names in sheet data:",
      Object.keys(sheetData[0])
    );
    console.log("Sample row values:", sheetData[0]);
    console.log("Column mappings applied:", columnMappings);
  }
  if (!sheetData || !columnMappings) {
    console.error("Missing data or mappings for transformation");
    return null;
  }

  console.log("Transforming sheet data with mappings:", columnMappings);

  // Extract group information from mappedAttributes
  // const { mappedData = [], attributesByGroup = {} } =
  //   mappedAttributesData || {};
  const mappedData = mappedAttributesData?.mappedData || [];

  console.log("Mapped attributes data in mass upload:", mappedAttributesData);
  // console.log("Attributes by group in mass upload:", attributesByGroup);
  console.log("Mapped data in massupload:", mappedAttributesData.mappedData);

  // Debug full structure
  console.log("Full mapped attributes structure:", mappedAttributesData);

  // Create a map of backend attribute names to their groups
  // The correct data is in mappedData array, not mappedAttributesData.mappedData

  // Create a map of backend attribute names to their groups
  const attributeGroupMap = {};
  if (Array.isArray(mappedData)) {
    mappedData.forEach((option) => {
      attributeGroupMap[option.backendName] = option.group || "System";
      console.log(
        `Mapping ${option.backendName} to group ${option.group || "System"}`
      );
    });
  }

  console.log(
    "Backend name mapping for title:",
    mappedData.find((attr) => attr.backendName === "title")
  );
  console.log(
    "Backend name mapping for description:",
    mappedData.find((attr) => attr.backendName === "description")
  );
  console.log(
    "Backend name mapping for collabspaceTitle:",
    mappedData.find((attr) => attr.backendName === "collabspaceTitle")
  );

  // Update the getPathForAttribute function in transformSheetDataWithMappings

  const getPathForAttribute = (backendName, columnName) => {
    // ROOT LEVEL ATTRIBUTES - These always go at the root
    if (
      backendName === "title" ||
      backendName === "type" ||
      backendName === "classificationType" ||
      backendName === "collabspaceTitle" // This needs special handling
    ) {
      // Special case for collabspaceTitle - map to collabspace at root level
      if (backendName === "collabspaceTitle") {
        console.log("collabspaceTitle mapped to root collabspace");
        return "collabspaceTitle";
      }

      console.log(`${backendName} placed at root level`);
      return backendName;
    }

    // EIN NUMBER - Always goes to dseng:EnterpriseReference.partNumber
    if (
      columnName === "EIN Number" ||
      backendName === "PartNumber" ||
      backendName === "Part Number"
    ) {
      console.log(
        "EIN Number mapped to attributes.dseng:EnterpriseReference.partNumber"
      );
      return "attributes.dseng:EnterpriseReference.partNumber";
    }

    // DESCRIPTION - Always goes in attributes
    if (backendName === "description") {
      console.log("Description mapped to attributes.description");
      return "attributes.description";
    }

    // All other attributes based on their group
    const group = attributeGroupMap[backendName];
    console.log(`Attribute: ${backendName}, Group: ${group || "unknown"}`);

    // Skip attributes with unknown groups
    if (!group) {
      console.log(`Skipping attribute with unknown group: ${backendName}`);
      return null; // Return null instead of a path
    }

    if (group === "System Attributes") {
      // System attributes go directly under attributes
      return `attributes.${backendName}`;
    } else {
      // All other attributes go to dseno:EnterpriseAttributes
      return `attributes.dseno:EnterpriseAttributes.${backendName}`;
    }
  };

  // Transform each row in the sheet data
  const transformedItems = sheetData.map((row) => {
    // Initialize the structure with empty nested objects
    const transformedRow = {};

    // Process each cell in the row
    Object.entries(row).forEach(([columnName, value]) => {
      // Skip unmapped columns
      if (!columnMappings[columnName]) return;

      const uiLabelBackendName = columnMappings[columnName];

      // Special case lookup for system attributes
      const systemAttributeMappings = {
        Title: "title",
        Description: "description",
        "Collaborative Space": "collabspaceTitle",
        "Collab Space": "collabspaceTitle",
        Type: "type",
      };

      // If the mapping contains a UI label instead of backend name, convert it
      const backendName =
        systemAttributeMappings[uiLabelBackendName] ||
        mappedData.find((attr) => attr.uiLabel === uiLabelBackendName)
          ?.backendName ||
        uiLabelBackendName;

      const path = getPathForAttribute(backendName, columnName);

      // Add this debug log
      if (
        backendName === "title" ||
        backendName === "description" ||
        backendName.toLowerCase() === "collabspace"
      ) {
        console.log(`Placing ${backendName} at path: ${path}`);
      }

      // Skip if no path determined
      if (!path) return;

      // Build the nested structure
      const pathParts = path.split(".");
      let current = transformedRow;

      // Create nested objects
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }

      // Set the value at the final path location
      current[pathParts[pathParts.length - 1]] = value;
    });

    // Handle physical product type determination
    if (operationType === "1") {
      // Find the column header regardless of case
      const productTypeColumn = Object.keys(row).find(
        (key) =>
          key.toLowerCase().includes("physical product") ||
          key.toLowerCase().includes("raw material")
      );

      if (productTypeColumn && row[productTypeColumn]) {
        const productType = row[productTypeColumn].toLowerCase().trim();
        transformedRow.type = productType.includes("physical product")
          ? "VPMReference"
          : productType.includes("raw material")
          ? "Raw_Material"
          : "";

        console.log(
          `Product type determined: ${transformedRow.type} from value: ${row[productTypeColumn]}`
        );
      }
    }

    // For document, default type to "Document"
    if (operationType === "3" && !transformedRow.type) {
      transformedRow.type = "Document";
    }

    return transformedRow;
  });

  // Add this before returning the final result
  if (transformedItems.length > 0) {
    console.log(
      "Sample transformed item structure:",
      JSON.stringify(transformedItems[0], null, 2)
    );
  }

  // Prepare data in chunks for API submission
  const CHUNK_SIZE = 1000;
  const chunks = [];

  for (let i = 0; i < transformedItems.length; i += CHUNK_SIZE) {
    chunks.push(transformedItems.slice(i, i + CHUNK_SIZE));
  }

  return {
    chunks,
    totalChunks: chunks.length,
    totalItems: transformedItems.length,
    originalData: sheetData,
    mappings: columnMappings,
  };
};
// Generate automatic column mappings
const generateColumnMappings = (
  columnHeaders,
  mandatoryAttributes,
  mappedAttributes
) => {
  const { allNLSValues = [], dropdownOptions = [] } = mappedAttributes || {};
  const completeMappings = {};
  const simplifiedMappings = {};

  // Helper function to check if column has matching NLS
  const hasMatchingNLS = (header) => {
    if (!Array.isArray(allNLSValues)) return false;
    const normalizedHeader = header.toLowerCase().trim();
    return allNLSValues.some(
      (nls) => nls.toLowerCase().trim() === normalizedHeader
    );
  };

  // Special mappings for system attributes to ensure they use correct backend names
  const systemAttributeMappings = {
    Title: "title",
    Description: "description",
    "Collaborative Space": "collabspaceTitle",
    "Collab Space": "collabspaceTitle",
    Type: "type",
    "EIN Number": "Part Number",
  };

  // Then modify the getBackendNameForHeader function
  const getBackendNameForHeader = (header) => {
    // First check if it's a system attribute we want to hardcode
    if (systemAttributeMappings[header]) {
      return systemAttributeMappings[header];
    }

    const normalizedHeader = header.toLowerCase().trim();

    // Also check case-insensitive for system attributes
    const systemAttrKey = Object.keys(systemAttributeMappings).find(
      (key) => key.toLowerCase() === normalizedHeader
    );

    if (systemAttrKey) {
      return systemAttributeMappings[systemAttrKey];
    }

    // Otherwise use dropdown options
    const matchingOption = dropdownOptions.find(
      (opt) => opt.uiLabel.toLowerCase().trim() === normalizedHeader
    );
    return matchingOption ? matchingOption.backendName : header;
  };

  // Special mapping for known attributes that might not have NLS matches
  const specialMappings = {
    "EIN Number": "PartNumber",
  };

  // Process all column headers
  columnHeaders.forEach((columnName) => {
    // Column was not manually mapped
    const hasNLS = hasMatchingNLS(columnName);
    const isSpecialColumn = specialMappings[columnName];
    const isMandatory = mandatoryAttributes.includes(columnName);

    if (isSpecialColumn) {
      const mappedAttribute = specialMappings[columnName];

      completeMappings[columnName] = {
        columnName: columnName,
        uiLabel: columnName,
        mappedAttribute: mappedAttribute,
        isMandatory: isMandatory || false,
        autoMapped: true,
        isSpecial: true,
      };

      // Also add to simplified mappings
      simplifiedMappings[columnName] = mappedAttribute;
    }
    // Then handle columns with NLS matches OR mandatory columns
    else if (hasNLS || isMandatory) {
      const mappedAttribute = getBackendNameForHeader(columnName);

      completeMappings[columnName] = {
        columnName: columnName,
        uiLabel: columnName,
        mappedAttribute: mappedAttribute,
        isMandatory: isMandatory,
        autoMapped: true,
      };

      // Also add to simplified mappings
      simplifiedMappings[columnName] = mappedAttribute;
    }
  });

  return {
    completeMappings,
    simplifiedMappings,
    totalColumns: Object.keys(completeMappings).length,
  };
};

const MassUpload = () => {
  const [collabTitles, setCollabTitles] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [errorModalShow, setErrorModalShow] = useState(false);
  const [showContentErrors, setShowContentErrors] = useState(false);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState(false); // New state for spreadsheet modal
  const { showErrorToast, showSuccessToast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [operationChoice, setOperationChoice] = useState("");
  const [errors, setErrors] = useState([]);
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [mandatoryAttributes, setMandatoryAttributes] = useState([]);
  const fileUploaderRef = useRef(); // Add this ref
  const [formattedData, setFormattedData] = useState(null);
  const { mappedAttributes, refreshMapping } = useMassUpload();
  const { documentData, refreshData } = useFetchDocumentData();

  useEffect(() => {
    // Log the global variable directly to verify its contents
    console.log(
      "[MassUpload.jsx] Global collabSpaceTitles:",
      globalCollabSpaceTitles
    );
    if (Array.isArray(globalCollabSpaceTitles)) {
      setCollabTitles([...globalCollabSpaceTitles]);
    } else {
      console.error(
        "[MassUpload.jsx] ❌ globalCollabSpaceTitles is not an array!",
        globalCollabSpaceTitles
      );
    }
    console.log("[MassUpload.jsx] Retrieved collabSpaceTitles:", collabTitles);
  }, []);

  const handleFileUpload = async (files) => {
    if (files.length === 0) return;

    try {
      setIsValidating(true);
      console.log("Starting file validation...");
      console.log("Selected Operation:", operationChoice);
      console.log("File:", files[0].name);

      const validationResult = await validateFile(
        files[0],
        collabTitles,
        operationChoice
      );

      const {
        headers = [],
        validationErrors = [],
        mandatoryAttributes = [],
        sheetData = [],
      } = validationResult;

      setColumnHeaders(headers);
      setMandatoryAttributes(mandatoryAttributes);

      // Map sheet data to JSON format with operation type
      if (sheetData.length > 0) {
        console.log("Sheet Data ", sheetData);
        // // Generate initial mapping with default column names
        // const mappedData = mapsheetData(sheetData, operationChoice);
        // console.log("Mapped JSON data:", mappedData);

        // // Store original data for potential future manual mapping
        // mappedData.originalData = sheetData;
        setFormattedData({ originalData: sheetData });

        // Once mappedAttributes is refreshed, apply automatic mapping
        await refreshMapping(operationChoice);
        await refreshData(operationChoice);

        // Apply automatic column mapping (wait for mappedAttributes to be updated)
        setTimeout(() => {
          console.log(
            "Applying automatic column mapping with:",
            mappedAttributes
          );
          if (mappedAttributes && Object.keys(mappedAttributes).length > 0) {
            // Generate mappings automatically
            const { simplifiedMappings } = generateColumnMappings(
              headers,
              mandatoryAttributes,
              mappedAttributes
            );

            console.log("Auto-generated mappings:", simplifiedMappings);

            // Apply mappings to transform the data
            if (Object.keys(simplifiedMappings).length > 0) {
              const transformedData = transformSheetDataWithMappings(
                sheetData,
                simplifiedMappings,
                operationChoice,
                mappedAttributes // Pass mappedAttributes here
              );

              setFormattedData(transformedData);
              showSuccessToast(
                `Data automatically mapped with ${
                  Object.keys(simplifiedMappings).length
                } columns`
              );
            }
          }
        }, 500); // Small delay to ensure mappedAttributes is ready
      }

      if (validationErrors.length === 0) {
        setErrors([]);
        showSuccessToast("File validated successfully!");
      } else {
        setErrors(validationErrors);
        setErrorModalShow(true);
      }
    } catch (errorResponse) {
      console.error("Validation failed:", errorResponse);

      const {
        errors: responseErrors = ["Unknown validation error."],
        headers: responseHeaders = [],
        mandatoryAttributes: responseMandatoryAttributes = [],
        isTemplateMismatch = false,
      } = errorResponse;

      // If there's a template mismatch, show error and reset widget
      if (isTemplateMismatch) {
        showErrorToast(
          "The template uploaded and the selected operation do not match"
        );
        handleReset(true); // Pass true to skip success toast
        // Clear the file uploader
        if (fileUploaderRef.current) {
          fileUploaderRef.current.handleClearFiles();
        }
        return;
      }

      // Only set these states if it's not a template mismatch
      setErrors(responseErrors);
      setColumnHeaders(responseHeaders);
      setMandatoryAttributes(responseMandatoryAttributes);
      setErrorModalShow(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(showErrorToast)(operationChoice);
  };

  const handleReset = (skipSuccessToast = false) => {
    // Reset all states to their initial values
    setModalShow(false);
    setErrorModalShow(false);
    setShowContentErrors(false);
    setShowSpreadsheetModal(false);
    setIsValidating(false);
    setOperationChoice("");
    setErrors([]);
    setColumnHeaders([]);
    setMandatoryAttributes([]);
    setFormattedData(null); // Add this line

    // Reset the dropdown
    const selectElement = document.querySelector(
      'select[aria-label="Choose Operations"]'
    );
    if (selectElement) {
      selectElement.value = "";
    }

    // Only show success toast if not skipped
    if (!skipSuccessToast) {
      showSuccessToast("Widget reset successfully!");
    }
  };

  const handleOpenSpreadsheetModal = () => {
    setShowContentErrors(false); // Close content errors modal
    setShowSpreadsheetModal(true); // Open spreadsheet modal
  };

  const handleOperationChange = (value) => {
    console.log("Operation selected:", value); // Debug log
    setOperationChoice(value);
    // Add this line to fetch mapping data when operation changes
    refreshMapping(value);
  };

  // Add this useEffect to monitor state changes
  useEffect(() => {
    console.log("Operation Choice updated:", operationChoice);
  }, [operationChoice]);

  // It will be disabled if no file is uploaded (no headers) or if there are validation errors.
  const submitDisabled = columnHeaders.length === 0 || errors.length > 0;
  const manageSpreadsheetDisabled = columnHeaders.length === 0; // Disable if no file uploaded

  const handleConfirmSubmit = async () => {
    try {
      if (!formattedData) {
        showErrorToast("No data to submit");
        return;
      }

      const endpoint = API_ENDPOINTS[operationChoice];
      if (!endpoint) {
        showErrorToast("Invalid operation type");
        return;
      }

      const { chunks, totalChunks } = formattedData;
      let successCount = 0;
      let failureCount = 0;

      showSuccessToast(`Starting upload of ${totalChunks} chunks...`);

      for (let i = 0; i < chunks.length; i++) {
        try {
          const chunk = chunks[i];
          const response = await api.post(endpoint, {
            items: chunk,
          });

          if (response.status === 200) {
            successCount++;
            if (i % 5 === 0) {
              // Show progress every 5 chunks
              showSuccessToast(
                `Processed ${i + 1} of ${totalChunks} chunks...`
              );
            }
          }
        } catch (error) {
          console.error(`Chunk ${i + 1} failed:`, error);
          failureCount++;
        }
      }

      const finalMessage = `Upload complete: ${successCount} chunks successful, ${failureCount} failed`;
      if (failureCount > 0) {
        showErrorToast(finalMessage);
      } else {
        showSuccessToast("Upload successful!");
        setModalShow(false);
        handleReset();
      }
    } catch (error) {
      console.error("Upload error:", error);
      showErrorToast(`Upload failed: ${error.message}`);
    }
  };

  console.log("Errors in Massupload.jsx:", errors);

  // Add this computed value for FileUpload component
  const isFileUploadDisabled = !operationChoice;

  return (
    <>
      <Stack className="mt-3" gap={4}>
        {/* Choose operation and download template */}
        <Stack direction="horizontal">
          <CustomSelect
            selectedValue={operationChoice}
            onChange={handleOperationChange}
            size="lg"
            className="w-50"
            options={{
              defaultLabel: "Choose Operations",
              list: [
                { value: "1", label: "Physical Product/Raw Material" },
                { value: "2", label: "Physical Product Structure" },
                { value: "3", label: "Document" },
                { value: "4", label: "Physical Product-Document" },
              ],
            }}
          />
          {/* Conditionally render multiple file input for Document type */}
          <div className="p-2 ms-auto">
            {operationChoice === "3" && (
              <Form.Group controlId="formFileMultiple">
                <Form.Control type="file" multiple />
              </Form.Group>
            )}
          </div>
          <div className="p-2">
            <CustomButton
              variant="link ms-auto"
              size="lg"
              onClick={handleDownloadTemplate}
              text="Download Template"
            />
          </div>
        </Stack>

        {/* Drag and Drop File Upload */}
        {/* Modified FileUpload with disabled state */}
        <div className={isFileUploadDisabled ? "opacity-50" : ""}>
          <FileUpload
            ref={fileUploaderRef}
            fileTypes={["XLSX"]}
            multiple={false}
            onUpload={handleFileUpload}
            onReset={handleReset}
            disabled={isFileUploadDisabled}
            message={
              isFileUploadDisabled
                ? "Please select an operation first"
                : "Drag & Drop your files here or Click to browse"
            }
          />
        </div>

        {/* Show loader while validating */}
        {isValidating && <Loader />}

        {/* Submit Button and Content Error Button */}
        <Stack direction="horizontal" gap={2}>
          <Form.Check
            type="checkbox"
            label="Background"
            className="size-increase"
          />
          <div className="ms-auto d-flex gap-5">
            {errors.length > 0 && (
              <CustomButton
                variant="danger"
                onClick={() => setShowContentErrors(true)}
                text={`Content Errors (${errors.length})`}
              />
            )}

            <CustomButton
              variant={manageSpreadsheetDisabled ? "secondary" : "info"}
              onClick={handleOpenSpreadsheetModal}
              text="Manage Spreadsheet Columns"
              disabled={manageSpreadsheetDisabled}
            />

            <CustomButton
              variant={submitDisabled ? "secondary" : "primary"}
              disabled={submitDisabled}
              size="lg"
              onClick={() => setModalShow(true)}
              text="Submit"
            />
          </div>
        </Stack>
      </Stack>

      {/* Content Errors Modal */}
      <ContentErrorsModal
        show={showContentErrors}
        onHide={() => setShowContentErrors(false)}
        errors={errors}
      />

      {/* Confirmation Modal */}

      <ConfirmationModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        onConfirm={handleConfirmSubmit}
      />

      {/* Column Mapping */}

      <ColumnMappingModal
        show={showSpreadsheetModal}
        onHide={() => setShowSpreadsheetModal(false)}
        columnHeaders={columnHeaders}
        mandatoryAttributes={mandatoryAttributes}
        existingMappings={formattedData?.mappings ? formattedData.mappings : {}}
        onColumnsMapped={(mappings, finalMapping) => {
          console.log("Column mappings received:", mappings);

          // Store the column mappings
          const columnMappings = mappings;

          // Transform the sheet data using the column mappings
          if (formattedData && formattedData.originalData) {
            const transformedData = transformSheetDataWithMappings(
              formattedData.originalData,
              columnMappings,
              operationChoice,
              mappedAttributes // Pass mappedAttributes here
            );

            setFormattedData(transformedData);
            showSuccessToast(
              `Data mapped successfully with ${
                Object.keys(mappings).length
              } columns`
            );
          } else {
            showErrorToast(
              "No sheet data available to transform with mappings"
            );
          }
        }}
      />
    </>
  );
};

export default MassUpload;
