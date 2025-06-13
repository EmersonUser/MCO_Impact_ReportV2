import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setDroppedObjectData } from "../store/droppedObjectSlice";
import { setIsDropped as setIsDroppedAction, setLoading } from "../store/droppedObjectSlice";
// Custom hook
import useRevisions from "./useRevisions";
// Reusable services
import {
  initializeDroppableArea as initDroppable,
  // fetchCsrfTokenAndDependencies as fetchCsrfService,
  getDroppedObjectDetails,
  // fetchCardOwnerDetails as fetchCardOwnerDetailsService,
} from "../services/api/droppableService";
import useToast from "../hooks/useToast";
import {
  MSG_FETCH_OBJECT_DETAILS_FAILED,
  MSG_INVALID_OBJECT_TYPE,
  MSG_UNEXPECTED_ERROR,
} from "../utils/toastMessages";

const useDroppableArea = () => {
  const { showErrorToast } = useToast();
  const { fetchRevisionsAndParents } = useRevisions();
  const dispatch = useDispatch();
  // ✅ Use `useSelector` to get the latest values from Redux
  const isDropped = useSelector((state) => state.droppedObject.isDropped);
  const loading = useSelector((state) => state.droppedObject.loading);

  const fetchObjectDetails = useCallback(
    async (dataItems) => {
      try {
        const objectDetailsResult = await getDroppedObjectDetails({
          dataItems,
        });

        if (objectDetailsResult.success) {
          // Fetch Revisions and Parents in parallel
          const relativePath = objectDetailsResult.data.cardData.relativePath;
          const [revisionParentData] = await Promise.all([
            fetchRevisionsAndParents(
              dataItems[0]?.objectId,
              dataItems[0]?.objectType,
              relativePath
            ),
          ]);
          // Dispatch all updates together (batching updates)
          dispatch(
            setDroppedObjectData({
              cardData: objectDetailsResult.data.cardData,
              parentDetails: revisionParentData || [],
            })
          );
          console.log("[fetchObjectDetails] ✅ Redux store updated.");
        } else {
          showErrorToast(MSG_FETCH_OBJECT_DETAILS_FAILED);
        }
      } catch (error) {
        console.error("[FetchObjectDetails] Error fetching details:", error);
        showErrorToast(MSG_FETCH_OBJECT_DETAILS_FAILED);
      } finally {
        console.log("[fetchObjectDetails] 🏁 Ensuring loading is reset.");
        dispatch(setLoading(false));
      }
    },
    [dispatch, fetchRevisionsAndParents, showErrorToast]
  );

  const handleDrop = useCallback(
    async (dataItems) => {
      console.log("[handleDrop] handleDrop called with dataItems:", dataItems);

      try {
        if (dataItems && dataItems.length > 0) {
          // Validate object type
          const objectType = dataItems[0]?.objectType;
          const validTypes = ["VPMReference", "Document", "Raw_Material"];
          if (!validTypes.includes(objectType)) {
            showErrorToast(MSG_INVALID_OBJECT_TYPE);
            return;
          }
          dispatch(setIsDroppedAction(true));
          // ✅ Ensure we only start loading if another request isn't running
          console.log("[handleDrop] 🔄 Force setting `loading = true`...");
          dispatch(setLoading(false));
          setTimeout(() => dispatch(setLoading(true)), 0);
          await fetchObjectDetails(dataItems);
        } else {
          console.warn("[handleDrop] No data items to process.");
        }
      } catch (error) {
        console.error("[Drop] Error in handleDrop:", error);
        dispatch(setLoading(false)); // ✅ Reset loading in Redux
        console.log(
          "[handleDrop] Error in handleDrop, setting loading to false"
        );
        showErrorToast(MSG_UNEXPECTED_ERROR);
      }
      // finally {
      //   const latestLoadingState = store.getState().droppedObject.loading;
      //   if (latestLoadingState) {
      //     console.log("[handleDrop] ✅ Resetting `loading = false`...");
      //     setLoading(false);
      //   } else {
      //     console.log("[handleDrop] ⏳ `loading` is already false. Skipping reset.");
      //   }
      // }
    },
    [fetchObjectDetails, showErrorToast]
  );
  // Initialize droppable area
  const initializeDroppableArea = useCallback(() => {
    // ✅ Only reset isDropped if it's currently false (prevent overwriting a valid drop)
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

export default useDroppableArea;
