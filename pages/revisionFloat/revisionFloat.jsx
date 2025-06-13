import React, { useEffect, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import DragAndDropComponent from "../../components/DragAndDrop/DragAndDrop";
import CardWithDragAndDrop from "../../components/Card/cardwithdraganddrop";
import { Image } from "react-bootstrap";
import useDroppableArea from "../../hooks/useDroppableArea";
import Loader from "../../components/Loader/Loader";
import ReusableTable from "../../components/Table/Table";
import {
  setDroppedObjectData,
  setIsDropped,
} from "../../store/droppedObjectSlice";
import { getCardData, getTableData, tableColumns } from "./dataHelpers";
import RevisionFloatToolbarNativeCta from "./revisionFloatToolbarNativeCta";

const RevisionFloat = () => {
  const { initializeDroppableArea, loading } = useDroppableArea();
  const tableKey = useRef(0); // ✅ Use useRef instead of useState
  const dispatch = useDispatch();

  // console.log("[RevisionFloat] 🎯 Component Rendered");
  // ✅ Use shallowEqual to prevent unnecessary re-renders
  const { cardData, parentDetails, isDropped, initialDraggedData } =
    useSelector(
      (state) => ({
        cardData: state.droppedObject.droppedObjectData.cardData,
        parentDetails: state.droppedObject.droppedObjectData.parentDetails,
        isDropped: state.droppedObject.isDropped,
        initialDraggedData:
          state.droppedObject.droppedObjectData.initialDraggedData,
      }),
      shallowEqual // ✅ Ensures Redux only re-renders when values actually change
    );
  // console.log("[RevisionFloat] 🏪 Redux State - cardData:", cardData);
  // console.log("[RevisionFloat] 🏪 Redux State - parentDetails:", parentDetails);

  // ✅ Ensure droppable area is only initialized **once**
  const hasInitializedDroppable = useRef(false);
  useEffect(() => {
    if (!hasInitializedDroppable.current) {
      // console.log("[RevisionFloat] 🔄 Initializing droppable area...");
      initializeDroppableArea();
      hasInitializedDroppable.current = true; // ✅ Ensure it runs only once
    }
  }, [initializeDroppableArea]);

  // useEffect(() => {
  //   if (!isDropped) {
  //     initializeDroppableArea();
  //   }
  // }, [isDropped, initializeDroppableArea]);

  // ✅ Memoize tableData (Only re-run if parentDetails change)
  const optimizedTableData = useMemo(
    () => getTableData(parentDetails, cardData),
    [parentDetails, cardData]
  );

  // ✅ Prevent unnecessary re-renders by checking for data changes
  useEffect(() => {
    if (optimizedTableData.length > 0) {
      console.log(
        "[RevisionFloat] 📊 optimizedTableData Updated:",
        optimizedTableData
      );
    }
  }, [optimizedTableData]);

  // ✅ Memoize cardData (Avoid recalculations unless cardData changes)
  const optimizedCardData = useMemo(() => getCardData(cardData), [cardData]);

  // ✅ Reset state only when needed
  const handleHomeClick = useCallback(() => {
    // console.log(
    //   "[handleHomeClick] 🏠 Home icon clicked. Resetting droppable area..."
    // );

    if (!isDropped) {
      // console.log(
      //   "[handleHomeClick] 🚫 Already reset. Skipping unnecessary updates."
      // );
      return;
    }

    // ✅ Only reinitialize if necessary
    if (!initialDraggedData.length) {
      // console.log("[handleHomeClick] 🔄 Reinitializing droppable area...");
      initializeDroppableArea();
    }

    // ✅ Reset Redux state only if needed
    dispatch(setIsDropped(false));

    if (cardData || parentDetails.length || initialDraggedData.length) {
      console.log("[handleHomeClick] 🗑 Dispatching reset action...");
      dispatch(
        setDroppedObjectData({
          cardData: {},
          parentDetails: [],
          initialDraggedData: [],
        })
      );
    } else {
      // console.log(
      //   "[handleHomeClick] 🚫 State already cleared. Skipping dispatch."
      // );
    }

    // console.log("[handleHomeClick] ✅ Reset complete.");
  }, [
    dispatch,
    initializeDroppableArea,
    isDropped,
    initialDraggedData,
    cardData,
    parentDetails,
  ]);

  // ✅ Memoize filtered columns
  const filteredColumns = useMemo(() => {
    if (cardData?.Type === "Document") {
      return tableColumns;
    } else {
      return tableColumns.filter(
        (column) => column.accessorKey !== "relationship"
      );
    }
  }, [cardData]);
  // console.log("[RevisionFloat] ✅ Component Updated");

  useEffect(() => {
    console.log("[RevisionFloat] State Changes:", {
      loading,
      isDropped,
    });
  }, [loading, isDropped]);

  return (
    <>
      {!isDropped && !loading && <DragAndDropComponent />}
      {isDropped && (
        <>
          {loading && <Loader />}
          <div className="content-wrapper py-3 border-bottom">
            <div className="d-flex">
              <div className="p-0 pt-4">
                <Image
                  src="https://thewhitechamaleon.github.io/testrapp/images/home.png"
                  alt="home-icon"
                  className="home-icon"
                  onClick={handleHomeClick}
                />
              </div>
              {optimizedCardData && (
                <CardWithDragAndDrop data={optimizedCardData} />
              )}
            </div>
          </div>

          {optimizedTableData.length > 0 ? (
            <div className="wrapper-cta">
              <RevisionFloatToolbarNativeCta />
              <ReusableTable
                key={tableKey.current}
                data={optimizedTableData}
                columns={filteredColumns}
                widgetType="Revision_FLoat_Widget"
              />
            </div>
          ) : (
            <div className="no-data-banner">No Parent object(s) found</div>
          )}
        </>
      )}
    </>
  );
};

export default RevisionFloat;
