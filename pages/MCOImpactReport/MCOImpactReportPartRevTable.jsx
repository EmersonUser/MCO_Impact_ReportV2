import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import './MCOTables.css';

const MCOImpactReportPartRevTable = ({ columns, data }) => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered data
  const filteredData = useMemo(() => {
    return data.filter((row) =>
      columns.some((col) =>
        String(row[col.accessorKey])
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
    );
  }, [searchText, data, columns]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blob, "exported-data.xlsx");
  };

  return (
    <div className="container-fluid p-0 mt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* <input
          type="text"
          className="form-control w-50"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button className="btn btn-success" onClick={handleExport}>
          Export to Excel
        </button> */}
      </div>

      <div className="table-responsive">
        <table className="table custom-table table-hover">
          <thead className="thead-light">
            <tr>
              {columns.map((col) => (
                <th key={col.accessorKey}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.accessorKey}>{row[col.accessorKey]}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <p className="mb-0">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
          {filteredData.length} entries
        </p>

        <div>
          <button
            className="btn btn-outline-primary mx-1"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Prev
          </button>
          <span>{currentPage}</span>
          <button
            className="btn btn-outline-primary mx-1"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCOImpactReportPartRevTable;
