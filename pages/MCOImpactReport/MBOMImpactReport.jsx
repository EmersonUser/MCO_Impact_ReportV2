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
import "./MBOMImpactReport.css";
import Loader from "../../components/Loader/Loader";
import MCOImpactReportPartRevTable from "./MCOImpactReportPartRevTable";
import MCOImpactReportMBOMConnectionTable from "./MCOImpactReportMBOMConnectionTable";
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
  tableColumnsMBOMConnections,
  getMBOMConnTableData,
} from "./dataHelpers";
import useToast, { useToastWithProgress } from "../../hooks/useToast";
// import { MSG_WIDGET_RESET_SUCCESS } from "../../utils/toastMessages";
import useMBOMImpactReportDropableArea from "../../hooks/useMBOMImpactReportDropableArea";
import {
  handleAddData,
  handleRemoveData,
  saveData,
} from "../../services/api/PlantAssignment/saveTableDataService";
import MBOMImpactReportToolbarNativeCta from "./MBOMImpactReportToolbarNativeCta";
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

const MBOMImpactReport = () => {
  const { showSuccessToastWithProgress, showErrorToastWithProgress } =
    useToastWithProgress();
  const [isAddingPlant, setIsAddingPlant] = useState(false); // State for loader
  const [validatedData, setValidatedData] = useState(null);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]); // State to store validation errors
  const { initializeDroppableArea, loading } = useMBOMImpactReportDropableArea();
  const [tableKey, setTableKey] = useState(0);
  const [connTableKey, setMBOMConnTableKey] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [connectionTableData, setMBOMConnTableData] = useState([]);
  const [assignedPlant, setAssignedPlant] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [uniqueData, setUniqueData] = useState([]);
  const [CAItemDetailsTable, setCAItemDetailsTable] = useState([]);
  const [CAItemDetailsTable2, setCAItemDetailsTable2] = useState([]);
  const [isFileInputDisabled, setIsFileInputDisabled] = useState(false); // New state to disable file input
  const [isCreateButtonDisabled, setIsCreateButtonDisabled] = useState(true); // New state to control button enablement
  const { handleDrop } = useMBOMImpactReportDropableArea(); // 🔁 same as WidgetLifecycle

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

  // Access Redux store
  const droppedObjectData = useSelector(
    (state) => state.droppedObject.droppedObjectData
  );
  console.log("droppedObjectData", droppedObjectData);

  // Getting the CA dETAILS FROM rEDUX

  const CAItemDetails = useSelector(
    (state) => state.droppedObject.MCAItemObjectDetails.MCAItemDetails
  );
  console.log("The MCA Item Details are:", CAItemDetails);

  const CAItemDetails2 = useSelector(
    (state) => state.droppedObject.MCAItemObjectDetails2.MCAItemDetails2
  );
  console.log("The MCA Item Details are:", CAItemDetails2);

  const loadingParentDetails = useSelector(
    (state) => state.droppedObject.loadingParentDetails
  );
  console.log("Parents Loading State:", loadingParentDetails);

  const isDropped = useSelector((state) => state.droppedObject.isDropped);

  // const handleFileInputChange = (event) => {
  //   handleFileChange(event, allPlants, CAHeaders, setValidationErrors, setShowErrorsModal);
  // };

  const CAData = useSelector(
    (state) => state.droppedObject.plantObjectData.CAData
  );
  console.log("The CAData is....:", CAData);

  const CAName = useSelector(
    (state) => state.droppedObject.plantObjectData.CAName
  );
  console.log("[plant Assignment] CAName:", CAName);

  // Trigger re-render of ReusableTable by changing the key
  useEffect(() => {
    if (tableData.length >= 0) {
      setTableKey((prevKey) => prevKey + 1); // Increment the key to trigger a re-render
    }
  }, [tableData]); // Runs whenever tableData changes

  useEffect(() => {
    if (connectionTableData.length >= 0) {
      setMBOMConnTableKey((prevKey) => prevKey + 1); // Increment the key to trigger a re-render
    }
  }, [connectionTableData]); // Runs whenever tableData changes
  
  if (droppedObjectData.cardData && droppedObjectData.initialDraggedData) {
    var state = droppedObjectData.cardData["Maturity State"];
    var hasMBOM = droppedObjectData.cardData["HasMBOM"];
    var type = droppedObjectData.initialDraggedData?.data?.items[0].objectType;
  }

  useEffect(() => {
    if (type === "Change Action") {
      setCAItemDetailsTable(CAItemDetails);
    } 
  }, [ type, CAItemDetails]);

  useEffect(() => {
    if (type === "Change Action") {
      setCAItemDetailsTable2(CAItemDetails2);
    } 
  }, [ type, CAItemDetails2]);

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

  // Update table data when droppedObjectData changes
  const newMBOMConnTableData = useMemo(() => {
    return type === "Change Action"
      ? getMBOMConnTableData(CAItemDetailsTable2, type, CAData)
      : getMBOMConnTableData(assignedPlant, type, CAData);
  }, [CAItemDetailsTable2, assignedPlant, type, CAData]);

  // Process card data
  const cardData = useMemo(
    () => getCardData(droppedObjectData),
    [droppedObjectData]
  );
  console.log(cardData);

  // Update table data and reset isTableLoading when newTableData changes
  useEffect(() => {
    if (newTableData.length >= 0) {
      console.log("New Table Data:", newTableData);
      setTableData(newTableData);
      setTableKey((prevKey) => prevKey + 1); // Update table key
    }
  }, [newTableData]);

  useEffect(() => {
    if (newMBOMConnTableData.length >= 0) {
      console.log("New Table Data:", newMBOMConnTableData);
      setMBOMConnTableData(newMBOMConnTableData);
      setMBOMConnTableKey((prevKey) => prevKey + 1); // Update table key
    }
  }, [newMBOMConnTableData]);

  

  useEffect(() => {
    setIsCardDataAvailable(!!cardData);
  }, [cardData]);

  // Define columns for the Part rev table
  const columns = useMemo(
    () => tableColumns(CAName, type, isRemoveMode, handleRemovePlant),
    [CAName, type, isRemoveMode, handleRemovePlant]
  );

  // Define columns for the MBOM Connection table
  const MBOMConnectionColumns = useMemo(
    () => tableColumnsMBOMConnections(CAName, type, isRemoveMode, handleRemovePlant),
    [CAName, type, isRemoveMode, handleRemovePlant]
  );

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
    console.log("[MBOMImpactReport] State Changes:", {
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
    setCAItemDetailsTable2([]);
    setAssignedPlant([]);
    setTableKey(0);
    setMBOMConnTableKey(0);

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

  console.log("Before template render :: columns ::", columns)
  console.log("Before template render :: tableData ::", tableData)

  return (
    <>
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
                  widgetType="MBOMImpactReport"
                />
              )}
            </div>
          </div>

          {/* Table Loader - show only when isTableLoading is true */}
          {isTableLoading ? (
            <div className="loading-indicator mt-5">
              {/* <Loader /> */}
            </div>
          ) : (
            <>
            
              <div className="wrapper-cta" style={{ overflowY: 'auto' }}>
              <h3 style={{ marginTop: '16px', marginLeft: '10px' }}>Part Revisions</h3>
              <div className="table-container1" style={{ overflowY: 'auto' }}>
                <MCOImpactReportPartRevTable
                  columns={columns}
                  data={tableData}
                />
                </div>
                
              <h3 style={{ marginTop: '16px', marginLeft: '10px' }}>MBOM Connections</h3>
              <div className="table-container1" style={{ overflowY: 'auto' }}>
                <MCOImpactReportMBOMConnectionTable
                  columns={MBOMConnectionColumns}
                  data={connectionTableData}
                />
                </div>
              </div>
            </>
          )}
        </>
      )}
      
      <ContentErrorsModal
        show={showErrorsModal}
        onHide={() => setShowErrorsModal(false)}
        errors={validationErrors}
      />
    </>
  );
};

export default MBOMImpactReport;
