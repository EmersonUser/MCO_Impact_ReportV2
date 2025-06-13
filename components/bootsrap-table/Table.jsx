import React from "react";
import Table from "react-bootstrap/Table";
import CustomSelect from "../Select/customSelect";
// import "./staticTable.css"; // Ensure updated styles are applied

const StaticTable = ({
  columnHeaders,
  handleSelectChange,
  dropdownOptions = [],
}) => {
  return (
    <Table bordered className="table-light">
      <thead>
        <tr>
          <th className="header-styling">Column Name</th>
          <th className="header-styling">Attribute Name</th>
        </tr>
      </thead>
      <tbody>
        {columnHeaders.map((column, index) => {
          const { header, currentMapping, defaultLabel, disabled } = column;
          // Get filtered dropdown options for this specific column
          const filteredOptions = dropdownOptions(header);

          return (
            <tr key={index} className={disabled ? "disabled-row" : ""}>
              <td className={disabled ? "disabled-cell" : ""}>{header}</td>
              <td
                className={`dropdown-cell ${
                  disabled ? "disabled-dropdown" : ""
                }`}
              >
                <div className="dropdown-wrapper">
                  <CustomSelect
                    index={index}
                    selectedValue={currentMapping?.uiLabel || header}
                    onChange={(index, value) =>
                      handleSelectChange(header, value)
                    }
                    size="lg"
                    className={`w-100 ${
                      disabled ? "custom-select-disabled" : ""
                    }`}
                    disabled={disabled} // Fully disables interaction
                    options={{
                      defaultLabel: defaultLabel,
                      list: filteredOptions,
                    }}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default StaticTable;
