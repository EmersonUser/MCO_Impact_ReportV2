import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import CardComponent from "../../components/Card/Card";
import { Button, Form, Image } from "react-bootstrap";
import "./plantAssignment.css";
import Loader from "../../components/Loader/Loader";
import ReusableTable from "../../components/Table/Table";
import CardWithDragAndDrop from "../../components/Card/cardwithdraganddrop";
import store from "../../store";
import { refreshWidgetData } from "../../services/api/refreshService";

import { FaRegCopy } from "react-icons/fa";
import {
  setCAItemDetails,
  setCAItemObjectDetails,
  setDroppedObjectData,
  setIsDropped,
  setPlantObjectData,
} from "../../store/droppedObjectSlice";
import {
  formattedFinalMessage,
  getCardData,
  getTableData,
  getUniqueTableData,
  processErrorObj,
  tableColumns,
  uniqueColumns,
} from "./dataHelpers";
import useToast, { useToastWithProgress } from "../../hooks/useToast";
// import { MSG_WIDGET_RESET_SUCCESS } from "../../utils/toastMessages";
import usePlantDropableArea from "../../hooks/usePlantDropableArea";
import {
  handleAddData,
  handleRemoveData,
  saveData,
} from "../../services/api/PlantAssignment/saveTableDataService";
import PlantAssignmentToolbarNativeCta from "./plantAssignmentToolbarNativeCta";
import { MSG_SAVE_FAILURE, MSG_SAVE_SUCCESS } from "../../utils/toastMessages";
import DragAndDropComponent from "./DragAndDrop";
import * as XLSX from "xlsx";
import ContentErrorsModal from "../../components/Modals/ContentErrorsModal";
import { getAllPlants } from "../../services/api/PlantAssignment/allPlantSevice";
import axios from "axios";
import { fetchCsrfToken } from "../../services/api/PlantAssignment/fetchCsrfService";
import {
  handleFileChange,
  processManufacturingCA,
} from "../../services/api/PlantAssignment/createMFGCA";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons"; // This is the reset-style icon
import { fetchData } from "../../utils/helpers";

