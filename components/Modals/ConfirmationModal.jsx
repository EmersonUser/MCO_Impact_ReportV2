// ConfirmationModal.jsx
import React from "react";
import CustomModal from "../../components/Modal/customModal";

const ConfirmationModal = ({ show, onHide, onConfirm }) => {
  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title="Confirmation"
      footerButtons={[
        {
          label: "Cancel",
          variant: "danger",
          onClick: onHide,
        },
        {
          label: "Confirm",
          variant: "success",
          onClick: onConfirm,
        },
      ]}
    >
      <p>Are you sure you want to submit?</p>
    </CustomModal>
  );
};

export default ConfirmationModal;
