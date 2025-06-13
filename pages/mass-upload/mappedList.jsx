import React, { useEffect } from "react";
import StaticTable from "../../components/bootsrap-table/Table";
import useMassUpload from "../../hooks/Mass-Upload/useMassUpload";

const MappedList = ({
  columnHeaders,
  mandatoryAttributes,
  selectedMappings,
  setSelectedMappings,
}) => {
  console.log("MappedList - Received columnHeaders:", columnHeaders);
  console.log(
    "MappedList - Received mandatoryAttributes:",
    mandatoryAttributes
  );

  const { mappedAttributes } = useMassUpload(); // Gets UI/backend name mappings
  const { allNLSValues = [], dropdownOptions = [] } = mappedAttributes || {};

  useEffect(() => {
    if (mappedAttributes && Object.keys(mappedAttributes).length > 0) {
      console.log("Mapped Attributes updated:", mappedAttributes);
    }
  }, [mappedAttributes]);

  // Checks if column header matches any NLS value
  const hasMatchingNLS = (header) => {
    if (!Array.isArray(allNLSValues)) {
      console.warn("allNLSValues is not an array:", allNLSValues);
      return false;
    }

    // Simple case-insensitive exact matching
    const normalizedHeader = header.toLowerCase().trim();
    const hasMatch = allNLSValues.some(
      (nls) => nls.toLowerCase().trim() === normalizedHeader
    );
    console.log(
      `Checking if header '${header}' matches any NLS value:`,
      hasMatch
    );
    return hasMatch;
  };

  // Gets backend name for selected UI label
  const getBackendNameForUILabel = (uiLabel) => {
    const option = dropdownOptions.find((opt) => opt.uiLabel === uiLabel);
    return option ? option.backendName : uiLabel;
  };

  // Prepare dropdown options for the table
  // ...existing code...

  // Prepare dropdown options for the table - filter out already selected values
  const prepareDropdownOptions = (currentColumnHeader) => {
    // Get all currently selected values except for the current column
    const selectedValues = Object.entries(selectedMappings)
      .filter(([header]) => header !== currentColumnHeader) // Exclude current column
      .map(([_, mapping]) => mapping.uiLabel || mapping.mappedAttribute);

    // Filter out options that are already selected in other columns
    return dropdownOptions
      .filter((attr) => !selectedValues.includes(attr.uiLabel))
      .map((attr) => ({
        value: attr.uiLabel,
        label: attr.uiLabel,
      }));
  };

  // ...existing code...

  // Handles selection changes from Table
  const handleSelectChange = (columnHeader, value) => {
    // Get backend name for the selected UI label
    const backendName = getBackendNameForUILabel(value);

    setSelectedMappings((prev) => ({
      ...prev,
      [columnHeader]: {
        columnName: columnHeader,
        uiLabel: value,
        mappedAttribute: backendName,
        isMandatory: mandatoryAttributes.includes(columnHeader),
      },
    }));
  };

  // Prepare column data with all needed information
  // ...existing code...

  // Prepare column data with all needed information
  const prepareColumnsData = () => {
    return columnHeaders.map((header) => {
      const hasNLS = hasMatchingNLS(header);
      const isMandatory = mandatoryAttributes.includes(header);

      return {
        header,
        isMandatory,
        hasNLS,
        currentMapping: selectedMappings[header],
        defaultLabel: hasNLS ? header : "Please select from Drop Down",
        // Only disable if BOTH conditions are true: has NLS match AND is mandatory
        disabled: hasNLS && isMandatory,
      };
    });
  };

  // ...existing code...
  return (
    <StaticTable
      columnHeaders={prepareColumnsData()}
      handleSelectChange={handleSelectChange}
      selectedMappings={selectedMappings}
      dropdownOptions={(header) => prepareDropdownOptions(header)} // Pass as a function
    />
  );
};

export default MappedList;
