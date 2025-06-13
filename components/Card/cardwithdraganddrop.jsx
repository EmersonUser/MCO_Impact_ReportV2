import React, { useState } from "react";
import DragAndDropStandAlone from "../DragAndDrop/DragAndDropStandAlone";
import CardComponent from "./Card";

const CardWithDragAndDrop = ({ data, widgetType }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleDragStart = () => {
    // console.log("handleDragStart called");
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    // console.log("handleDragEnd called");
    // console.log("Before setIsDragging(false) - isDragging:", isDragging);
    setIsDragging(false);
    // console.log("After setIsDragging(false) - isDragging:", isDragging);
  };
  return (
    <div className={`card-with-drag-and-drop ${isDragging ? "dragging" : ""}`}>
      <DragAndDropStandAlone widgetType={widgetType} />
      <CardComponent
        data={data}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
};

export default CardWithDragAndDrop;