const PlantAssignment = () => {
  const { showSuccessToastWithProgress, showErrorToastWithProgress } =
    useToastWithProgress();
  const [isAddingPlant, setIsAddingPlant] = useState(false); // State for loader
  const [validatedData, setValidatedData] = useState(null);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]); // State to store validation errors
  const { initializeDroppableArea, loading } = usePlantDropableArea();
  const [tableKey, setTableKey] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [assignedPlant, setAssignedPlant] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [uniqueData, setUniqueData] = useState([]);
  const [CAItemDetailsTable, setCAItemDetailsTable] = useState([]);
  const [isFileInputDisabled, setIsFileInputDisabled] = useState(false); // New state to disable file input
  const [isCreateButtonDisabled, setIsCreateButtonDisabled] = useState(true); // New state to control button enablement
  const { handleDrop } = usePlantDropableArea(); // 🔁 same as WidgetLifecycle

  // const [addedItem, setAddedItem] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [screenLoader, setScreenLoader] = useState(false);
  const [isCardDataAvailable, setIsCardDataAvailable] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const dispatch = useDispatch();
  const { showSuccessToast, showErrorToast } = useToast();
  let securityContext1 = window.widget.getValue("Credentials");
  console.log("Security context is: ", securityContext1);

  const fileInputRef = useRef(null); // Create a ref for the file input

  const handleFileInputChange =  (event) => {
     handleFileChange(
      event,
      setValidationErrors,
      setShowErrorsModal,
      showErrorToast, // Pass toast functions
      showSuccessToast,
      setValidatedData,
      setSelectedFiles,
      setIsCreateButtonDisabled
    ).finally(() => {
      setScreenLoader(false); // Hide loader after validation is complete
    });

 

    setIsFileInputDisabled(true);
    // setIsCreateButtonDisabled(false); // Enable the "Create Manufacturing CA" button
  };

  const handleSave = async () => {
    console.log("OnSave is Called with the TableData", tableData);
    // Pass the current tableData to the onSave function
    extractPlantData(tableData);
    setScreenLoader(true);

    if (type === "Change Action") {
      if (isMFGCA === true) {
        console.log("Manufacturing CA Save Called");
        const response = await getSaveDataForManufacturingCA(
          tableData,
          droppedObjectData,
          CAItemDetails
        );

        console.log("response from Save Api is :", response);
        if (response) {
          const updatedCADetails = tableData.map((tableItem) => {
            const originalItem = CAItemDetails.find(
              (item) => item.ItemId === tableItem.ItemId
            );

            return {
              ItemId: tableItem.ItemId,
              ItemType: originalItem?.ItemType,
              ItemState: originalItem?.ItemState,
              ItemTitle: tableItem.ItemName,
              ItemPlants: tableItem.Plant.map(({ PlantName, PlantID }) => ({
                PlantName,
                PlantID,
              })),
            };
          });

          dispatch(setCAItemDetails(updatedCADetails));

          setScreenLoader(false);
        } else {
          console.warn("Save API returned false");
          setScreenLoader(false);
        }
      } else {
        console.log("Engineering CA Save Called");

        const response = await getSaveDataForCA(
          tableData,
          droppedObjectData,
          CAItemDetails
        );

        console.log("response from Save Api is :", response);
        if (response) {
          const updatedCADetails = tableData.map((tableItem) => {
            const originalItem = CAItemDetails.find(
              (item) => item.ItemId === tableItem.ItemId
            );

            return {
              ItemId: tableItem.ItemId,
              ItemType: originalItem?.ItemType,
              ItemState: originalItem?.ItemState,
              ItemTitle: tableItem.ItemName,
              ItemPlants: tableItem.Plant.map(({ PlantName, PlantID }) => ({
                PlantName,
                PlantID,
              })),
            };
          });

          dispatch(setCAItemDetails(updatedCADetails));

          // ✅ Silent refresh after save to update Redux/UI
          const droppedItems =
            store.getState().droppedObject.droppedObjectData.initialDraggedData
              ?.data?.items;
          if (droppedItems?.length) {
            await refreshWidgetData(droppedItems, handleDrop);
          }

          setScreenLoader(false);
        } else {
          console.warn("Save API returned false");
          setScreenLoader(false);
        }
      }
    } else {
      await onSave(tableData); // Pass tableData when calling onSave
    }
  };
  const handleRemove = async () => {
    if (type === "Change Action") {
      console.log("Remove is clicked for Chnage Action");
      setIsRemoveMode((prev) => !prev); // ✅ Toggles the mode
    } else {
      console.log("Selected Table Rows:", selectedTableRows);
      console.log("handleRemove is Called with the TableData", tableData);

      if (selectedTableRows.length > 0) {
        // Extract IDs or titles of selected rows
        const selectedTitles = selectedTableRows.map((row) => row.Plant);
        console.log("Selected Titles:", selectedTitles);
        const removedTitles = selectedTitles.map((title) => ({
          title: title,
        }));
        console.log("Removed Titles:", removedTitles);
        const updatedTableData = tableData.filter(
          (row) => !selectedTitles.includes(row.Plant)
        );
        console.log("updateTableData", updateTableData);
        if (updateTableData) {
          setTableData(updatedTableData);
          setTableKey((prevKey) => prevKey + 1); // Update table key
        }

        // // Update state

        setUniqueData((prevUniquePlants) => [
          ...prevUniquePlants,
          ...removedTitles,
        ]); // Add removed items back to uniqueData
        //added by ayush
        showSuccessToastWithProgress(
          "Plants removed successfully from the table."
        );
        await handleRemoveData(
          allPlants,
          removedTitles,
          droppedObjectData.initialDraggedData?.data?.items[0].objectId,
          type
        );
      } else {
        showErrorToastWithProgress("Please select at least one row to remove.");
      }
    }
  };

  // NEED TO WORK HERE FOR THE UNIQUE PLANTS FOR CA

  const handleRemovePlant = useCallback(
    (itemId, plantId) => {
      setCAItemDetailsTable((tableData) =>
        tableData.map((item) =>
          item.ItemId === itemId
            ? {
                ...item,
                ItemPlants: item.ItemPlants.map((plant) =>
                  plant.PlantID === plantId
                    ? {
                        ...plant,
                        color: plant.color === "red" ? "green" : "red", // ✅ toggle
                      }
                    : plant
                ),
              }
            : item
        )
      );
    },
    [setCAItemDetailsTable]
  );

  const handleAdded = async (data) => {
    setIsAddingPlant(true);
    console.log("Data Received", data);
    console.log("[Plant Assignment] Table data", tableData);
    console.log("Added Data from Toolbar", data);
    console.log("CA Table data is", CAItemDetails);

    setTableKey((prevKey) => prevKey + 1); // Update table key

    if (type === "Change Action") {
      console.log("Change Action Plant is Added");

      setCAItemDetailsTable((prev) => {
        return prev.map((row) => {
          const shouldUpdate =
            selectedTableRows.length === 0 ||
            selectedTableRows.some((r) => r.ItemId === row.ItemId);

          if (!shouldUpdate) return row;

          const reduxRow = CAItemDetails.find((r) => r.ItemId === row.ItemId);
          const reduxPlants = reduxRow?.ItemPlants || [];
          const existingPlants = row.ItemPlants || [];

          const updatedExistingPlants = existingPlants.map((ep) => {
            const shouldUpdateColor =
              isMFGCA &&
              data.includes(ep.PlantName.trim()) &&
              reduxPlants.some(
                (rp) => rp.PlantName.trim() === ep.PlantName.trim()
              );

            return shouldUpdateColor ? { ...ep, color: "red" } : ep;
          });

          const newPlantsToAdd = [];

          data.forEach((plantName) => {
            const matchedPlant = CAAllPlants.find((plant) => {
              const formattedTitle = plant.title
                .replace(/^Plant\s+/, "")
                .trim();
              return formattedTitle === plantName.trim();
            });

            if (!matchedPlant) return;

            const existsInRedux = reduxPlants.some(
              (rp) => rp.PlantName.trim() === plantName.trim()
            );

            const existsInTable = existingPlants.some(
              (ep) => ep.PlantName.trim() === plantName.trim()
            );

            if (!existsInTable) {
              newPlantsToAdd.push({
                PlantName: plantName,
                PlantID: matchedPlant.id,
                PlantERPStatus: "Pending", // ✅ This now controls remove visibility
                // ...(isMFGCA && { color: existsInRedux ? "red" : "green" }),
                ...(existsInRedux ? { color: "red" } : { color: "green" }),
              });
            }
          });

          return {
            ...row,
            ItemPlants: [...updatedExistingPlants, ...newPlantsToAdd],
          };
        });
      });
    } else {
      setScreenLoader(true);
      console.log("Handling plants for table addition...");

      // Fetch ErrorObject and Finalmessage from handleAddData

      try {
        const { ErrorObject, Finalmessage } = await handleAddData(
          data,
          allPlants,
          droppedObjectData.initialDraggedData?.data?.items[0].objectId,
          type,
          proposedChanges,
          productChildren,
          hasMBOM
        );
        console.log("ErrorObject from handleAddData:", ErrorObject); // Log the ErrorObject
        console.log("Finalmessage from handleAddData:", Finalmessage); // Log the Finalmessage

        // Check if any of the selected plants are in the ErrorObject
        const erroredPlants = ErrorObject.map(
          (item) => allPlants.find((plant) => plant.id === item.ClassID)?.title
        );
        console.log("Errored Plants:", erroredPlants); // Log the errored plants

        // Separate valid and invalid plants based on the ErrorObject
        const validPlants = data.filter(
          (plant) => !erroredPlants.includes(plant.title)
        );
        const invalidPlants = data.filter((plant) =>
          erroredPlants.includes(plant.title)
        );
        console.log("Valid Plants:", validPlants); // Log the valid plants
        console.log("Invalid Plants:", invalidPlants); // Log the invalid plants

        // Show an alert only for the invalid plants that were selected
        if (invalidPlants.length > 0) {
          //show final message in toast
          if (Finalmessage) {
            showErrorToastWithProgress(Finalmessage, {
              // autoClose: false, // Prevent auto-closing
              // closeOnClick: false, // Prevent closing on click
            });
          }

          console.log("Finalmessage displayed in toast:", Finalmessage);
        }

        // Update the unique plants list to include invalid plants (keep them in the popup)
        setUniqueData((prevUniqueData) => [
          ...prevUniqueData,
          ...invalidPlants.map((plant) => ({ title: plant.title })),
        ]);

        // Add valid plants to the table
        if (validPlants.length > 0) {
          setTableData((prev) => [
            ...validPlants.map(({ title, ...rest }) => ({
              Plant: title,
              ...rest,
            })),
            ...prev,
          ]);
          setTableKey((prevKey) => prevKey + 1); // Update table key
          showSuccessToastWithProgress("Plants added successfully.");
        }
      } catch (error) {
        console.error("Error while adding plants:", error);
        showErrorToastWithProgress("Failed to add plants. Please try again.");
      } finally {
        // setIsAddingPlant(false); // Hide loader when adding is complete
        setScreenLoader(false); //Hide loader when adding is complete
      }
    }
  };

  const handleUnique = (data) => {
    console.log("The data received from Child is:", data);
    const updatedTableData = uniqueTableData.filter(
      (row) =>
        !data.find((selectedRow) => selectedRow === row["Available Plant"])
    );
    console.log("Updated Table Data after unique:", updatedTableData);
    if (updatedTableData) {
      const transformedData = updatedTableData.map((item) => ({
        title: item["Available Plant"],
      }));

      console.log(transformedData);
      setUniqueData(transformedData);
    }
  };

  // Add this function near the top of the file
  const extractPlantData = (tableData) => {
    const plantData = tableData.map((row) => ({
      itemName: row.ItemName, // Replace with the actual key for Item Name
      plantName: row.Plant, // Replace with the actual key for Plant Name
    }));
    console.log("Extracted Plant Data:", plantData);
    return plantData;
  };

  console.log("Table Data after Adding:", tableData);
  const selectedTableRows = useSelector(
    (state) => state.droppedObject.selectedTableRows
  );
  // Access Redux store
  const droppedObjectData = useSelector(
    (state) => state.droppedObject.droppedObjectData
  );
  console.log("droppedObjectData", droppedObjectData);

  // Getting the CA dETAILS FROM rEDUX

  const CAItemDetails = useSelector(
    (state) => state.droppedObject.CAItemObjectDetails.CAItemDetails
  );
  console.log("The CA Item Details are:", CAItemDetails);

  const CAAllPlants = useSelector(
    (state) => state.droppedObject.CAItemObjectDetails.CAallPlants
  );
  console.log("For CA all Plants are: ", CAAllPlants);
  const CAHeaders = useSelector(
    (state) => state.droppedObject.CAItemObjectDetails.CAheaders
  );
  console.log("caheaders plant assign", CAHeaders);

  const isMFGCA = useSelector(
    (state) => state.droppedObject.CAItemObjectDetails.CAisMFGCA
  );
  console.log("isMFGCA value is:", isMFGCA);
  const loadingParentDetails = useSelector(
    (state) => state.droppedObject.loadingParentDetails
  );
  console.log("Parents Loading State:", loadingParentDetails);
  const proposedChanges = useSelector(
    (state) => state.droppedObject.plantObjectData.proposedChanges
  );
  console.log("Proposed Changes are:", proposedChanges);

  const isDropped = useSelector((state) => state.droppedObject.isDropped);

  const allPlants = useSelector(
    (state) => state.droppedObject.plantObjectData.allPlants
  );
  console.log("[PlantAssignment] plant object data: ", allPlants);

  // const handleFileInputChange = (event) => {
  //   handleFileChange(event, allPlants, CAHeaders, setValidationErrors, setShowErrorsModal);
  // };

  const uniquePlant = useSelector(
    (state) => state.droppedObject.plantObjectData.uniquePlants
  );
  console.log("[Plant Assignment] Unique Plants:", uniquePlant);

  const asignedPlant = useSelector(
    (state) => state.droppedObject.plantObjectData.initialAssignedPlants
  );
  console.log("The Assigned Plants are:", asignedPlant);

  const CAData = useSelector(
    (state) => state.droppedObject.plantObjectData.CAData
  );
  console.log("The CAData is....:", CAData);

  const productChildren = useSelector(
    (state) => state.droppedObject.plantObjectData.productChildren
  );
  console.log("[Plant Assignment] Product Children:", productChildren);
  const CAName = useSelector(
    (state) => state.droppedObject.plantObjectData.CAName
  );
  console.log("[plant Assignment] CAName:", CAName);

  const headers = useSelector(
    (state) => state.droppedObject.plantObjectData.headers
  );
  console.log("[Plant Assignment] Headers are: ", headers);

  const getUniquePlant = useCallback(() => {
    let allPlants = CAAllPlants.map((item) =>
      item.title.replace(/^Plant /, "")
    );

    const sourceData =
      selectedTableRows.length === 0 ? tableData : selectedTableRows;

    let assignedTablePlants = [
      ...new Set(
        sourceData.flatMap((item) => item.Plant?.map((p) => p.PlantName) || [])
      ),
    ];

    let uniqueTablePlants = allPlants
      .filter((plant) => !assignedTablePlants.includes(plant))
      .map((plant) => ({ title: plant }));

    console.log("Unique table plants are :", uniqueTablePlants);

    // Return allPlants if isMFGCA is true, else return uniqueTablePlants
    return allPlants.map((plant) => ({ title: plant }));
  }, [CAAllPlants, tableData, selectedTableRows, isMFGCA]); // Added isMFGCA as a dependency

  // Updated: Function to update table data when dropdown changes
  const updateTableData = (updatedData) => {
    setTableData(updatedData);
  };

  console.log("Tanble Data is:", tableData);
  // Trigger re-render of ReusableTable by changing the key
  useEffect(() => {
    if (tableData.length >= 0) {
      setTableKey((prevKey) => prevKey + 1); // Increment the key to trigger a re-render
    }
  }, [tableData]); // Runs whenever tableData changes
  if (droppedObjectData.cardData && droppedObjectData.initialDraggedData) {
    var state = droppedObjectData.cardData["Maturity State"];
    var hasMBOM = droppedObjectData.cardData["HasMBOM"];
    var type = droppedObjectData.initialDraggedData?.data?.items[0].objectType;
  }

  const [dupInitialAssignedClasses, setDupInitialAssignedClasses] =
    useState(asignedPlant);
  console.log(
    "Duplicate Initial Assigned Classes are:",
    dupInitialAssignedClasses
  );
  useEffect(() => {
    setDupInitialAssignedClasses(asignedPlant);
    if (type === "Change Action") {
      setCAItemDetailsTable(CAItemDetails);
    } else {
      setAssignedPlant(asignedPlant);
    }
  }, [asignedPlant, type, CAItemDetails]);
  // Runs only when type === "Change Action"
  useEffect(() => {
    if (type === "Change Action") {
      setUniqueData(getUniquePlant());
    }
  }, [getUniquePlant, type]);

  // useEffect(() => {
  //   if (!type || !CAItemDetailsTable || CAItemDetailsTable.length === 0) return;

  //   // ✅ Always derive MFGCA from item MBOM, even if type is not "Change Action"
  //   const isAnyMFG = CAItemDetailsTable.some(
  //     (item) => item.ItemMBOM && item.ItemMBOM !== "N/A"
  //   );

  //   if (isAnyMFG !== isMFGCA) {
  //     dispatch(setCAItemObjectDetails({
  //       ...store.getState().droppedObject.CAItemObjectDetails,
  //       CAisMFGCA: isAnyMFG
  //     }));
  //   }
  // }, [CAItemDetailsTable, isMFGCA, dispatch]);

  // Runs only when type !== "Change Action"
  useEffect(() => {
    if (type !== "Change Action") {
      setUniqueData(uniquePlant);
    }
  }, [uniquePlant, type]);
  const onSave = async (tableData) => {
    let updatedItems = {};
    // let DupInitialAssignedClasses = [...asignedPlant]; // Clone the initial array to avoid direct mutation
    const classesToBeClassified = [];

    console.log("Table Data", tableData);
    console.log("Before DupInitialAssignedClasses:", dupInitialAssignedClasses);
    let finalArray = [];
    // Create a new array with updated classes instead of mutating
    let updatedAssignedClasses = dupInitialAssignedClasses.map((intclass) => {
      let updatedClass = { ...intclass }; // Shallow clone to avoid modifying the original object

      tableData.forEach((tableItem) => {
        let finalObj = {};
        const plantName = tableItem.Plant.replace("Plant", "").replace(
          /\s+/g,
          ""
        );

        const classid = allPlants.find(
          (classitem) => classitem.title === tableItem.Plant
        )?.id;

        if (updatedClass.title === tableItem.Plant) {
          const MBOMValue = updatedClass.MBOM ? "Make" : "Buy";

          // Update only if MBOMValue has changed
          if (MBOMValue !== tableItem.MBom) {
            if (/^\d/.test(plantName)) {
              updatedItems[`MBOM${plantName}`] = tableItem.MBom === "Make";
              finalObj.MBOMName = `MBOM${plantName}`;
              finalObj.MBOMValue = tableItem.MBom === "Make";
            } else {
              updatedItems[`${plantName}MBOM`] = tableItem.MBom === "Make";
              finalObj.MBOMName = `${plantName}MBOM`;
              finalObj.MBOMValue = tableItem.MBom === "Make";
            }
            updatedClass.MBOM = tableItem.MBom === "Make"; // Modify the cloned object
            finalObj = {
              ...finalObj,
              id: classid,
              title: tableItem.Plant,
              Type: "Update",
            };
            finalArray.push(finalObj);
          }
        }
      });
      return updatedClass; // Return updated or unchanged class object
    });

    // Find additional rows to classify
    tableData.forEach((tableItem) => {
      const matchedClass = dupInitialAssignedClasses.find(
        (initialClass) => initialClass.title === tableItem.Plant
      );

      if (!matchedClass) {
        const plantName = tableItem.Plant.replace("Plant", "").replace(
          /\s+/g,
          ""
        );
        const classid = allPlants.find(
          (classitem) => classitem.title === tableItem.Plant
        )?.id;

        if (classid) {
          let classObject = { id: classid, title: tableItem.Plant };
          let finalObj = {};
          classesToBeClassified.push(classid);

          if (tableItem.MBom === "Make") {
            if (/^\d/.test(plantName)) {
              updatedItems[`MBOM${plantName}`] = true;
              finalObj.MBOMName = `MBOM${plantName}`;
            } else {
              updatedItems[`${plantName}MBOM`] = true;
              finalObj.MBOMName = `${plantName}MBOM`;
            }
            classObject.MBOM = true;
            finalObj.MBOMValue = true;
          } else {
            classObject.MBOM = false;
            finalObj.MBOMValue = false;
          }

          updatedAssignedClasses.push(classObject);
          finalObj = {
            ...finalObj,
            id: classid,
            title: tableItem.Plant,
            Type: "New",
          };
          finalArray.push(finalObj);
        }
      }
    });
    //---------------
    let rowstoDelete = [];
    dupInitialAssignedClasses.forEach((initialClass) => {
      const isNotInTableData = !tableData.some(
        (tableItem) => tableItem.Plant === initialClass.title
      );
      if (isNotInTableData) {
        const classid = allPlants.find(
          (classItem) => classItem.title === initialClass.title
        )?.id;
        if (classid) {
          rowstoDelete.push(classid);
        }
      }
    });

    updatedAssignedClasses = updatedAssignedClasses.filter(
      (classItem) => !rowstoDelete.includes(classItem.id)
    );

    console.log("Rows getting deleted rowstoDelete:", rowstoDelete);
    //Need to pass this is savetable function
    //---------------

    console.log("After DupInitialAssignedClasses:", updatedAssignedClasses);
    console.log("Classes to be Classified:", classesToBeClassified);
    console.log("Updated Items:", updatedItems);
    console.log();

    // Call services with updated data
    const result = await saveData(
      updatedItems,
      classesToBeClassified,
      updatedAssignedClasses,
      headers,
      droppedObjectData.initialDraggedData?.data?.items[0].objectId,
      allPlants,
      productChildren,
      type,
      rowstoDelete,
      finalArray,
      proposedChanges
    );

    if (result.success) {
      setScreenLoader(false);
      console.log("Save result:", result);
      if (result.Finalmessage === "" || result.Finalmessage == null) {
        showSuccessToast(MSG_SAVE_SUCCESS);
      } else {
        // Usage
        showErrorToast(formattedFinalMessage(result.Finalmessage), {
          autoClose: false,
        });
      }
      let finalobj = [];
      if (result.ErrorObj && Object.keys(result.ErrorObj).length > 0) {
        let response = processErrorObj(
          result.ErrorObj,
          assignedPlant,
          updatedAssignedClasses,
          uniquePlant
        );
        console.log("response is ", response);
        if (response) {
          setUniqueData(response.uniquePlant);
          //setAssignedPlant(response.assignedPlant);
          finalobj = response.updatedAssignedClasses;
        }
      } else {
        finalobj = updatedAssignedClasses;
      }

      if (finalobj) {
        // change format of final object as the asignedPlant
        setAssignedPlant(finalobj);
        setDupInitialAssignedClasses(finalobj);
      }
    } else {
      setScreenLoader(false);
      showErrorToast(MSG_SAVE_FAILURE);
    }

    // showSuccessToast(MSG_SAVE_SUCCESS);
    // alert("Save action triggered. Check console for details.");
  };

  // Effect to initialize the droppable area
  useEffect(() => {
    if (!isDropped) {
      initializeDroppableArea();
    }
  }, [isDropped, initializeDroppableArea]);

  // Effect to set isTableLoading based on loadingParentDetails
  useEffect(() => {
    setIsTableLoading(loadingParentDetails);
  }, [loadingParentDetails]);

  // Update table data when droppedObjectData changes
  const newTableData = useMemo(() => {
    return type === "Change Action"
      ? getTableData(CAItemDetailsTable, type, CAData)
      : getTableData(assignedPlant, type, CAData);
  }, [CAItemDetailsTable, assignedPlant, type, CAData]);

  const uniqueTableData = useMemo(
    () => getUniqueTableData(uniqueData),
    [uniqueData]
  );
  console.log("[Plant Assignment] Unique Table Data:", uniqueTableData);

  // Process card data
  const cardData = useMemo(
    () => getCardData(droppedObjectData),
    [droppedObjectData]
  );
  console.log(cardData);

  // useEffect(() => {
  //   if (!type || !CAItemDetailsTable.length) return;

  //   if (type === "Change Action") {
  //     const isAnyMFGCA = CAItemDetailsTable.some(
  //       (item) => item.ItemMBOM && item.ItemMBOM !== "N/A"
  //     );

  //     dispatch(setCAItemObjectDetails({
  //       ...store.getState().droppedObject.CAItemObjectDetails,
  //       CAisMFGCA: isAnyMFGCA,
  //     }));

  //     if (isAnyMFGCA) {
  //       setIsRemoveMode(false); // 🚀 Immediately set RemoveMode false after confirming MFGCA
  //     }
  //   }
  // }, [CAItemDetailsTable, type, dispatch]);

  // Update table data and reset isTableLoading when newTableData changes
  useEffect(() => {
    if (newTableData.length >= 0) {
      console.log("New Table Data:", newTableData);
      setTableData(newTableData);
      setTableKey((prevKey) => prevKey + 1); // Update table key
    }
  }, [newTableData]);

  useEffect(() => {
    setIsCardDataAvailable(!!cardData);
  }, [cardData]);

  // Define columns for the table
  const columns = useMemo(
    () => tableColumns(CAName, type, isRemoveMode, handleRemovePlant),
    [CAName, type, isRemoveMode, handleRemovePlant]
  );

  const uniqueColumn = useMemo(() => uniqueColumns, []);

  const handleHomeClick = () => {
    initializeDroppableArea(); // Reset the droppable area
    // dispatch(false);
    dispatch(setIsDropped(false));
    dispatch(
      setDroppedObjectData({
        cardData: {},
        parentDetails: [],
        versions: [],
        initialDraggedData: [],
      })
    ); // Clear Redux state
    dispatch(
      setPlantObjectData({
        allPlants: [],
        initialAssignedPlants: [],
        uniquePlants: [],
        productChildren: [],
        CAName: false,
        headers: {},
        proposedChanges: [],
        CAData: {},
      })
    );
    dispatch(
      setCAItemObjectDetails({
        CAItemDetails: [],
        CAallPlants: [],
        CAisMFGCA: false,
        CAheaders: {},
      })
    );

    setTableData([]); // Clear local table data
    setIsCardDataAvailable(false);
    // showSuccessToast(MSG_WIDGET_RESET_SUCCESS);
  };
  useEffect(() => {
    console.log("[PlantAssignment] State Changes:", {
      loading,
      loadingParentDetails,
      isDropped,
    });
  }, [loading, loadingParentDetails, isDropped]);

  const handleReset = () => {
    // Reset all states related to file upload
    setValidatedData(null);
    setSelectedFiles(null);
    setValidationErrors([]);
    setShowErrorsModal(false);
    setTableData([]);
    setUniqueData([]);
    setCAItemDetailsTable([]);
    setAssignedPlant([]);
    setDupInitialAssignedClasses([]);
    setTableKey(0);

    setIsFileInputDisabled(false);

    // Clear the file input value using the ref
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the file input value
    }

    // Disable the "Create Manufacturing CA" button
    setIsCreateButtonDisabled(true);

    // Optionally show a toast message
    //showSuccessToast("File upload has been reset.");
  };

  const handleSubmit = async () => {
    if (!validatedData) {
      showErrorToast("Please upload and validate a file before proceeding.");
      return;
    }

    setScreenLoader(true); // Show loader when the process starts

    // const CAHeaders = await fetchCsrfToken(); // Fetch headers
    try {
      await processManufacturingCA(
        validatedData,
        showSuccessToastWithProgress,
        showErrorToastWithProgress,
        handleReset
      );
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    } finally {
      setScreenLoader(false); // Hide loader after the process is complete
    }

    // Disable the "Create Manufacturing CA" button after submission
    setIsCreateButtonDisabled(true);
  };

  return (
    <>
      {/* {isAddingPlant && <Loader />} */}

      {screenLoader && <Loader />}
      {/* Show DragAndDropComponent initially and if not loading and nothing is dropped */}
      {!isDropped && !loading && !isTableLoading && (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <DragAndDropComponent
            handleFileInputChange={handleFileInputChange}
            fileInputRef={fileInputRef}
            isFileInputDisabled={isFileInputDisabled}
            handleSubmit={handleSubmit}
            isCreateButtonDisabled={isCreateButtonDisabled}
            handleReset={handleReset}
          />

          {/* File Input & Submit Button Positioned at Bottom Center */}
          {/* <div
            style={{
              padding: "0px 0px 10px 0px",
              position: "absolute",
              bottom: "10px", // Adjust as needed
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <div class="container mt-3">
              <div class="row justify-content-center">
                <div class="col-6 col-md-auto mb-2">
                  <Button
                    variant="link ms-auto"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href =
                        "https://github.com/aayush825/EMR_PLANT_WIDGET/raw/main/plant_assignment_template.xlsx"; // Use the raw file URL for direct download
                      link.download = "plant_assignment_template.xlsx"; // Set the file name for the download
                      link.click();
                    }}
                  >
                    Download Template
                  </Button>
                </div>
                <div class="col-6 col-md-auto mb-2">
                  <Form.Group controlId="formFileMultiple">
                    <Form.Control
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      disabled={isFileInputDisabled}
                      ref={fileInputRef} // Attach the ref to the file input
                    />
                  </Form.Group>
                </div>
                <div class="col-6 col-md-auto mb-2">
                  <Button variant="outline-danger" onClick={handleReset}>
                    <FontAwesomeIcon icon={faRotateLeft} />
                  </Button>
                </div>
                <div class="col-6 col-md-auto mb-2">
                  <div
                    style={{
                      display: "inline-block",
                      cursor: isCreateButtonDisabled
                        ? "not-allowed"
                        : "pointer", // Apply cursor style to the wrapper div
                    }}
                  >
                    <Button
                      // variant="outline-primary"
                      variant={
                        isCreateButtonDisabled ? "secondary" : "outline-primary"
                      }
                      onClick={handleSubmit}
                      disabled={isCreateButtonDisabled} // Disable the button
                    >
                      Create Manufacturing CA
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            
          </div>*/}
        </div>
      )}

      {/* Content Wrapper - show if not initially loading or if card data is available */}
      {isDropped && (
        <>
          {/* Show initial loader when loading is true */}
          {loading && <Loader />}
          <div className="content-wrapper py-3 border-bottom">
            <div className="d-flex ">
              <div className=" p-0 pt-4">
                <Image
                  src="https://thewhitechamaleon.github.io/testrapp/images/home.png"
                  alt="home-icon"
                  className="home-icon"
                  onClick={handleHomeClick}
                />
              </div>
              {/* Always show card data if available */}
              {cardData && (
                <CardWithDragAndDrop
                  data={cardData}
                  widgetType="PlantAssignment"
                />
              )}
            </div>
          </div>

          {/* Table Loader - show only when isTableLoading is true */}
          {isTableLoading ? (
            <div className="loading-indicator mt-5">
              <Loader />
            </div>
          ) : (
            <>
              <div className="wrapper-cta">
                <PlantAssignmentToolbarNativeCta
                  uniquedata={uniqueTableData}
                  uniqueColumn={uniqueColumn}
                  CAName={CAName}
                  onAddPlant={handleAdded}
                  addedPlant={handleUnique}
                  onSave={handleSave}
                  onRemove={handleRemove}
                  state={state}
                  type={type}
                  isMFGCA={isMFGCA}
                  CAData={CAData}
                />
                <ReusableTable
                  key={tableKey}
                  data={tableData}
                  columns={columns}
                  // meta={{ updateTableData }}
                  widgetType="Plant_Assignment_Widget"
                />
              </div>
            </>
          )}
        </>
      )}
      {/* Show validation errors in ErrorDisplayTable
       {validationErrors.length > 0 && (
              <ErrorDisplayTable errors={validationErrors} />
            )} */}
      {/* Show validation errors in ContentErrorsModal */}
      <ContentErrorsModal
        show={showErrorsModal}
        onHide={() => setShowErrorsModal(false)}
        errors={validationErrors}
      />
    </>
  );
};

