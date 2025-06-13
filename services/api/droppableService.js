import { callwebService } from "../../utils/helpers";
import { setInitialDroppedObjectData } from "../../store/droppedObjectSlice";
import api from "../../utils/api";
import { MSG_MULTIPLE_OBJECTS_DROPPED } from "../../utils/toastMessages";
import store from "../../store";


// 1. Export a global variable to hold the collabSpaceTitle
export let globalCollabSpaceTitles = [];

// 2. Create a function to process and store the collabSpaceTitle
export function processCollabSpace(collabspace) {
  if (!collabspace || !collabspace.title) {
    console.warn("[droppableService] ❌ No collabspace found.");
    return;
  }
  // Extract and trim the title from the collabspace object
  const collabSpaceTitle = collabspace.title.trim();
  console.log("[droppableService] collabSpaceTitle:", collabSpaceTitle);
  
  if (!Array.isArray(globalCollabSpaceTitles)) {
    globalCollabSpaceTitles = []; // Reset if somehow changed to a string
  }
    // Store multiple collabSpaceTitles in an array
    if (!globalCollabSpaceTitles.includes(collabSpaceTitle)) {
      globalCollabSpaceTitles.push(collabSpaceTitle);
    }
    console.log("[droppableService] Updated collabSpaceTitles array:", globalCollabSpaceTitles);
}


export const initializeDroppableArea = (
  droppableContainer,
  handleDrop,
  dispatch,
  showErrorToast
) => {
  
  console.log("[initializeDroppableArea] 🚀 Running...");
  window.require(["DS/DataDragAndDrop/DataDragAndDrop"], (DataDragAndDrop) => {
    DataDragAndDrop.droppable(droppableContainer, {
      drop: (data) => {
        console.log("[DragAndDrop] Drop event:", data);
        const parsedData = JSON.parse(data);
        const dataItems = parsedData.data.items;
        //  Process collabspace if available
        //  if (dataItems.length > 0 && dataItems[0].collabspace) {
        //   // Call the processing function to update the globalCollabSpaceTitle
        //   processCollabSpace(dataItems[0].collabspace);
        // }
         
        // Check if more than one object is being dropped
        if (dataItems.length > 1) {
          showErrorToast(MSG_MULTIPLE_OBJECTS_DROPPED);
          droppableContainer.classList.remove("drag-over");
          return; // Stop further execution
        }
        const currentState = store.getState().droppedObject.initialDraggedData;
        const isSameData =
          JSON.stringify(currentState) === JSON.stringify(parsedData);
        if (!isSameData) {
          dispatch(
            setInitialDroppedObjectData({
              initialDraggedData: parsedData, // ✅ Only update if different
            })
          );
        } else {
          console.log(
            "[initializeDroppableArea] Data unchanged. Skipping dispatch."
          );
        }
        handleDrop(dataItems);
        droppableContainer.classList.remove("drag-over");
      },
      enter: () => {
        droppableContainer.classList.add("drag-over");
      },
      out: () => {
        droppableContainer.classList.remove("drag-over");
      },
      leave: () => {
        droppableContainer.classList.remove("drag-over");
      },
    });
  });
};

// export const fetchCsrfTokenAndDependencies = async ({
//   dataItems,
//   setCsrfHeaders,
//   onSuccess,
//   onError,
// }) => {
//   try {
//     const WAFData = await loadWAFData();
//     const csrfURL= process.env.REACT_APP_CSRF_URL
//     const response = await new Promise((resolve, reject) => {
//       WAFData.authenticatedRequest(csrfURL, {
//         method: "GET",
//         type: "json",
//         onComplete: resolve,
//         onFailure: reject,
//       });
//     });
// // Revision Float
//     const csrfToken = response.csrf.name;
//     const csrfValue = response.csrf.value;
//     const securityContextHeader = "SecurityContext";
//     const securityContextValue =
//       "ctx%3A%3AVPLMProjectLeader.BU-0000001.Rosemount%20Flow";

//     const headers = {
//       [csrfToken]: csrfValue,
//       [securityContextHeader]: securityContextValue,
//     };

//     if (setCsrfHeaders) setCsrfHeaders(headers);

//     if (onSuccess) onSuccess(headers, dataItems); // Pass both headers and dataItems
//   } catch (error) {
//     console.error("[CSRF] Failed to fetch token:", error);

