import React, { useEffect, useState } from "react";
import Popup from "../../components/Popup/Popup";
import useToast from "../../hooks/useToast";
import {
  MSG_SAVEPRODUCT_NOT_ALLOWED_ERROR,
  MSG_SAVEPRODUCT_RELEASED_ERROR,
  MSG_ADDPRODUCT_NOT_ALLOWED_ERROR,
  MSG_ADDPRODUCT_RELEASED_ERROR,
  MSG_OPRATION_HANDLE_ON_STATE_ERROR
} from "../../utils/toastMessages";
import CustomModal from "../../components/Modal/customModal";
import AvailablePlant from "../../components/Popup/Popup";
import { useRef } from "react";
import CustomButton from "../../components/Button/Button";

const MBOMImpactReportToolbarNativeCta = ({
  onAddPlant,
  addedPlant,
  onSave,
  onRemove,
  uniquedata,
  uniqueColumn,
  CAName,
  state,
  type,
  isMFGCA,
  CAData
}) => {
  const { showWarningToast, showSuccessToast } = useToast();
  const isStateBlocked = (currentState) => {
    return currentState === "Approved" || currentState === "In Approval" || currentState === "Completed";
  };
  const [addPlantPopup, setAddPlantPopup] = useState(false);
  const availablePlantRef = useRef();

  const handleSaveClick = () => {
    if (isStateBlocked(state)) {
      showWarningToast(MSG_OPRATION_HANDLE_ON_STATE_ERROR);
      return;
    }

    if (onSave && (type === "Change Action" || CAName)) {
      onSave();
    } else if (state === "RELEASED") {
      showWarningToast(MSG_SAVEPRODUCT_RELEASED_ERROR);
    } else {
      showWarningToast(MSG_SAVEPRODUCT_NOT_ALLOWED_ERROR);
    }
    // When save button is clicked, call onSave passed as prop
    // onSave is passed with tableData from parent
  };

  const handleRemove = () => {
    if (isStateBlocked(state)) {
      showWarningToast(MSG_OPRATION_HANDLE_ON_STATE_ERROR);
      return;
    }
    if (onRemove) {
      onRemove();
    }
  };

  console.log("[Unique Table Data]:", uniquedata);

  const handleData = (data) => {
    console.log(data);
    if (type === "Change Action") {
      if (data.length > 0) {
        onAddPlant(data);
        addedPlant(data);
      }
    } else {
      if (data.length > 0) {
        const newItems = data.map((title) => ({
          title: title, // Use the title as Plant (or replace with actual data)
          Seq: "1",
          Status: "Pending",
          "MFG Change": "N/A",
          "MFG Status": "N/A",
          Change: CAData.CAName,
          "Change Status": CAData.CAStatus,
          "Oracle Template": "N/A",
          "ERP Status": "Active",
          "ERP Export": "Yes",
          "Lead Plant": "false",
          MBom: "N/A",
          "Sort Value": "",
        }));
        onAddPlant(newItems);

        addedPlant(data);
      }
    }
  };

  return (
    <>
      {/* <div className="d-flex cta-absolute">
        {!isMFGCA && (
          <button
            className="btn btn-outline-success btn-lg m-2"
            onClick={() => {
              if (isStateBlocked(state)) {
                showWarningToast(MSG_OPRATION_HANDLE_ON_STATE_ERROR);
                return;
              }

              if (type === "Change Action") {
                setAddPlantPopup(true);
              } else if (CAName) {
                setAddPlantPopup(true); // Open the modal if CAName is present
              } else if (state === "RELEASED") {
                showWarningToast(MSG_ADDPRODUCT_RELEASED_ERROR); // Show warning if state is RELEASED
              } else {
                showWarningToast(MSG_ADDPRODUCT_NOT_ALLOWED_ERROR); // Show warning if CAName is missing
              }
            }}
          >
            Add Plant
          </button>
        )}
        {isMFGCA && (
          <button
            className="btn btn-outline-success btn-lg m-2"
            onClick={() => {
              if (state === "Approved" || state === "In Approval" || state === "Completed") {
                showWarningToast(MSG_OPRATION_HANDLE_ON_STATE_ERROR);
              } else {
                setAddPlantPopup(true);
              }
            }}
          >
            Add/Update Plants
          </button>
        )}

        {type === "Change Action" && (
          <button
            className="btn btn-outline-success btn-lg m-2"
            onClick={handleSaveClick}
          >
            Save
          </button>
        )}
        {!isMFGCA && (
        <button
          className="btn btn-outline-danger btn-lg m-2"
          onClick={handleRemove}
        >
          Remove
        </button>
        )}
      </div> */}

      {/* <CustomModal
        show={addPlantPopup}
        onHide={() => setAddPlantPopup(false)}
        title="Available Plant"
        footerButtons={[
          {
            label: "Add",
            variant: "primary",
            onClick: () => {
              availablePlantRef.current?.addPlant(); // Call addPlant
              setAddPlantPopup(false);
            },
          },
          {
            label: "Close",
            variant: "danger",
            onClick: () => setAddPlantPopup(false),
          },
        ]}
      >
        <div className="modal-body">
          <AvailablePlant
            ref={availablePlantRef} // Attach the ref
            data={uniquedata} // if isMFGCA is true, pass uniquedata; else, pass empty array
            columns={uniqueColumn}
            CAName={CAName}
            addedItem={handleData}
            state={state}
          />
        </div>
      </CustomModal> */}
    </>
  );
};

export default MBOMImpactReportToolbarNativeCta;