export default PlantAssignment;

export const getSaveDataForManufacturingCA = async (
  tableData,
  droppedObjectData,
  CAItemDetails
) => {
  const objectData =
    droppedObjectData.initialDraggedData?.data?.items?.[0] || {};
  const cardData = droppedObjectData.cardData || {};

  const payload = {
    CATitle: cardData.Title,
    CAId: objectData.objectId,
    CAOrganization: cardData.organization,
    CACollabSpace: cardData["Collaborative Space"],
    CAOwner: "e1331143",
    Items: tableData.map((item) => {
      const caDetails = CAItemDetails.find((ca) => ca.ItemId === item.ItemId);

      return {
        ItemId: item.ItemId,
        ItemType: caDetails?.ItemType || "VPMReference",
        ItemState: caDetails?.ItemState || "IN_WORK",
        ItemTitle: item.ItemName,
        ItemPlants: item.Plant.filter((plant) => plant.color) // include only if color exists
          .map((plant) => {
            const { color, ...rest } = plant;
            return {
              ...rest,
              PlantType: color === "green" ? "New" : "old",
            };
          }),
      };
    }),
  };
  console.log("Payload for the Save is :", payload);
  const SaveURL =
    "https://saasimplementationserverdev.azurewebsites.net/flowDownCA/processMFGCA";

  try {
    const response = await fetchData("POST", SaveURL, payload);
    return response;
  } catch (error) {
    console.error("Failed to send CA save data:", error);
    throw error;
  }
};

