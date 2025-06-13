import * as XLSX from "xlsx";
import config from "./config.json";

const processDataInChunks = (data, chunkSize = 1000) => {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
};

const validateFile = (file, collabSpaceTitles, selectedOperation) => {
  return new Promise((resolve, reject) => {
    console.log("🔍 Starting template validation...");
    console.log({
      operation: selectedOperation,
      fileName: file.name,
    });

    const operationNames = {
      1: "Physical Product",
      2: "Physical Product Structure",
      3: "Document",
      4: "Physical Product-Document",
    };

    const matchedOperation = operationNames[selectedOperation];
    const expectedHeaders =
      config.MassUpload[matchedOperation]?.fileHeaders || [];
    const mandatoryAttributes =
      config.MassUpload[matchedOperation]?.mandatoryAttributes || [];

    if (!selectedOperation) {
      reject({
        errors: ["Please select an operation first."],
        headers: [],
      });
      return;
    }

    if (!Array.isArray(collabSpaceTitles)) {
      console.error("❌ Invalid Collaborative Space list");
      reject({
        errors: ["Internal error: Invalid Collaborative Space list."],
        headers: [],
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = async (e) => {
      const workbook = XLSX.read(e.target.result, {
        type: "binary",
        dense: true,
        cellDates: true,
        cellNF: false,
        cellText: false,
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const uploadedHeaders =
        XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];

      // Template header validation
      const headerMismatch = !expectedHeaders.every((header) =>
        uploadedHeaders.includes(header)
      );

      if (headerMismatch) {
        console.error("❌ Template mismatch detected!");
        reject({
          isTemplateMismatch: true,
          errors: [
            "The template uploaded does not match the selected operation.",
          ],
          headers: uploadedHeaders,
        });
        return;
      }

      const headers =
        XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] || [];

      if (!headers || headers.length === 0) {
        reject({
          errors: ["The uploaded file has no content or is empty."],
          headers: [],
        });
        return;
      }

      const allSheetData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (allSheetData.length === 0) {
        reject({
          errors: ["The uploaded file contains headers but no data rows."],
          headers,
        });
        return;
      }

      const chunks = processDataInChunks(allSheetData, 1000);
      const validationErrors = [];
      const invalidPrefixes = ["MMI-", "RS-", "DAN-", "RSC-", "TF-", "ROXA-"];

      // Error counters
      let errorStats = {
        mandatory: 0,
        collabSpace: 0,
        einPrefix: 0,
        docPrefix: 0,
      };

      // Convert collabSpaceTitles to lowercase for case-insensitive comparison
      const lowerCaseCollabSpaceTitles = collabSpaceTitles.map(title => title.toLowerCase());

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const progress = Math.round(((chunkIndex + 1) / chunks.length) * 100);

        chunk.forEach((row, indexInChunk) => {
          const globalRowIndex = chunkIndex * 1000 + indexInChunk;

          // Mandatory fields validation
          mandatoryAttributes.forEach((field) => {
            if (!row[field] || row[field].toString().trim() === "") {
              errorStats.mandatory++;
              validationErrors.push(
                `Row ${globalRowIndex + 2}: "${field}" is required but is empty`
              );
            }
          });

          // Collaborative Space validation
          if (
            matchedOperation === "Physical Product" ||
            matchedOperation === "Document"
          ) {
            const userCollabSpace = row["Collaborative Space"]?.trim().toLowerCase() || "";
            if (!userCollabSpace || !lowerCaseCollabSpaceTitles.includes(userCollabSpace)) {
              errorStats.collabSpace++;
              validationErrors.push(
                `Row ${globalRowIndex + 2}: "${
                  userCollabSpace
                    ? `You are not allowed to create in "Collaborative Space -" (${userCollabSpace})`
                    : 'Collaborative Space" is Missing or Empty'
                }`
              );
            }
          }
          // NEW: Validate that the first data row for Physical Product Structure has Level = 0
          if (
            matchedOperation === "Physical Product Structure" &&
            globalRowIndex === 0
          ) {
            const firstRow = allSheetData[0];
            const levelValue = firstRow["Level"];
            const levelStr = String(levelValue).trim();
            console.log(
              "Validating Level for Physical Product Structure, first row:",
              firstRow,
              "Parsed Level:",
              levelStr
            );

            if (
              levelStr === "" ||
              (levelStr !== "0" && Number(levelStr) !== 0)
            ) {
              // Add validation error for Level with row number and column name
              validationErrors.push(
                `Row ${
                  globalRowIndex + 2
                }: "Level" value "${levelValue}"  The first entry in the file should be a level 0 object.`
              );
              console.log(
                "Level validation failed - first row Level is not 0:",
                levelValue
              );
            }

            
          }

          // EIN Number / Document Name validation
          let valueToValidate = null;
          let columnName = "";

          if (
            matchedOperation === "Physical Product" ||
            matchedOperation === "Physical Product Structure"
          ) {
            columnName = "EIN Number";
            valueToValidate = row[columnName]?.toString().trim() || null;
            if (
              valueToValidate &&
              invalidPrefixes.some((prefix) =>
                valueToValidate.startsWith(prefix)
              )
            ) {
              errorStats.einPrefix++;
              validationErrors.push(
                `Row ${
                  globalRowIndex + 2
                }: "EIN Number" value "${valueToValidate}" has an invalid prefix.`
              );
            }
          } else if (
            matchedOperation === "Physical Product-Document" ||
            matchedOperation === "Document"
          ) {
            columnName = "Document Name";
            valueToValidate = row[columnName]?.toString().trim() || null;
            if (
              valueToValidate &&
              invalidPrefixes.some((prefix) =>
                valueToValidate.startsWith(prefix)
              )
            ) {
              errorStats.docPrefix++;
              validationErrors.push(
                `Row ${
                  globalRowIndex + 2
                }: "Document Name" value "${valueToValidate}" has an invalid prefix.`
              );
            }
          }

             // NEW: Validate that for Physical Product Structure, the "Quantity" value is positive (cannot be zero or negative)
             if (matchedOperation === "Physical Product Structure") {
              columnName = "Quantity";
              const quantityValue = row[columnName]?.toString().trim();
              if (quantityValue) {
                const numQuantity = Number(quantityValue);
                if (isNaN(numQuantity) || numQuantity <= 0) {
                  validationErrors.push(
                    `Row ${globalRowIndex + 2}: "Quantity" value "${quantityValue}" Quantity should not be 0 or -ve.`
                  );
                  console.log(
                    "Quantity validation failed - Quantity is 0 or -ve:",
                    quantityValue
                  );
                }
              }
            }
        });

        // Log only at 25% intervals
        if (progress % 25 === 0) {
          console.log(`Processing: ${progress}% complete`, {
            processedRows: (chunkIndex + 1) * 1000,
            totalRows: allSheetData.length,
            currentErrors: {
              mandatory: errorStats.mandatory,
              collaborativeSpace: errorStats.collabSpace,
              einPrefix: errorStats.einPrefix,
              documentPrefix: errorStats.docPrefix,
              total: validationErrors.length,
            },
          });
        }
      }

      if (validationErrors.length > 0) {
        console.log("❌ Validation completed with errors:", {
          total: validationErrors.length,
          byType: errorStats,
        });
        reject({
          errors: validationErrors,
          headers,
          mandatoryAttributes,
        });
        return;
      }

      console.log("✅ Validation completed successfully");
      resolve({
        headers,
        sheetData: allSheetData,
        validationErrors: [],
        mandatoryAttributes,
      });
    };

    reader.onerror = () => {
      console.error(" Error reading file");
      reject({
        errors: ["File reading failed."],
        headers: [],
        isTemplateMismatch: false,
      });
    };
  });
};

export default validateFile;
