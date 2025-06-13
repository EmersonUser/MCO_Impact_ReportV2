import React, { useState, forwardRef, useImperativeHandle } from "react";
import { FileUploader } from "react-drag-drop-files";
import "./FileUploader.css";
import useToast from "../../hooks/useToast";

const FileUpload = forwardRef(
  (
    {
      fileTypes = ["JPEG", "PNG", "GIF", "XLSX", "CSV"],
      multiple = true,
      onUpload,
      onReset,
      disabled = false,
      message = "Drag & Drop your files here or Click to browse",
    },
    ref
  ) => {
    const [files, setFiles] = useState([]);
    const { showErrorToast } = useToast();

    // Expose handleClearFiles to parent through ref
    useImperativeHandle(ref, () => ({
      handleClearFiles: (skipSuccessToast = false) => {
        setFiles([]);
        if (onUpload) {
          onUpload([]);
        }
        if (onReset) {
          onReset(skipSuccessToast); // Pass skipSuccessToast parameter
        }
      },
    }));

    const handleChange = (selectedFiles) => {
      const fileArray = multiple ? [...selectedFiles] : [selectedFiles];
      setFiles(fileArray);

      // Callback function to send files to parent component
      if (onUpload) {
        onUpload(fileArray);
      }
    };

    const handleClearFile = () => {
      ref.current.handleClearFiles(false); // Pass false to show success toast
    };
    // const handleDragOver = (event) => {
    //   if (disabled) {
    //     event.preventDefault();
    //     event.stopPropagation();
    //     showErrorToast("Please choose an operation from the drop-down first");
    //   } else {
    //     // Allow drag-over behavior for valid file uploads
    //     event.preventDefault();
    //     event.dataTransfer.dropEffect = "copy";
    //   }
    // };

    return (
      <div
        className={`file-upload-container ${disabled ? "disabled" : ""}`}
        // onDragOver={handleDragOver}
      >
        <h2>
          {disabled ? "Please select an operation first" : "Drag & Drop Files"}
        </h2>
        <div className="upload-area">
          <FileUploader
            multiple={multiple}
            handleChange={handleChange}
            name="file"
            types={fileTypes}
            disabled={disabled}
            hoverTitle={disabled ? "" : "Drop here"}
          />
          <div className="file-list">
            {files.length > 0 ? (
              files.map((file, index) => (
                <div
                  className="mb-4"
                  key={index}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <p className="me-2 mb-0">📁 {file.name}</p>
                  <button
                    onClick={handleClearFile}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: disabled ? "not-allowed" : "pointer",
                      color: "red",
                      opacity: disabled ? 0.5 : 1,
                    }}
                    disabled={disabled}
                  >
                    X
                  </button>
                </div>
              ))
            ) : (
              <p>{message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default FileUpload;
