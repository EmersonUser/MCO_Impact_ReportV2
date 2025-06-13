import { useDispatch } from "react-redux";

import { getUserGroupCollab } from "../services/api/PlantAssignment/userGroupService";
import { getAllPlants } from "../services/api/PlantAssignment/allPlantSevice";

import { fetchProductChildren } from "../services/api/PlantAssignment/plantChildrenService";
import { fetchCADetails } from "../services/api/PlantAssignment/CADetailService";
import { fetchAssignedPlants } from "../services/api/PlantAssignment/assignedPlantService";


import {
  setCAAllPlants,
  setCAHeaders,
  setCAItemDetails,
  setCAName,
  setHeaders,
  setIsMFGCA,
  setParentDetailsLoading,
  setPlantObjectData,
  setProductChildren,
  setProposedChanges,
  setCAData,
} from "../store/droppedObjectSlice";
import { useState } from "react";
import { MSG_FETCH_CSRF_HEADERS_FAILED } from "../utils/toastMessages";
import useToast from "./useToast";
import { fetchCsrfToken } from "../services/api/PlantAssignment/fetchCsrfService";
import { initWidget } from "../lib/widget";
import { callEnoviaWebService } from "../utils/helpers";

const usePlantAssignment = () => {
  const { showErrorToast } = useToast();
  const dispatch = useDispatch();

  let email = window.widget.getValue("email");
  console.log("Email in usePlantAssignment:", email);

  const handlePlantAssignment = async (collabSpace, state, objectId, type) => {
    try {
      dispatch(setParentDetailsLoading(true)); // Start loading state

      // Fetch CSRF headers
      const headers = await fetchCsrfToken();
      if (!headers) {
        showErrorToast(MSG_FETCH_CSRF_HEADERS_FAILED);
        return;
      }
      console.log("[UsePlantAssignment] Headers:", headers);

      let ItemDetails = [];

      // Handle "Change Action" type separately
      if (type === "Change Action") {
        let isMFGCA = false;
        console.log("The object Type is Change Action");
        const fetchChangeActionData = async () => {
          const CAURL = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/changeaction/${objectId}?%24fields=proposedChanges,realizedChanges`;
          const response = await callEnoviaWebService(
            "GET",
            CAURL,
            "",
            headers
          );
          console.log("Response from Change Action URL:", response);

          if (response.status && response.output) {
            const realizedChanges = response.output.realizedChanges.map(
              (realizedChange) => realizedChange.where.identifier
            );
            const changeProcessingPromises =
              response.output.proposedChanges.map(async (change) => {
                let ItemId = change.where.identifier;
                let ItemType = change.where.type;

                if (change.target === "NewVersion") {
                  const sLatestID = await getLatestRevision(
                    ItemId,
                    ItemType,
                    headers
                  );
                  if (realizedChanges.includes(sLatestID)) {
                    ItemId = sLatestID;
                  }
                }
                if (
                  ItemType !== "Raw_Material" &&
                  ItemType !== "VPMReference"
                ) {
                  isMFGCA = true;
                  const mfgDetails = await getScopedItms(ItemId, headers);
                  console.log("MFG Details are:", mfgDetails);
                  ItemId = mfgDetails.identifier;
                  ItemType = mfgDetails.type;
                }
                if (ItemId !== undefined && ItemType !== undefined) {
                  try {
                    const [ItemPlants, Iteminfo] = await Promise.all([
                      getAssignedClasses(ItemId, headers),
                      getItemDetails(ItemId, ItemType, headers),
                    ]);

                    ItemDetails.push({
                      ItemId,
                      ItemType,
                      ItemState: Iteminfo?.member[0].state || "N/A",
                      ItemTitle: Iteminfo?.member[0].title || "N/A",
                      ItemRev: Iteminfo?.member[0].revision || "N/A",
                      ItemMBOM:  Iteminfo?.member[0]?.["dseno:EnterpriseAttributes"]?.EMR_hasMBOM || "N/A",
                      ItemPlants,
                    });
                  } catch (err) {
                    console.error(
                      `Error processing change for item ${ItemId}:`,
                      err
                    );
                  }
                }
              });

            await Promise.all(changeProcessingPromises);
          } else {
            console.error("Invalid response structure or no proposed changes.");
          }
        };
        const CAAllPlantsData = async () => {
          // Replace this with your actual API call
          const allPlants = await getAllPlants(
            [collabSpace],
            headers,
            objectId
          ); // getAllPlants wants collabspace as an array.
          console.log("Parallel API response:", allPlants);
          dispatch(setCAAllPlants(allPlants));
        };

        // Run both functions in parallel
        await Promise.all([fetchChangeActionData(), CAAllPlantsData()]);

        dispatch(setParentDetailsLoading(false));
        dispatch(setCAItemDetails(ItemDetails));
        dispatch(setIsMFGCA(isMFGCA));
        dispatch(setCAHeaders(headers));
      } else {
        // Step 1: Fetch user group collaboration spaces
        const userGroupCollab = await getUserGroupCollab(
          headers,
          objectId,
          email
        );
        console.log("[Plant Assignment] User Groups:", userGroupCollab);

        let allCollabSpaces = [...userGroupCollab, collabSpace];
        console.log(
          "[Use Plant Assignment] All CollabSpaces:",
          allCollabSpaces
        );

        // Step 2: Fetch all plants if collab spaces exist
        let allPlants = [];
        if (allCollabSpaces.length > 0) {
          allPlants = await getAllPlants(allCollabSpaces, headers, objectId);
          console.log("[Use Plant Assignment] All Plants:", allPlants);
        } else {
          console.warn("[Use Plant Assignment] No CollabSpaces found.");
        }

        // Step 3: Fetch assigned plants if there are any
        if (allPlants.length > 0) {
          const plants = await fetchAssignedPlants(
            allPlants,
            headers,
            objectId
          );
          console.log("[Use Plant Assignment]: ", plants);

          if (plants.success) {
            dispatch(setPlantObjectData(plants.data.plantData));
            dispatch(setHeaders(headers));
          } else {
            console.error("Failed to fetch plant data.");
          }
        } else {
          console.warn("[Use Plant Assignment] No Plants found.");
        }

        // Step 4: Fetch Product Children based on type
        let getProductChildren = {};
        if (type === "Raw_Material") {
          getProductChildren = { success: true, data: [] };
        } else {
          getProductChildren = await fetchProductChildren(
            headers,
            objectId,
            type
          );
        }

        console.log("Type After:", type);
        console.log(
          "[Use Plant Assignment] Product Children:",
          getProductChildren
        );

        if (getProductChildren.success) {
          dispatch(setProductChildren(getProductChildren.data));
        }

        // Step 5: Fetch Change Action details
        const getCaDetails = await fetchCADetails(headers, objectId, state);
        console.log("[Use Plant Assignment] CA Details:", getCaDetails);

        if (getCaDetails.success) {
          dispatch(setCAName(getCaDetails.data));
          dispatch(setProposedChanges(getCaDetails.proposedChanges));
          dispatch(setCAData(getCaDetails.CAData));
        }

        console.log("[Plant Assignment] All services executed successfully.");
      }
    } catch (error) {
      console.error("[Plant Assignment] Error:", error);
      showErrorToast("An error occurred while fetching plant assignment data.");
    } finally {
      dispatch(setParentDetailsLoading(false)); // Ensure loading is disabled in all cases
    }
  };

  return { handlePlantAssignment };
};

export default usePlantAssignment;

// Function to call the relevant URL for a ClassifiedItem using a single identifier
async function getAssignedClasses(identifier, headers) {
  const plantIdData = [];
 
  const url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslib/dslib:ClassifiedItem/${identifier}?$mask=dslib:ClassificationAttributesMask`;
 
  try {
    const itemResponse = await callEnoviaWebService("GET", url, "", headers);
    console.log(`Response for identifier ${identifier}:`, itemResponse);
 
    if (
      itemResponse.output.member &&
      itemResponse.output.member[0].ClassificationAttributes
    ) {
      itemResponse.output.member[0].ClassificationAttributes.member.forEach(
        (classification) => {
          const classId = classification.ClassID;
          let plantName = null;
          let erpStatus = null;
 
          classification.Attributes.forEach((attribute) => {
            if (attribute.name.includes("PlantId")) {
              plantName = attribute.value;
            }
            if (attribute.name.includes("ERPStatus")) {
              erpStatus = attribute.value;
            }
          });
 
          if (plantName !== null) {
            plantIdData.push({
              PlantName: plantName,
              PlantID: classId,
              PlantERPStatus: erpStatus || "Pending", // Optional: set to empty string if not found
            });
          }
        }
      );
    } else {
      console.log(`No valid classification data for identifier ${identifier}`);
    }
  } catch (error) {
    console.error(`Error fetching assigned classes for ${identifier}:`, error);
  }
 
  return plantIdData;
}

async function getItemDetails(identifier, ItemType, headers) {
  let url = "";

  // Check if the ItemType is 'Raw_Material' and adjust the URL accordingly
  if (ItemType === "Raw_Material") {
    url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsrm/dsrm:RawMaterial/${identifier}`;
  } else {
    // Default URL for EngItem
    url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dseng/dseng:EngItem/${identifier}?mask=dsmveng:EngItemMask.Details`;
  }

  try {
    const itemResponse = await callEnoviaWebService("GET", url, "", headers);

    if (itemResponse.status && itemResponse.output) {
      return itemResponse.output;
    } else {
      console.log(`No valid response for identifier ${identifier}`);
      return {}; // Return an empty object if the response is invalid
    }
  } catch (error) {
    console.error(`Error fetching item details for ${identifier}:`, error);
    return {}; // Return an empty object on error
  }
}

async function getLatestRevision(identifier, type, headers) {
  const revurl = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/version/getGraph`;
  const ret = "";
  try {
    const relativePath =
      type === "Raw_Material"
        ? `/resources/v1/modeler/dsrm/dsrm:RawMaterial/${identifier}`
        : `/resources/v1/modeler/dseng/dseng:EngItem/${identifier}`;

    const Body = {
      data: [
        {
          id: identifier,
          identifier: identifier,
          type: type,
          source: "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
          relativePath: relativePath,
        },
      ],
    };

    // Make the API call with the dynamically created body
    const response = await callEnoviaWebService(
      "POST",
      revurl,
      JSON.stringify(Body),
      headers
    );

    // Check if the response contains status and output properties
    if (response.status && response.output) {
      // Loop through each result in the response and check for ancestors
      for (const result of response.output.results) {
        if (
          result.ancestors &&
          result.ancestors.some(
            (ancestor) => ancestor.identifier === identifier
          )
        ) {
          return result.id;
        }
      }
    } else {
      console.error(
        "API response does not contain the expected 'status' and 'output'."
      );
      return ret;
    }
  } catch (error) {
    console.error(`Error fetching getLatestRevision for ${identifier}:`, error);
    return ret;
  }
}
async function getScopedItms(identifier, headers) {
  let url = "";

  url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${identifier}/dsmfg:ScopeEngItem`;

  try {
    const itemResponse = await callEnoviaWebService("GET", url, "", headers);

    if (itemResponse.status && itemResponse.output) {
      return {
        identifier: itemResponse.output.member[0].ScopeEngItem.identifier,
        type: itemResponse.output.member[0].ScopeEngItem.type,
      };
    } else {
      console.log(`No valid response for identifier ${identifier}`);
      return {}; // Return an empty object if the response is invalid
    }
  } catch (error) {
    console.error(`Error fetching item details for ${identifier}:`, error);
    return {}; // Return an empty object on error
  }
}
