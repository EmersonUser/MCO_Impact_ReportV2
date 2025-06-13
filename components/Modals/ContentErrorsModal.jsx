// ContentErrorsModal.jsx
import React from "react";
import CustomModal from "../../components/Modal/customModal";
import ErrorPopup from "../../components/ErrorPopup/ErrorPopup";

const ContentErrorsModal = ({ show, onHide, errors }) => {
  console.log(`[ContentErrorsModal.jsx] errors:`, errors);
  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title="Content Errors"
      footerButtons={[
        {
          label: "Close",
          variant: "danger",
          onClick: onHide,
        },
      ]}
    >
      <ErrorPopup errors={errors} />
    </CustomModal>
  );
};

export default ContentErrorsModal;
