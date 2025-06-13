// ColumnMappingModal.jsx
import React, { useState, useEffect } from "react";
import CustomModal from "../../components/Modal/customModal";
import ReusableAlert from "../../components/Alert/ReusableAlert";
import MappedList from "../../pages/mass-upload/mappedList";
import useMassUpload from "../../hooks/Mass-Upload/useMassUpload";
//import useFetchDocumentData from "../../hooks/Mass-Upload/useMassUploadDocument";

const ColumnMappingModal = ({
  show, //controls modal visibility//
  onHide, //function to hide modal//
  columnHeaders, //array of column names from Excel//
  mandatoryAttributes, //required fields from excel//
  onColumnsMapped, //callback to receive the final mapping
  existingMappings = {}, // Add this prop for existing mappings
}) => {
  // Initialize with existing mappings if available
  const [selectedMappings, setSelectedMappings] = useState(existingMappings);
  const { mappedAttributes } = useMassUpload();

  // Reset mappings when modal is opened with new existingMappings
  useEffect(() => {
    if (show && Object.keys(existingMappings).length > 0) {
      setSelectedMappings(existingMappings);
    }
  }, [show, existingMappings]);

  const handleOkClick = () => {
    console.group("Column Mapping Results");
    console.log("Raw Mappings:", selectedMappings);

    // Create complete mappings including unmapped columns
    const completeMappings = {};

    // Start with existing mappings to ensure we don't lose any
    const simplifiedMappings = { ...existingMappings };

    const { allNLSValues = [], dropdownOptions = [] } = mappedAttributes || {};

    // Helper function to check if column has matching NLS
    const hasMatchingNLS = (header) => {
      if (!Array.isArray(allNLSValues)) return false;
      const normalizedHeader = header.toLowerCase().trim();
      return allNLSValues.some(
        (nls) => nls.toLowerCase().trim() === normalizedHeader
      );
    };

    // Helper function to get backend name for a column with NLS match
    const getBackendNameForHeader = (header) => {
      const normalizedHeader = header.toLowerCase().trim();
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
      if (selectedMappings[columnName]) {
        // Column was mapped by user - extract the proper backend name
        const userMapping = selectedMappings[columnName];

        // Handle both object and string mappings
        if (typeof userMapping === "object" && userMapping !== null) {
          // It's an object with mappedAttribute property
          completeMappings[columnName] = userMapping;
          simplifiedMappings[columnName] = userMapping.mappedAttribute;
        } else {
          // It's already a string
          completeMappings[columnName] = {
            columnName: columnName,
            uiLabel: columnName,
            mappedAttribute: userMapping,
            isMandatory: mandatoryAttributes.includes(columnName),
            autoMapped: false,
          };
          simplifiedMappings[columnName] = userMapping;
        }
      } else {
        // Column was not manually mapped - check if it already has a mapping
        if (existingMappings[columnName]) {
          // Use existing mapping
          const existingMapping = existingMappings[columnName];

          if (typeof existingMapping === "object" && existingMapping !== null) {
            // It's an object with mappedAttribute
            completeMappings[columnName] = existingMapping;
            simplifiedMappings[columnName] = existingMapping.mappedAttribute;
          } else {
            // It's a string backend name
            completeMappings[columnName] = {
              columnName: columnName,
              uiLabel: columnName,
              mappedAttribute: existingMapping,
              isMandatory: mandatoryAttributes.includes(columnName),
              autoMapped: true,
            };
            // simplifiedMappings already has this from the spread above
          }
        } else {
          // No existing mapping - try to create one
          const hasNLS = hasMatchingNLS(columnName);
          const isSpecialColumn = specialMappings[columnName];
          const isMandatory = mandatoryAttributes.includes(columnName);

          if (hasNLS || isSpecialColumn || isMandatory) {
            const mappedAttribute = isSpecialColumn
              ? specialMappings[columnName]
              : getBackendNameForHeader(columnName);

            completeMappings[columnName] = {
              columnName: columnName,
              uiLabel: columnName,
              mappedAttribute: mappedAttribute,
              isMandatory: isMandatory,
              autoMapped: true,
            };

            simplifiedMappings[columnName] = mappedAttribute;
          } else {
            // For unmapped columns without NLS match, use column name as attribute
            simplifiedMappings[columnName] = columnName;
            completeMappings[columnName] = {
              columnName: columnName,
              uiLabel: columnName,
              mappedAttribute: columnName,
              isMandatory: false,
              autoMapped: false,
            };
          }
        }
      }
    });

    // Create final mapping object with complete mappings
    const finalMapping = {
      columnMappings: completeMappings,
      totalColumns: Object.keys(completeMappings).length,
    };

    console.log("Final Mapping Object:", finalMapping);
    console.log("Simplified Mappings for Backend:", simplifiedMappings);
    console.groupEnd();

    // Call the callback with the mappings if provided
    if (onColumnsMapped) {
      onColumnsMapped(simplifiedMappings, finalMapping);
    }

    onHide();
  };

  const errorMessage = (
    <>
      <strong>⚠️Note:</strong> All column(s) of uploaded Spreadsheet are mapped
      to valid Attribute Name. All mandatory Attribute Name is mapped to
      uploaded Spreadsheet Column Name.
    </>
  );

  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title="Manage Spreadsheet Columns"
      footerButtons={[
        {
          label: "Ok",
          variant: "primary",
          onClick: handleOkClick,
        },
        {
          label: "Cancel",
          variant: "danger",
          onClick: onHide,
        },
        {
          label: "Reset",
          variant: "secondary",
          onClick: () => setSelectedMappings({}),
        },
      ]}
    >
      <ReusableAlert
        variant="info"
        message={errorMessage}
        className="mapped-popup-alert"
      />
      <MappedList
        columnHeaders={columnHeaders}
        mandatoryAttributes={mandatoryAttributes}
        selectedMappings={selectedMappings}
        setSelectedMappings={setSelectedMappings}
      />
    </CustomModal>
  );
};

export default ColumnMappingModal;
