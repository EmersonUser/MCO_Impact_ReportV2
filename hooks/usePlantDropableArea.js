import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setDroppedObjectData,
  setInitialDroppedObjectData,
  setPlantObjectData,
} from "../store/droppedObjectSlice";
import {
  setIsDropped as setIsDroppedAction,
  setLoading,
} from "../store/droppedObjectSlice";
// Custom hook
import usePlantAssignment from "./usePlantAssignment";
// Reusable services
import {
  initializeDroppableArea as initDroppable,
  // fetchCsrfTokenAndDependencies as fetchCsrfService,
  // fetchObjectDetails as fetchObjectDetailsService,
  getDroppedObjectDetails,
  // fetchCardOwnerDetails as fetchCardOwnerDetailsService,
} from "../services/api/droppableService";
import useToast from "../hooks/useToast";
import {
  MSG_FETCH_CSRF_HEADERS_FAILED,
  MSG_FETCH_OBJECT_DETAILS_FAILED,
  MSG_INVALID_OBJECT_TYPE,
  MSG_UNEXPECTED_ERROR,
} from "../utils/toastMessages";
 
const usePlantDropableArea = () => {
  const { showErrorToast } = useToast();
  const { handlePlantAssignment } = usePlantAssignment();
  const isDropped = useSelector((state) => state.droppedObject.isDropped);
  const loading = useSelector((state) => state.droppedObject.loading);
  const dispatch = useDispatch();
 
  const fetchObjectDetails = useCallback(
    async (dataItems) => {
      try {
        const objectDetailsResult = await getDroppedObjectDetails({
          dataItems,
        });
        // const objectDetailsResult = {
        //   success: "true",
        //   data: {
        //     cardData: {
        //       "Title": "PRD90100",
        //       "Type": "Physical Product",
        //       "Maturity State": "In Work",
        //       "Owner": "Sudarshan Sambamurthy",
        //       "Collaborative Space": "Micro Motion",
        //       "Collaborative Space Title": "MSOL-Micro Motion",
        //       "Description": "",
        //       "Dropped Revision": "AA",
        //       "Dropped Revision ID": "6B8F27BDB2680A0067EE217D00044C1B",
        //       "Latest Released Revision": "",
        //       "Latest Released Revision ID": "",
        //       "EIN": "PRD90100",
        //       "CAD Format": "",
        //       "imageURL": "https://oi000186152-us1-space.3dexperience.3ds.com:443/enovia/snresources/images/icons/large/I_VPMNavProduct108x144.png",
        //       "relativePath": "/resources/v1/modeler/dseng/dseng:EngItem/6B8F27BDB2680A0067EE217D00044C1B",
        //       "Name": "prd-OI000186152-00090100",
        //       "organization": "BU-0000001",
        //       "Latest Revision": "AA",
        //       "MFGCA": false
        //   },
        //   },
        // };
 
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
            await handlePlantAssignment(
              draggedObjectData["Collaborative Space"],
              draggedObjectData["Maturity State"],
              dataItems[0]?.objectId,
              dataItems[0]?.objectType
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
    [dispatch, handlePlantAssignment]
  );
 
  const handleDrop = useCallback(
    async (dataItems) => {
      console.log("[handleDrop] handleDrop called with dataItems:", dataItems);
 
      try {
        if (dataItems && dataItems.length > 0) {
          // Validate object type
          const objectType = dataItems[0]?.objectType;
          const validTypes = [
            "VPMReference",
            "Document",
            "Raw_Material",
            "Change Action",
          ]; //
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
 
export default usePlantDropableArea;