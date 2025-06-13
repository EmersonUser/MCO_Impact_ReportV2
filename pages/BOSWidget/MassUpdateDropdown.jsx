import React, { useState } from "react";

const MassUpdateDropdown = ({
  editableColumns,
  selectedRows,
  onApplyUpdate,
  valueOptions,
  onClose, // New prop to close dropdown
}) => {
  const [selectedColumn, setSelectedColumn] = useState("");
  const [selectedValue, setSelectedValue] = useState("");

  const handleApplyUpdate = (applyToAll) => {
    if (!selectedColumn || !selectedValue) {
      alert("Please select a column and a value.");
      return;
    }

    onApplyUpdate(
      selectedColumn,
      selectedValue,
      applyToAll ? "all" : "selected"
    );
    onClose(); // Close after applying update
  };

  return (
    <div
      className="dropdown-menu p-3 "
      style={{ width: "300px", display: "block" }}
    >
      <label>Select Column:</label>
      <select
        className="form-select mb-2"
        onChange={(e) => setSelectedColumn(e.target.value)}
        value={selectedColumn}
      >
        <option value="">-- Select Column --</option>
        {editableColumns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>

      <label>Select Value:</label>
      <select
        className="form-select mb-2"
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        disabled={!selectedColumn}
      >
        <option value="">-- Select Value --</option>
        {valueOptions.map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </select>

      <button
        className="btn btn-outline-success me-2 mb-2"
        onClick={() => handleApplyUpdate(false)}
        disabled={!selectedRows.length}
        style={{ cursor: !selectedRows.length ? "not-allowed" : "pointer" }}
      >
        Apply to Selected
      </button>
      <button
        className="btn btn-outline-primary me-2 mb-2"
        onClick={() => handleApplyUpdate(true)}
      >
        Apply to All
      </button>

      {/* Close Button */}
      <button className="btn btn-outline-danger me-2 mb-2" onClick={onClose}>
        Close
      </button>
    </div>
  );
};

export default MassUpdateDropdown;