export const getSaveDataForCA = async (
  tableData,
  droppedObjectData,
  CAItemDetails
) => {
  const objectData =
    droppedObjectData.initialDraggedData?.data?.items?.[0] || {};
  const cardData = droppedObjectData.cardData || {};

  const payload = {
    CATitle: cardData.Title,
    CAId: objectData.objectId,
    CAOrganization: cardData.organization,
    CACollabSpace: cardData["Collaborative Space"],
    CAOwner: "e1331143",
    Items: tableData.map((item) => {
      const caDetails = CAItemDetails.find((ca) => ca.ItemId === item.ItemId);

      return {
        ItemId: item.ItemId,
        ItemType: caDetails?.ItemType || "VPMReference",
        ItemState: caDetails?.ItemState || "IN_WORK",
        ItemTitle: item.ItemName,
        ItemMBOM: caDetails?.ItemMBOM || "N/A",
        ItemPlants: item.Plant.map((plant) => {
          const originalItem = CAItemDetails.find(
            (ci) => ci.ItemId === item.ItemId
          );
          const wasInOriginal = originalItem?.ItemPlants?.some(
            (p) => p.PlantID === plant.PlantID
          );

          const isMarkedNew = plant.color === "green";
          const isMarkedRemove = plant.color === "red";

          // ✅ CASE 1: It was in DB, and now marked red → REMOVE
          if (wasInOriginal && isMarkedRemove) {
            return {
              PlantName: plant.PlantName,
              PlantID: plant.PlantID,
              PlantType: "Remove",
            };
          }

          // ✅ CASE 2: It was in DB, and not touched → send without PlantType
          if (wasInOriginal && !isMarkedRemove) {
            return {
              PlantName: plant.PlantName,
              PlantID: plant.PlantID,
              PlantType: "", // or just omit this field if preferred
            };
          }

          // ❌ CASE 3: It was NOT in DB, and is now red → skip it (don’t return anything)
          if (!wasInOriginal && isMarkedRemove) {
            return null;
          }

          // ✅ CASE 4: It was NOT in DB, and is green → NEW
          if (!wasInOriginal && isMarkedNew) {
            return {
              PlantName: plant.PlantName,
              PlantID: plant.PlantID,
              PlantType: "New",
            };
          }

          return null; // fallback
        }).filter(Boolean), // remove null entries (i.e. case 3)
      };
    }),
  };

  console.log("Payload for Engineering CA Save is:", payload);

  const SaveURL =
    "https://saasimplementationserverdev.azurewebsites.net/plantAssignment/processENGCA";

  try {
    const response = await fetchData("POST", SaveURL, payload);
    return response;
  } catch (error) {
    console.error("Failed to send CA save data:", error);
    throw error;
  }
};
