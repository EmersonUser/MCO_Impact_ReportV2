import React, { useState, useRef } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import "./SearchInput.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

const SearchInput = ({ onSearch, disabled }) => {
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef(null);

  const handleInputChange = (event) => {
    const newSearchText = event.target.value;
    setSearchText(newSearchText);
  };

  const handleInputKeyPress = (event) => {
    if (event.key === "Enter" && searchText.trim()) {
      onSearch(searchText);
    }
  };

  const handleClearClick = () => {
    setSearchText("");
    inputRef.current.focus(); // Keep focus on the input after clearing
  };
  const handleSearchIconClick = () => {
    if (searchText.trim()) {
      onSearch(searchText);
    }
  };

  return (
    <div className="search-content-container d-flex align-items-center">
      <FontAwesomeIcon
        icon={faMagnifyingGlass}
        onClick={handleSearchIconClick}
        className="search-icon"
      />

      <span className="ms-4 drag-and-drop-text flex-grow-1">
        <InputGroup>
          <Form.Control
            type="text"
            ref={inputRef}
            value={searchText}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyPress}
            placeholder="Search..."
            disabled={disabled}
          />
          {searchText && (
            <Button
              variant="btn-link"
              onClick={handleClearClick}
              className="clear-button"
            >
              ✖
            </Button>
          )}
        </InputGroup>
      </span>
    </div>
  );
};

export default SearchInput;
