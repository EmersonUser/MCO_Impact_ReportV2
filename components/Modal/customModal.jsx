import React from "react";
import { Modal, Button } from "react-bootstrap";

const CustomModal = ({ show, onHide, title, children, footerButtons }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || "Modal Title"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        {footerButtons ? (
          footerButtons.map((btn, index) => (
            <Button
              key={index}
              variant={btn.variant || "secondary"}
              onClick={btn.onClick}
            >
              {btn.label}
            </Button>
          ))
        ) : (
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CustomModal;
