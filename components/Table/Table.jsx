import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useDispatch } from "react-redux";
import "./Table.css";
import CustomButton from "../Button/Button";
import { setSelectedTableRows } from "../../store/droppedObjectSlice";
import { handleExportExcel } from "../../utils/helpers";
import { getRowRange } from "../../utils/helpers";
import DraggableColumnHeader from "./DraggableColumnHeader";
import DraggableCell from "./DraggableCellComponent";

// Add this utility  function to get the storage key based on the widget type
const getWidgetStorageKey = (widgetType) => {
  console.log("Widget Type:", widgetType);
  if (!widgetType) {
    console.warn("Widget type is missing, using default key");
    return "tableColumnOrder_default";
  }
  return `tableColumnOrder_${widgetType}`;
};

const ReusableTable = ({
  columns,
  data,
  editable = false,
  meta,
  type,
  widgetType,
  latestRevision,
  droppedRevision,
  onSelectableRowsChange,
}) => {
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState(data);
  const [rowSelection, setRowSelection] = useState({});
  const [lastSelectedId, setLastSelectedId] = useState(null); // Track last clicked row
  const tableRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
    
  useEffect(() => {
    const handleScroll = (e) => {
      setIsScrolled(e.target.scrollTop > 0);
    };

    const tableContainer = tableRef.current;
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (tableContainer) {
        tableContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  if (widgetType !== "Revision_FLoat_Widget" && widgetType !== "Plant_Assignment_Widget") {
    var { updateTableData } = meta; // Need to work on this
  }

  // Modified columnOrder initialization
  const [columnOrder, setColumnOrder] = useState(() => {
    const storageKey = getWidgetStorageKey(widgetType);
    const storedOrder = localStorage.getItem(storageKey);

    if (storedOrder) {
      try {
        const parsed = JSON.parse(storedOrder);
        // Validate stored columns match current columns
        const isValid = parsed.every(
          (colId) =>
            colId === "selection" ||
            columns.some((col) => (col.id || col.accessorKey) === colId)
        );
        if (isValid) return parsed;
      } catch (error) {
        console.error(`Failed to parse column order for ${widgetType}:`, error);
      }
    }

    // Default order if nothing in localStorage or invalid data
    const initialOrder = ["selection"];
    const otherColumns = columns.map((col) => col.id || col.accessorKey);
    initialOrder.push(...otherColumns);
    return initialOrder;
  });

  // Update localStorage with widget-specific key
  useEffect(() => {
    const storageKey = getWidgetStorageKey(widgetType);
    localStorage.setItem(storageKey, JSON.stringify(columnOrder));
  }, [columnOrder, widgetType]);

  console.log("Column Order:", columnOrder);

  // Store default column order for reset functionality
  const defaultColumnOrder = useMemo(() => {
    const initialOrder = ["selection"];
    const otherColumns = columns.map((col) => col.id || col.accessorKey);
    initialOrder.push(...otherColumns);
    return initialOrder;
  }, [columns]);

  // Modified reset columns handler
  const handleResetColumns = () => {
    const storageKey = getWidgetStorageKey(widgetType);
    localStorage.removeItem(storageKey);
    setColumnOrder(defaultColumnOrder);
    // console.log("Reset columns clicked", defaultColumnOrder);
  };

  const handleEditCell = (rowIndex, columnId, value) => {
    const updatedData = tableData.map((row, index) =>
      index === rowIndex ? { ...row, [columnId]: value } : row
    );
    console.log("[Table] Updated Table Data:", updatedData);

    // Call the meta function to update external data if needed
    if (meta?.updateTableData) {
      meta.updateTableData(updatedData);
    }
    setTableData(updatedData);
  };

  // Initialize columnPinning based on column definitions
  const initialColumnPinning = useMemo(() => {
    const pinnedColumns = { left: ["selection", "EIN "] };
    columns.forEach((column) => {
      if (column.columnPinning) {
        pinnedColumns.left.push(column.id || column.accessorKey);
      }
    });
    return pinnedColumns;
  }, [columns]);

  // Enhance columns for editable functionality and add checkbox selection
  const enhancedColumns = useMemo(() => {
    const selectionColumn = {
      id: "selection",
      header: ({ table }) => (
        <input
          type="checkbox"
          ref={(el) => {
            if (el) {
              el.indeterminate = table.getIsSomeRowsSelected();
            }
          }}
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => {
        const isSelectable = enableRowSelection(row.original); // Get row's selectability status

        return (
          <input
            type="checkbox"
            disabled={!isSelectable} // Disable non-selectable rows
            style={{
              cursor: isSelectable ? "pointer" : "not-allowed", // Block cursor for non-selectable rows
              opacity: isSelectable ? 1 : 0.5, // Make disabled checkboxes faded
            }}
            {...{
              checked: row.getIsSelected(),
              onChange: row.getToggleSelectedHandler(),
            }}
          />
        );
      },
    };

    const baseColumns = editable
      ? columns.map((column) => ({
          ...column,
          cell: column.editable
            ? ({ row, getValue }) => (
                <input
                  className="input-cell"
                  value={getValue()}
                  onChange={(e) =>
                    handleEditCell(
                      row.index,
                      column.accessorKey,
                      e.target.value
                    )
                  }
                />
              )
            : column.cell,
        }))
      : columns;

    return [selectionColumn, ...baseColumns];
  }, [columns, editable]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {})
  );

  // Jatin added this for testing, if needs to change and make it work in the parent component, then will change this.
  useEffect(() => {
    if (widgetType === "Bos_Attribute_Widget") {
      const selectableRows = tableData.filter(enableRowSelection);
      onSelectableRowsChange(selectableRows); // Notify parent
    }
  }, [widgetType, tableData, onSelectableRowsChange]);

  // Modified handleDragEnd to save to localStorage
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      if (active.id !== "selection" && active.id !== "EIN") {
        setColumnOrder((prevOrder) => {
          const oldIndex = prevOrder.indexOf(active.id);
          const newIndex = prevOrder.indexOf(over.id);
          const newOrder = arrayMove(prevOrder, oldIndex, newIndex);
          return newOrder;
        });
      }
    }
  };
  const enableRowSelection = (row) => {
    if (widgetType === "Bos_Attribute_Widget" && type === "Document") {
      return row.IsLatest === "TRUE";
    }
    if (widgetType === "Bos_Attribute_Widget") {
      return !latestRevision || latestRevision === droppedRevision;
    }
    return true;
  };

  const table = useReactTable({
    data: tableData,
    columns: enhancedColumns,
    state: {
      rowSelection,
      columnOrder,
      columnPinning: initialColumnPinning,
    },
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),

    // Earlier it was
    //  enableRowSelection: true,

    enableRowSelection: (row) => enableRowSelection(row.original),

    defaultColumn: {
      size: 170,
      minSize: 50,
      maxSize: 500,
    },
    columnResizeMode: "onChange",
    meta: {
      updateTableData, // Added this to the meta field to allow columns to update the table data
    },
  });

  useEffect(() => {
    // Get selected row data using table.getSelectedRowModel()
    const selectedRows = table
      .getSelectedRowModel()
      .flatRows.map((row) => row.original);
    // console.log("Selected Rows (TanStack Table):", selectedRows);
    dispatch(setSelectedTableRows(selectedRows)); // Update Redux store
  }, [rowSelection, dispatch]); // Update when rowSelection changes

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes = {};
    console.log("table.getTotalSize()", table.getTotalSize());
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    }
    return colSizes;
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  const handleSelectAll = () => {
    table.getToggleAllRowsSelectedHandler()({
      target: { checked: true },
    });
  };

  const handleDeselectAll = () => {
    table.getToggleAllRowsSelectedHandler()({
      target: { checked: false },
    });
  };

  const handleExport = () => {
    console.log("Export button clicked");
    console.log("Widget Type in handleExport:", widgetType); // ADD THIS LINE
    if (widgetType === "Revision_FLoat_Widget") {
      console.log("Exporting for Revision_FLoat_Widget"); // ADD THIS LINE
      handleExportExcel(data, "Where Used Details.xlsx");
    } else if (widgetType === "Plant_Assignment_Widget") {
      console.log("Exporting for Plant_Assignment_Widget"); // ADD THIS LINE
      handleExportExcel(data, "EAN_Manufacturing.xlsx");
    } else if (widgetType === "Bos_Attribute_Widget") {
      console.log("Exporting for Bos_Attribute_Widget"); // ADD THIS LINE
      handleExportExcel(data, "Bos_Attribute_Widget.xlsx");
    } else {
      console.log(
        "Exporting with default filename for widgetType:",
        widgetType
      ); // ADD THIS LINE
      handleExportExcel(data, "table-data.xlsx"); // Default case
    }
  };

  const handleRowClick = (row, event) => {
    const { rows, rowsById } = table.getRowModel();
    if (event.shiftKey && lastSelectedId) {
      try {
        const rowsToToggle = getRowRange(rows, row.id, lastSelectedId);
        const isLastSelected = rowsById[lastSelectedId].getIsSelected();
        rowsToToggle.forEach((r) => r.toggleSelected(isLastSelected));
      } catch (e) {
        console.error("Multi-select with shift+click failed:", e);
      }
    } else {
      row.toggleSelected(!row.getIsSelected());
    }
    setLastSelectedId(row.id);
  };

  return (
    <>
      <div className="toolkit my-3">
        <div className="d-flex justify-content-end button-container">
          <div className="d-flex">
            <CustomButton
              variant="outline-primary"
              size="lg"
              onClick={handleSelectAll}
              className="m-2"
              text="Select All"
            />

            <CustomButton
              variant="outline-secondary"
              size="lg"
              onClick={handleDeselectAll}
              className="m-2"
              text="Deselect  All"
            />

            <CustomButton
              variant="outline-success"
              size="lg"
              onClick={handleExport}
              className="m-2 border-bottom-10px"
              text="Export to CSV "
            />

            <CustomButton
              variant="outline-warning"
              size="lg"
              onClick={handleResetColumns}
              className="m-2"
              text="Reset Columns"
            />
          </div>
        </div>
      </div>
      <div className="table-info">
        <p>{tableData.length} Items</p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={tableRef}
          className={`table-responsive ${isScrolled ? "is-scrolled" : ""}`}
        >
          <table
            className="table custom-table table-hover"
            style={{
              ...columnSizeVars,
              width: table.getTotalSize(),
            }}
          >
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <SortableContext
                    items={table.getVisibleLeafColumns().map((col) => col.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => (
                      <DraggableColumnHeader
                        key={header.id}
                        header={header}
                        columns={columns}
                        table={table}
                      />
                    ))}
                  </SortableContext>
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={(event) => handleRowClick(row, event)}
                    className={rowSelection[row.id] ? "row-selected" : ""}
                  >
                    <SortableContext
                      items={table.getVisibleLeafColumns().map((col) => col.id)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <DraggableCell
                          key={cell.id}
                          cell={cell}
                          columns={columns}
                          changedCells={row.original.changedCells} // Pass changed cells info
                        />
                      ))}
                    </SortableContext>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getHeaderGroups()[0].headers.length}
                    className="no-data p-2"
                  >
                    No Table Data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DndContext>
    </>
  );
};

export default ReusableTable;