//     if (onError) onError(error);
//   }
// };

export const getDroppedObjectDetails = async ({ dataItems }) => {
  try {
    if (!dataItems || dataItems.length === 0) {
      console.error("[Object Details] No items to fetch.");
      return;
    }
    const objectId = dataItems[0]?.objectId;
    const type = dataItems[0]?.objectType;

    if (!objectId || !type) {
      throw new Error("[Object Details] Missing or invalid object ID or type");
    }

    // Sanitize the type by removing spaces
    const sanitizedType = type.replace(/\s+/g, "");

    // Use the axios instance to make the GET request
    const objectDetailsURL = `/revFloat/getDroppedObjectDetails?oid=${objectId}&type=${sanitizedType}`;
    const response = await api.get(objectDetailsURL);

    // Use response.status instead of response.ok
    if (response.status === 200) {
      return {
        success: true,
        data: {
          cardData: response.data, // Axios automatically parses JSON
        },
      };
    } else {
      throw new Error(
        `[Object Details] HTTP error! status: ${response.status}`
      );
    }
  } catch (error) {
    console.error("[Object Details] Failed to fetch data:", error);
    return { success: false, error: error.message };
  }
};

// export const fetchCardOwnerDetails = async ({ dataItems, headers }) => {
//   try {
//     if (!dataItems || dataItems.length === 0) {
//       console.error("[Card Owner Details] No items to fetch.");
//       return;
//     }

//     const objectID = dataItems[0]?.objectId;
//     if (!objectID) {
//       console.error("[Card Owner Details] Missing or invalid object ID:", dataItems);
//       return;
//     }

//     // Construct the URL dynamically
//     const cardOwnerDetailsURL = `${process.env.REACT_APP_CARD_OWNER_DETAILS_URL_BASE}/${objectID}?xrequestedwith=xmlhttprequest`;

//     const WAFData = await loadWAFData();
//     const response = await new Promise((resolve, reject) => {
//       WAFData.authenticatedRequest(cardOwnerDetailsURL, {
//         method: "GET",
//         headers,
//         type: "json",
//         onComplete: resolve,
//         onFailure: reject,
//       });
//     });

//     return {
//       success: true,
//       data: {
//         ownerData: {
//           cardownerdata: response.data,
//         },
//       },
//     };
//   } catch (error) {
//     console.error("[Card Owner Details] Failed to fetch data:", error);
//     return { success: false, error };
//   }
// };

export const SecurityContext = async () => {
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
  let email = "";

  let securitycontextpreference = {
    name: "Credentials",
    type: "list",
    label: "Credentials",
    options: [],
    defaultValue: "",
  };

  let urlObjWAF = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/modeler/pno/person?current=true&select=collabspaces&select=preferredcredentials&select=email`;
  let response = await callwebService("GET", urlObjWAF, "");

  console.log("Response for Preferences:", response);
  if (response.status) {
    if (response.output.collabspaces) {
      response.output.collabspaces.forEach((collabspace) => {
        let collabSpaceName = collabspace.name.trim(); // title
        let collabSpaceTitle = collabspace.title.trim(); // title
        // globalCollabSpaceTitles = collabSpaceTitle;
        processCollabSpace(collabspace);
        console.log("collab start",collabSpaceTitle);
        let couples = collabspace.couples;
        couples.forEach((couple) => {
          //MSOL-Micro Motion ● Measurement Solutions ● Leader
          const SecurityContextStr =
            couple.role.name +
            "." +
            couple.organization.name +
            "." +
            collabSpaceName;
          const SecurityContextLbl =
            collabSpaceTitle +
            " ● " +
            couple.organization.title +
            " ● " +
            couple.role.nls;
          securitycontextpreference.options.push({
            value: SecurityContextStr,
            label: SecurityContextLbl,
          });
        });
      });
    }
    if (response.output.preferredcredentials) {
      const preferredCredentials = response.output.preferredcredentials;
      const defaultOption = `${preferredCredentials.role.name}.${preferredCredentials.organization.name}.${preferredCredentials.collabspace.name}`;
      securitycontextpreference.defaultValue = defaultOption;
    }
    if (response.output.email) {
      email = response.output.email;
    }
  }

  return { securitycontextpreference: securitycontextpreference, email: email };
};
