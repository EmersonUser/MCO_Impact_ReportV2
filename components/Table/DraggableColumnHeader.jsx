import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flexRender } from "@tanstack/react-table";

const DraggableColumnHeader = ({ header, columns, table }) => {
  const isFixed = header.column.id === "selection";
  const isPinned = table
    .getState()
    .columnPinning.left.includes(header.column.id);
  const className = isFixed ? "is-fixed" : isPinned ? "is-pinned" : "";
  const sortable = useSortable({
    id: header.column.id,
    disabled: header.column.id === "selection" || header.column.id === "EIN",
  });

  const { attributes, listeners, setNodeRef, transform, isDragging } = isFixed
    ? {
        attributes: {},
        listeners: {},
        setNodeRef: null,
        transform: null,
        isDragging: false,
      }
    : sortable;

  const style = {
    opacity: isDragging ? 0.8 : 1,
    position: "sticky",
    top: 0,
    left: isFixed ? 0 : isPinned ? "var(--pinned-left)" : "auto",
    transform: CSS.Transform.toString(transform),
    transition: "width transform 0.2s ease-in-out",
    width: header.getSize(),
    zIndex: isFixed ? 5 : isPinned ? 4 : 3,
    cursor: isFixed ? "default" : "move",
    backgroundColor: "#f2f2f2",
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      data-fixed={isFixed}
      data-pinned={isPinned}
      className={className}
    >
      <div
        className="d-flex align-items-center header-content"
        {...(!isFixed ? { ...attributes, ...listeners } : {})}
      >
        <div
          className="flex-grow-1"
          onClick={header.column.getToggleSortingHandler()}
        >
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
          {header.column.getIsSorted() === "asc" ? (
            <span className="icon">↑</span>
          ) : header.column.getIsSorted() === "desc" ? (
            <span className="icon">↓</span>
          ) : null}
        </div>
      </div>
      <div
        {...{
          onDoubleClick: () => header.column.resetSize(),
          onMouseDown: header.getResizeHandler(),
          onTouchStart: header.getResizeHandler(),
          className: `Resizer ${
            header.column.getIsResizing() ? "isResizing" : ""
          }`,
        }}
      />
    </th>
  );
};

export default DraggableColumnHeader;
