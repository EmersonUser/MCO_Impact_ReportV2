import React, { useEffect, useRef } from "react";
import "./DragAndDrop.css"; // Import styles for the component
import { Image } from "react-bootstrap";
import useDroppableArea from "../../hooks/useDroppableArea";
import usePlantDropableArea from "../../hooks/usePlantDropableArea";
import useBOSDropableArea from "../../hooks/useBOSDropableArea";
// import usePlantDropableArea from "../../hooks/usePlantDropableArea";

const DragAndDropStandAlone = ({ widgetType }) => {
  const plantDroppable = usePlantDropableArea();
  const bosDropable = useBOSDropableArea();
  const defaultDroppable = useDroppableArea();
  const mcoimpactreportDroppable = usePlantDropableArea();

  const { initializeDroppableArea } =
    widgetType === "PlantAssignment"
      ? plantDroppable
      : widgetType === "bosWidget"
      ? bosDropable
      : widgetType === "mcoimpactreport"
      ? mcoimpactreportDroppable
      : defaultDroppable;
  const hasInitializedDroppable = useRef(false);

  useEffect(() => {
    if (!hasInitializedDroppable.current) {
      // console.log("[DragAndDrop] 🔄 Initializing droppable area...");
      initializeDroppableArea();
      hasInitializedDroppable.current = true; // ✅ Prevent multiple calls
    }
  }, []);

  return (
    <>
      <div className="droppable-container mt-4">
        <Image
          style={{ width: "90px", height: "90px" }}
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
      </div>
    </>
  );
};

export default DragAndDropStandAlone;
