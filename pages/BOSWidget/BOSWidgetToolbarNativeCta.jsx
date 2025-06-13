import { useState } from "react";
import Popup from "../../components/Popup/Popup";
import useToast from "../../hooks/useToast";
import { MSG_BOS_SAVE } from "../../utils/toastMessages";
import MassUpdateDropdown from "./MassUpdateDropdown";

const BOSWidgetToolbarNativeCta = ({
  onSave,
  state,
  selectedRows,
  tableData,
  onMassUpdate,
  type,
  latestRevision,
  droppedRevision,
}) => {
  const { showWarningToast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSaveClick = () => {
    if (type !== "Document" && latestRevision !== droppedRevision) {
      showWarningToast(MSG_BOS_SAVE);
    } else {
      onSave();
    }
    // When save button is clicked, call onSave passed as prop
    // onSave is passed with tableData from parent
  };
  const handleMassUpdate = (column, value, scope) => {
    if (scope === "selected") {
      onMassUpdate(selectedRows, column, value);
    } else {
      onMassUpdate(tableData, column, value);
    }
  };
  const editableColumns = [
    "Print On Purchase Order Required",
    "Print On Work Order Required",
    "Work Order Document Required",
    "Print On report Order Required",
    "SAP/JDE",
  ];

  return (
    <div className="d-flex flex-column cta-absolute">
      <div className="d-flex">
        <button
          className="btn btn-outline-success btn-lg m-2"
          onClick={handleSaveClick}
        >
          Save
        </button>
        <button
          className="btn btn-outline-primary btn-lg m-2"
          onClick={() =>
            type !== "Document" && latestRevision !== droppedRevision
              ? showWarningToast(MSG_BOS_SAVE)
              : setShowDropdown((prev) => !prev)
          }
        >
          Mass Update
        </button>
      </div>

      {/* Dropdown appears below */}
      {showDropdown && (
        <div className="mt-2">
          <MassUpdateDropdown
            editableColumns={editableColumns}
            selectedRows={selectedRows}
            onApplyUpdate={handleMassUpdate}
            valueOptions={["Yes", "No"]}
            onClose={() => setShowDropdown(false)}
          />
        </div>
      )}
    </div>
  );
};

export default BOSWidgetToolbarNativeCta;
