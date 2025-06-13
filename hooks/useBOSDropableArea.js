import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDroppedObjectData, setLoading } from "../store/droppedObjectSlice";
import { setIsDropped as setIsDroppedAction } from "../store/droppedObjectSlice";
// Custom hook
import usePlantAssignment from "./usePlantAssignment";
// Reusable services
import {
  initializeDroppableArea as initDroppable,
  getDroppedObjectDetails,
} from "../services/api/droppableService";
import useToast from "../hooks/useToast";
import {
  MSG_FETCH_OBJECT_DETAILS_FAILED,
  MSG_UNEXPECTED_ERROR,
} from "../utils/toastMessages";
import useBOSWidget from "./useBOSWidget";

const useBOSDropableArea = () => {
  const { showErrorToast } = useToast();
  const { handleBOSWidget } = useBOSWidget();
  const isDropped = useSelector((state) => state.droppedObject.isDropped);

  const loading = useSelector((state) => state.droppedObject.loading);
  const dispatch = useDispatch();

  const fetchObjectDetails = useCallback(
    async (dataItems) => {
      try {
        const objectDetailsResult = await getDroppedObjectDetails({
          dataItems,
        });

        // const cardownerResult = await fetchCardOwnerDetailsService({
        //   dataItems,
        //   headers,
        // });

        if (objectDetailsResult.success) {
          // Merge the data from both services
          // const combineData = {
          //   cardData: objectDetailsResult.data.cardData,
          //   ownerData: cardownerResult.data.ownerData,
          // };

          dispatch(
            setDroppedObjectData({
              cardData: objectDetailsResult.data.cardData,
            })
          );

          const draggedObjectData = objectDetailsResult.data.cardData;
          console.log("[Dragged Items are]", draggedObjectData);

          dispatch(setIsDroppedAction(true));

          // call usePlantAssignment after successfully fetching object details
          if (objectDetailsResult) {
            await handleBOSWidget(
              draggedObjectData["Collaborative Space"],
              draggedObjectData["Maturity State"],
              dataItems[0]?.objectId,
              dataItems[0]?.objectType,
              draggedObjectData.Name,
              draggedObjectData["Dropped Revision"]
            );
          }
        } else {
          showErrorToast(MSG_FETCH_OBJECT_DETAILS_FAILED);
        }
      } catch (error) {
        console.error("[FetchObjectDetails] Error fetching details:", error);
        showErrorToast(MSG_FETCH_OBJECT_DETAILS_FAILED);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, handleBOSWidget]
  );

  const handleDrop = useCallback(
    async (dataItems) => {
      setLoading(true); // Start loading state
      console.log("[handleDrop] handleDrop called with dataItems:", dataItems);
      try {
        if (dataItems && dataItems.length > 0) {
          await fetchObjectDetails(dataItems);
        } else {
          console.warn("[handleDrop] No data items to process.");
        }
      } catch (error) {
        setLoading(false);
        console.error("[Drop] Error in handleDrop:", error);
        console.log(
          "[handleDrop] Error in handleDrop, setting loading to false"
        );
        showErrorToast(MSG_UNEXPECTED_ERROR);
      }
    },
    [fetchObjectDetails, showErrorToast]
  );
  // Initialize droppable area
  const initializeDroppableArea = useCallback(() => {
    if (!isDropped) {
      console.log(
        "[initializeDroppableArea] 🚀 Resetting isDropped to false..."
      );
      dispatch(setIsDroppedAction(false)); // ✅ Reset only if necessary
    } else {
      console.log(
        "[initializeDroppableArea] ⏳ isDropped is already true. Skipping reset."
      );
    }
    const interval = setInterval(() => {
      const droppableContainer = document.querySelector(".droppable-container");
      if (droppableContainer) {
        clearInterval(interval);
        initDroppable(droppableContainer, handleDrop, dispatch, showErrorToast);
      }
    }, 100); // Check every 100ms
 
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [handleDrop, dispatch]);

  return {
    initializeDroppableArea,
    loading,
    handleDrop,
  };
};

export default useBOSDropableArea;
