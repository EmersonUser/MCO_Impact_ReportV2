import React from "react";
import Table from "react-bootstrap/Table";
import "./ErrorPopup.css";
import { Alert } from "react-bootstrap";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";

const ErrorPopup = ({ errors }) => {
  // console.log("Errors in ErrorPopup:", errors);

  const [sorting, setSorting] = React.useState([]);

  const columns = React.useMemo(
    () => [
      {
        header: "Row Number",
        accessorFn: (errorString) => {
          const rowMatch = errorString.match(/Row (\d+):/);
          return rowMatch ? parseInt(rowMatch[1], 10) : null;
        },
        cell: (info) => info.getValue() || "-",
      },
      {
        header: "Error Description",
        accessorFn: (errorString) => {
          const rowMatch = errorString.match(/Row (\d+):/);
          return rowMatch ? errorString.split(": ")[1] : errorString;
        },
        cell: (info) => info.getValue(),
      },
      {
        header: "Column Name",
        accessorFn: (errorString) => {
          const columnMatch = errorString.match(/"([^"]*)" is required/);
          return columnMatch ? columnMatch[1] : null;
        },
        cell: (info) => info.getValue() || "-",
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: errors,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <>
      <Alert variant="danger" className="text-center text-sm-start mb-3">
        <strong>Note:</strong> Below reports show only uploaded spreadsheet
        error rows. To resolve below issues, do the required changes in the
        spreadsheet and re-import.
      </Alert>
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead className="table-light">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} colSpan={header.colSpan}>
                      <div
                        className={`table-header-group ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : ""
                        }`} // Apply header style
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(
                            // Span for header text
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {/* Sorting indicator at the end */}
                        {header.column.getIsSorted() === "asc" ? (
                          <span className="sorting-icon">↑</span>
                        ) : header.column.getIsSorted() === "desc" ? (
                          <span className="sorting-icon">↓</span>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center">
                  No Errors Found
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
};

export default ErrorPopup;
