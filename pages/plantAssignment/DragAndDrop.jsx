import React, { useEffect } from "react";
import "../../components/DragAndDrop/DragAndDrop.css"; // Import styles for the component
import { Button, Form, Image } from "react-bootstrap";
import SearchInput from "../../components/SearchInput/SearchInput";
import useInterComSearch from "../../hooks/useInterComSearch";
import usePlantDropableArea from "../../hooks/usePlantDropableArea";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import "./plantAssignment.css";

const DragAndDropComponent = ({
  handleFileInputChange,
  fileInputRef,
  isFileInputDisabled,
  handleSubmit,
  isCreateButtonDisabled,
  handleReset,
}) => {
  const { handleDrop } = usePlantDropableArea();
  const { performSearch } = useInterComSearch();


  const handleSearch = (searchText) => {
    const searchOpts = {
      title: "Search",
      role: "",
      mode: "furtive",
      default_with_precond: true,
      precond:
        'flattenedtaxonomies:"types/VPMReference" OR flattenedtaxonomies:"types/Raw_Material" OR flattenedtaxonomies:"types/Document"',
      show_precond: false,
      multiSel: false,
      idcard_activated: false,
      select_result_max_idcard: false,
      itemViewClickHandler: "",
      search_delegation: "3dsearch",
    };

    const handleSearchResults = (selectedObjects) => {
      console.log("Selected objects:", selectedObjects);
      console.log("objectId: selectedObjects[0].id", selectedObjects[0].id);
      if (
        selectedObjects &&
        selectedObjects.length > 0 &&
        selectedObjects[0].id
      ) {
        handleDrop([
          {
            objectId: selectedObjects[0].id,
            objectType: selectedObjects[0]["ds6w:type_value"],
          },
        ]);
      } else {
        console.warn("No objectId found in selected objects");
      }
    };

    performSearch(searchText, searchOpts, handleSearchResults);
  };

  return (
    <>
      <div className="droppable-container mt-4">
        <Image
          style={{ width: "90px", height: "65px" }}
          src="https://thewhitechamaleon.github.io/testrapp/images/drag.png"
          alt="Data Collect"
          className="search-icon"
        />
        <span className="drag-and-drop-text">Drag and Drop</span>
        <div className="divider-container">
          <hr className="divider" />
          <span className="divider-text">or</span>
          <hr className="divider" />
        </div>
        <SearchInput onSearch={handleSearch} />
        <div class="mt-3">
          <div class="row justify-content-center">
            <div class="col-6 col-md-auto mb-2">
              <Button
                variant="link ms-auto"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href =
                    "https://github.com/aayush825/EMR_PLANT_WIDGET/raw/main/plant_assignment_template.xlsx"; // Use the raw file URL for direct download
                  link.download = "plant_assignment_template.xlsx"; // Set the file name for the download
                  link.click();
                }}
              >
                Download Template
              </Button>
            </div>
            <div class="col-6 col-md-auto mb-2">
              <Form.Group controlId="formFileMultiple">
                <Form.Control
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  disabled={isFileInputDisabled}
                  ref={fileInputRef} // Attach the ref to the file input
                />
              </Form.Group>
            </div>
            <div class="col-6 col-md-auto mb-2">
              <Button variant="outline-danger" onClick={handleReset}>
                <FontAwesomeIcon icon={faRotateLeft} />
              </Button>
            </div>
            <div class="col-6 col-md-auto mb-2">
              <div
                style={{
                  display: "inline-block",
                  cursor: isCreateButtonDisabled ? "not-allowed" : "pointer", // Apply cursor style to the wrapper div
                }}
              >
                <Button
                  // variant="outline-primary"
                  variant={
                    isCreateButtonDisabled ? "secondary" : "outline-primary"
                  }
                  onClick={handleSubmit}
                  disabled={isCreateButtonDisabled} // Disable the button
                >
                  Create Manufacturing CA
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DragAndDropComponent;
