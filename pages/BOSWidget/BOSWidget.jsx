import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DragAndDropComponent from "../../components/DragAndDrop/DragAndDrop";
import { Image } from "react-bootstrap";
import "./BOSWidget.css";
import Loader from "../../components/Loader/Loader";
import ReusableTable from "../../components/Table/Table";
import CardWithDragAndDrop from "../../components/Card/cardwithdraganddrop";
import {
  setDroppedObjectData,
  setIsDropped,
  setPlantObjectData,
} from "../../store/droppedObjectSlice";
import { getCardData, getTableData, tableColumns } from "./BOSdataHelpers";
import useToast from "../../hooks/useToast";
import { saveData } from "../../services/api/PlantAssignment/saveTableDataService";
import { MSG_SAVE_FAILURE, MSG_SAVE_SUCCESS } from "../../utils/toastMessages";
import useBOSDropableArea from "../../hooks/useBOSDropableArea";
import BOSWidgetToolbarNativeCta from "./BOSWidgetToolbarNativeCta";
import { fetchData } from "../../utils/helpers";

const BOSWidget = () => {
  const { initializeDroppableArea, loading } = useBOSDropableArea();
  const [tableKey, setTableKey] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [screenLoader, setScreenLoader] = useState(false);
  const [isCardDataAvailable, setIsCardDataAvailable] = useState(false);
  const [specData, setSpecData] = useState([]);
  const [selectableRows, setSelectableRows] = useState([]);
  const dispatch = useDispatch();
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    if (specData.length) {
      setTableData(specData.map((item) => ({ ...item, changedCells: {} })));
    }
  }, [specData]);

  const handleSave = async () => {
    console.log("Table Data is:", tableData);
    setScreenLoader(true);
    console.log("Type of Parent:", type);
    let parentData = [];
    let ChildNameKey;
    let ChildRevKey;
    let ChildStateKey;
    let ChildIdKey;
    if (type === "Document") {
      parentData = {
        SpecName: droppedObjectData.cardData.Name,
        SpecRevision: droppedObjectData.cardData["Dropped Revision"],
        SpecState: droppedObjectData.cardData["Maturity State"],
        SpecID: droppedObjectData.cardData["ID"], // NEED TO CHECK CARD DATA
        // SpecState need to be added.
      };
      ChildNameKey = "ItemName";
      ChildRevKey = "ItemRevision";
      ChildStateKey = "ItemState";
      ChildIdKey = "ItemID";
    } else {
      console.log("It's a physical Product");
      parentData = {
        ItemName: droppedObjectData.cardData.Name,
        ItemRevision: droppedObjectData.cardData["Dropped Revision"],
        ItemState: droppedObjectData.cardData["Maturity State"],
        ItemID: droppedObjectData.cardData["ID"], // NEED TO CHECK THIS
        // need to add Maturity State as Item State and ItemId is Dropped Revision Id.
      };
      ChildNameKey = "SpecName";
      ChildRevKey = "SpecRevision";
      ChildStateKey = "SpecState";
      ChildIdKey = "SpecID";
    }

    const formattedData = tableData.map((item) => {
      // Find matching data in bosSpecDocument
      let matchingData = bosSpecDocument.find(
        (data) =>
          data.childTitle === item.Title && data.childRevision === item.Revision
      );

      return {
        [ChildNameKey]: matchingData ? matchingData.childName : null, // Use found childName
        [ChildRevKey]: item.Revision, // Dynamic key based on type
        [ChildStateKey]: matchingData ? matchingData.childState : null, // need to check this
        [ChildIdKey]: matchingData ? matchingData.ID : null, //
        // something needs to be done here
        // [ChildStateKey]:
        ...parentData, // Merge Parent Data
        PrintOnPurchaseOrderRequired: item["Print On Purchase Order Required"],
        PrintOnWorkOrderRequired: item["Print On Work Order Required"],
        WorkOrderDocumentRequired: item["Work Order Document Required"],
        PrintOnReportOrderRequired: item["Print On report Order Required"],
        "SAP/JDE": item["SAP/JDE"],
      };
    });

    formattedData.sort((a, b) => {
      if (a.SpecName !== b.SpecName) {
        return a.SpecName.localeCompare(b.SpecName);
      }
      return Number(a.SpecRevision) - Number(b.SpecRevision);
    });

    console.log("Formatted Data:", formattedData);
    const saveURL =
      "https://saasimplementationserverdev.azurewebsites.net/bosAttribute/createORupdateDetails";
    const response = await fetchData("POST", saveURL, formattedData);

    console.log("the response from node API is:", response);
    if (response.status === 200) {
      showSuccessToast(MSG_SAVE_SUCCESS);
      setSpecData(tableData);
      setScreenLoader(false);
    } else {
      showErrorToast(MSG_SAVE_FAILURE);
      setScreenLoader(false);
    }
  };

  const handleMassUpdate = async (data, column, value) => {
    console.log("Data when the Mass Update is Clicked:", data);
    console.log("Columns to Change:", column);
    console.log("Value after change:", value);

    const updatedData = data.map((row) => ({
      ...row,
      [column]: value, // Update the specified column with the new value
    }));

    console.log("Updated Data is:", updatedData);
    console.log("Table Data is:", tableData);

    // Merge updatedData into tableData based on matching Title & Revision
    const mergedData = tableData.map((row) => {
      const updatedRow = updatedData.find(
        (updated) =>
          updated.Title === row.Title && updated.Revision === row.Revision
      );

      return updatedRow ? updatedRow : row; // Use updated row if found, else keep original row
    });

    console.log("Merged Data:", mergedData);
    updateTableData(mergedData);
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

  const loadingParentDetails = useSelector(
    (state) => state.droppedObject.loadingParentDetails
  );
  console.log("Parents Loading State:", loadingParentDetails);
  const proposedChanges = useSelector(
    (state) => state.droppedObject.plantObjectData.proposedChanges
  );
  console.log("Proposed Changes are:", proposedChanges);

  const isDropped = useSelector((state) => state.droppedObject.isDropped);
  const bosData = useSelector((state) => state.droppedObject.BOSObjectData);

  console.log("Bos data in BOS Widget is:", bosData);
  const bosSpecDocument = useSelector(
    (state) => state.droppedObject.BOSObjectData.specDocument
  );
  console.log("BOSObjectData", bosSpecDocument);

  const updateTableData = (updatedData) => {
    const newDataWithChanges = updatedData.map((newItem) => {
      const originalItem = specData.find(
        (oldItem) =>
          oldItem.Title === newItem.Title &&
          oldItem.Revision === newItem.Revision
      );

      if (!originalItem) return { ...newItem, changedCells: {} };

      // Track changed cells
      const changedCells = {};
      Object.keys(newItem).forEach((key) => {
        if (newItem[key] !== originalItem[key]) {
          changedCells[key] = true; // Mark this cell as changed
        }
      });

      return { ...newItem, changedCells };
    });

    setTableData(newDataWithChanges);
  };

  console.log("Table Data is:", tableData);
  useEffect(() => {
    if (tableData.length >= 0) {
      setTableKey((prevKey) => prevKey + 1); // Increment the key to trigger a re-render
    }
  }, [tableData]); // Runs whenever tableData changes
  if (droppedObjectData.cardData && droppedObjectData.initialDraggedData) {
    var state = droppedObjectData.cardData["Maturity State"];
    var type = droppedObjectData.initialDraggedData?.data?.items[0].objectType;
  }

  useEffect(() => {
    if (!isDropped) {
      initializeDroppableArea();
    }
  }, [isDropped, initializeDroppableArea]);
  useEffect(() => {
    setIsTableLoading(loadingParentDetails);
  }, [loadingParentDetails]);

  const newTableData = useMemo(
    () => getTableData(bosSpecDocument, type),
    [bosSpecDocument, type]
  );
  useEffect(() => {
    setSpecData(newTableData);
  }, [newTableData]);

  useEffect(() => {
    if (newTableData.length >= 0) {
      console.log("New Table Data:", newTableData);
      setTableData(newTableData);
      setTableKey((prevKey) => prevKey + 1); // Update table key
    }
  }, [newTableData]);
  const cardData = useMemo(
    () => getCardData(droppedObjectData),
    [droppedObjectData]
  );
  console.log(cardData);
  useEffect(() => {
    setIsCardDataAvailable(!!cardData);
  }, [cardData]);
  const columns = useMemo(
    () =>
      tableColumns(
        type,
        droppedObjectData?.cardData["Latest Revision"],
        droppedObjectData?.cardData["Dropped Revision"]
      ),
    [type, droppedObjectData?.cardData]
  );

  const handleHomeClick = () => {
    initializeDroppableArea(); // Reset the droppable area
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
      })
    );
    setTableData([]); // Clear local table data
    setIsCardDataAvailable(false);
  };

  return (
    <>
      {screenLoader && (
        <div className="loading-overlay">
          <Loader />
          <p>Saving...</p>
        </div>
      )}
      {!isDropped && !loading && !isTableLoading && <DragAndDropComponent />}
      {loading && <Loader />}
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
              {cardData && (
                <CardWithDragAndDrop data={cardData} widgetType="bosWidget" />
              )}
            </div>
          </div>

          {isTableLoading ? (
            <div className="loading-indicator mt-5">
              <Loader />
            </div>
          ) : (
            <>
              <div className="wrapper-cta">
                <BOSWidgetToolbarNativeCta
                  onSave={handleSave}
                  type={type}
                  latestRevision={
                    droppedObjectData?.cardData["Latest Revision"]
                  }
                  droppedRevision={
                    droppedObjectData?.cardData["Dropped Revision"]
                  }
                  selectedRows={selectedTableRows}
                  state={state}
                  tableData={selectableRows}
                  onMassUpdate={handleMassUpdate}
                />
                <ReusableTable
                  key={tableKey}
                  data={tableData}
                  columns={columns}
                  meta={{ updateTableData }}
                  type={type}
                  latestRevision={
                    droppedObjectData?.cardData["Latest Revision"]
                  }
                  droppedRevision={
                    droppedObjectData?.cardData["Dropped Revision"]
                  }
                  widgetType="Bos_Attribute_Widget"
                  onSelectableRowsChange={setSelectableRows}
                />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};
export default BOSWidget;
