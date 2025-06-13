import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flexRender } from "@tanstack/react-table";

const DraggableCell = ({ cell, columns, changedCells }) => {
  const isFixed = cell.column.id === "selection";
  const isPinned = cell.column.getIsPinned();
  const className = isFixed ? "is-fixed" : isPinned ? "is-pinned" : "";
  const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
  // Extract only the column name (remove row index prefix like '0_')
  const columnName =
    cell.column.id.split("_").slice(1).join("_") || cell.column.id;
  const isChanged = changedCells?.[columnName];
  const sortable = useSortable({
    id: cell.column.id,
    disabled: isFixed,
  });

  const { setNodeRef, transform, isDragging } = isFixed
    ? { setNodeRef: null, transform: null, isDragging: false }
    : sortable;

  const style = {
    opacity: isDragging ? 0.8 : 1,
    position: isFixed || isPinned ? "sticky" : "relative",
    left: isFixed ? 0 : "auto",
    transform: CSS.Transform.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    width: cell.column.getSize(),
    zIndex: isFixed ? 2 : isDragging ? 1 : isPinned ? 2 : 0,
  };

  return (
    <td
      ref={setNodeRef}
      style={style}
      className={className}
      title={isFixed ? "" : `${cell.getValue()}`}
    >
      {isFixed ? (
        cellContent
      ) : (
        <div
          className="cell-content"
          style={{
            color: isChanged ? "red" : "inherit",
            fontWeight: isChanged ? "bold" : "normal",
          }}
        >
          {cellContent}
          <style>
            {`
        .cell-content select {
          color: ${isChanged ? "red" : "inherit"} !important;
          font-weight: ${isChanged ? "bold" : "normal"} !important;
        }
      `}
          </style>
        </div>
      )}
    </td>
  );
};

export default DraggableCell;
