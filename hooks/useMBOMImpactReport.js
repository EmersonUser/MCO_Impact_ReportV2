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
  setMCAItemDetails,
  setMCAItemDetails2,
  setMCAItemObjectDetails,
} from "../store/droppedObjectSlice";
import { useState } from "react";
import { MSG_FETCH_CSRF_HEADERS_FAILED } from "../utils/toastMessages";
import useToast from "./useToast";
import { fetchCsrfToken } from "../services/api/PlantAssignment/fetchCsrfService";
import { initWidget } from "../lib/widget";
import { callEnoviaWebService } from "../utils/helpers";

const useMBOMImpactReport = () => {
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
      let ItemDetails2 = [];

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
            const changeProcessingPromises =
              response.output.proposedChanges.map(async (change) => {
                let proposedItemId = change.where.identifier;
                let proposedItemType = change.where.type;
                const nextSeqMCO = await getNextSeqMCO(proposedItemId, headers);
                const expandItemDetails = await expandItms(proposedItemId, headers);
                console.log("expandItemDetails ----",expandItemDetails);
                let iSize = expandItemDetails?.expandItmArray.length;
                let proposedItemTitle = expandItemDetails?.expandItmArray[0]?.title;
                let expandItemTitle = "";
                if(iSize > 1)
                  expandItemTitle = proposedItemTitle;
                for (let z = 0; z < iSize; z++) {
                  let ItemId = expandItemDetails?.expandItmArray[z]?.id;
                  let ItemType = expandItemDetails?.expandItmArray[z]?.type;

                  const engItemDetails = await getScopedItms(ItemId, headers);
                  console.log("engItemDetails Details are:", engItemDetails);
                  let EngItemId = engItemDetails.identifier;

                  if ( EngItemId !== undefined && proposedItemId !== undefined && proposedItemType !== undefined ) {
                    try {
                      const [ItemPlants, Iteminfo] = await Promise.all([
                        getAssignedClasses(EngItemId, headers),
                        getMfgItemDetails(ItemId, ItemType, headers),
                      ]);
                      console.log("ItemPlants --- ", ItemPlants);
                      console.log("Iteminfo --- ", Iteminfo);
                      // Push only proposed changes to display in Part Rev table
                      if (proposedItemId === Iteminfo?.member[0].id) {
                        ItemDetails.push({
                          ItemId,
                          ItemType,
                          ItemState: Iteminfo?.member[0].state || "N/A",
                          ItemTitle: Iteminfo?.member[0].title || "N/A",
                          ItemRev: Iteminfo?.member[0].revision || "N/A",
                          ItemMBOM: ItemPlants[0]?.MBOM === true ? "Make" : "Buy",
                          ItemSeq: ItemPlants[0]?.Seq || "N/A",
                          ItemNextSeqMCO: nextSeqMCO || "N/A",
                          ItemERPStatus: ItemPlants[0]?.PlantStatus || "N/A",
                          ItemPlantName: ItemPlants[0]?.PlantName,
                        });
                      }
                    // Push the proposed changes & its children to display in MBOM Connection table
                    if (expandItemTitle && (expandItemTitle !== Iteminfo?.member[0].title)) {
                      ItemDetails2.push({
                        ItemId,
                        ItemType,
                        ItemState: Iteminfo?.member[0].state || "N/A",
                        ItemFromTitle: expandItemTitle || "N/A",
                        ItemToTitle: Iteminfo?.member[0].title || "N/A",
                        ItemMBOM:
                          Iteminfo?.member[0]?.["dseno:EnterpriseAttributes"]
                            ?.EMR_hasMBOM || "N/A",
                        ItemSeq: ItemPlants[0]?.Seq || "N/A",
                        ItemNextSeqMCO: nextSeqMCO || "N/A",
                        ItemERPStatus: ItemPlants[0]?.PlantERPStatus || "N/A",
                      });
                    }
                      console.log("MCA ItemDetails", ItemDetails);
                      console.log("MCA ItemDetails2", ItemDetails2);
                    } catch (err) {
                      console.error(
                        `Error processing change for item ${ItemId}:`,
                        err
                      );
                    }
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

        //dispatch(setParentDetailsLoading(false));
        dispatch(setMCAItemDetails(ItemDetails));
        dispatch(setMCAItemDetails2(ItemDetails2));
        dispatch(setIsMFGCA(isMFGCA));
        //dispatch(setMCAHeaders(headers));
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

export default useMBOMImpactReport;

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
          let sequence = null;
 
          classification.Attributes.forEach((attribute) => {
            if (attribute.name.includes("PlantId")) {
              plantName = attribute.value;
            }
            if (attribute.name.includes("ERPStatus")) {
              erpStatus = attribute.value;
            }
            if (attribute.name.includes("Seq")) {
              sequence = attribute.value;
              console.log("sequence --- ",sequence);
            }
          });
 
          //if (plantName !== null) {
            plantIdData.push({
              PlantName: plantName,
              PlantID: classId,
              Seq: sequence,
              PlantERPStatus: erpStatus || "Pending", // Optional: set to empty string if not found
            });
          //}
          console.log("plantIdData ---- ", plantIdData);
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

async function getMfgItemDetails(identifier, ItemType, headers) {
  let url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${identifier}?mask=dsmfg:MfgItemMask.Details`;
  
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
      (type === "CreateAssembly" || type === "Provide")
        ? `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${identifier}`
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

async function expandItms(identifier, headers) {
  let url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${identifier}/expand?$mask=dsmfg:MfgItem.ExpandMask.Default.V1`;
  const body = {
    "expandDepth": 1,
    "withPath": false
  };
  try {
    const expandResponse = await callEnoviaWebService("POST", url, body, headers);
    console.log("expandItms --1-- ",expandResponse?.output);
    if (expandResponse.status && expandResponse.output) {
      const expandItmArray = [];
      const totalSize = expandResponse?.output?.totalItems;
      // if(totalSize > 1){
        for (let i = 0; i < totalSize; i++) {
          const item = expandResponse?.output?.member[i];
          const jsonObject = {
            id: item.id,
            type: item.type,
            title: item.title
          };
          if(item.type === "CreateAssembly" || item.type === "Provide")
            expandItmArray.push(jsonObject);
        }
      //}
      console.log("expandItmArray ---- ",expandItmArray);
      return {expandItmArray};
    } else {
      console.log(`No valid response for identifier ${identifier}`);
      return {}; // Return an empty object if the response is invalid
    }
  } catch (error) {
    console.error(`Error fetching item details for ${identifier}:`, error);
    return {}; // Return an empty object on error
  }
}

async function getNextSeqMCO(identifier, headers) {
  let url = `https://oi000186152-us1-space.3dexperience.3ds.com/enovia/resources/v1/modeler/dslc/version/getGraph`;
  const body = {
      "data": [
        {
          "id": identifier,
          "identifier": identifier,
          "type": "CreateAssembly",
          "source": "https://oi000186152-us1-space.3dexperience.3ds.com/enovia",
          "relativePath": `/resources/v1/modeler/dsmfg/dsmfg:MfgItem/${identifier}`
        }
      ]
  };
  try {
    const expandResponse = await callEnoviaWebService("POST", url, body, headers);
    console.log("getNextSeqMCO --1-- ",expandResponse?.output);
    if (expandResponse.status && expandResponse.output) {
      const ItemId = findNextRevisionIdentifier(expandResponse.output, identifier);
      if(ItemId){
        const engItemDetails = await getScopedItms(ItemId, headers);
        if(engItemDetails){
          let EngItemId = engItemDetails.identifier;
          const classAttr = getAssignedClasses(EngItemId, headers);
          const nextSeqMCO = classAttr[0]?.FlowDownCA || "N/A";
          console.log("Next seq MCO is:", nextSeqMCO);
          const lastHyphenIndex = nextSeqMCO.lastIndexOf("-");
          let CAName = "";
          if (lastHyphenIndex !== -1) {
            CAName = nextSeqMCO.substring(0, lastHyphenIndex);
          } else {
            CAName = nextSeqMCO;
          }
          const MCODetails = await SearchCA(CAName, headers);
          console.log("MCODetails --475-- ",MCODetails);
          return nextSeqMCO;
        } else {
          console.log(`scope does NOT exist for identifier ${identifier}`);
          return undefined; // Return an empty object if the response is invalid
        }
      } else {
        console.log(`Next revision does NOT exist for identifier ${identifier}`);
        return undefined; // Return an empty object if the response is invalid
      }
    } else {
      console.log(`No valid response for identifier ${identifier}`);
      return undefined; // Return an empty object if the response is invalid
    }
  } catch (error) {
    console.error(`Error fetching item details for ${identifier}:`, error);
    return undefined; // Return an empty object on error
  }
}

function findNextRevisionIdentifier(data, targetIdentifier) {
  if (!data?.results?.length) return null;
  const versions = data.results[0]?.versions || [];
  // Step 1: Find the current revision
  const currentItem = versions.find(v => v.identifier === targetIdentifier);
  if (!currentItem) return null;
  const currentRevision = currentItem.revision;
  // Step 2: Determine the revision format and compute the next one
  const nextRevision = getNextRevision(currentRevision);
  // Step 3: Find the version with that revision
  const nextItem = versions.find(v => v.revision === nextRevision);
  return nextItem ? nextItem.identifier : null;
}

// Helper to determine revision format and compute next revision
function getNextRevision(revision) {
  // Numeric (e.g. '01', '02', or '1')
  if (/^\d+$/.test(revision)) {
    const numeric = parseInt(revision, 10) + 1;
    return revision.length > 1
      ? String(numeric).padStart(revision.length, '0') // preserve leading zeroes
      : String(numeric);
  }
  // Alphabetic (e.g. 'AA', 'AB', 'AC', ..., 'AZ', 'BA', etc.)
  if (/^[A-Z]+$/.test(revision)) {
    return incrementAlphaRevision(revision);
  }
  // If format is unknown, return as is
  return revision;
}

// Increment alphabetic revision like AA → AB, AZ → BA
function incrementAlphaRevision(str) {
  let chars = str.split('');
  let i = chars.length - 1;
  while (i >= 0) {
    if (chars[i] === 'Z') {
      chars[i] = 'A';
      i--;
    } else {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      return chars.join('');
    }
  }
  // All characters were 'Z', so prepend 'A' (e.g., 'ZZ' → 'AAA')
  return 'A' + chars.join('');
}

export const SearchCA = async (flowDownCA, headers) => {
  let CADetails = { CAAtt: [] };
  console.log("We are into Search CA Details");
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
  try {
    // 1st API call to search for the Change Action
    let urlObjWAF = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/search?$searchStr=name:${flowDownCA}`;
    const searchResponse = await callEnoviaWebService("GET", urlObjWAF, "", headers);
    const caID = searchResponse.changeAction[0]?.identifier;
    console.log("Response From 1st Call", caID);

    if (caID) {
      // 2nd API call to fetch Change Action details
      const CAUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/${caID}?$fields=proposedChanges,flowDown`;
      const CAresponse = await callEnoviaWebService("GET", CAUrl, "", headers);
      console.log("Response From 2nd Call", CAresponse);

      if (CAresponse) {
        // Use for...of for async handling in loop
        for (const item of CAresponse.isFlowDownOf || []) {
          if (item.type === "Change Action") {
            const parentCAUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/${item.identifier}?$fields=proposedChanges,flowDown`;
            try {
              // 3rd API call to fetch Parent Change Action details
              const parentCAResponse = await callEnoviaWebService("GET", parentCAUrl, "", headers);

              console.log("Response From 3rd Call", parentCAResponse);

              if (parentCAResponse) {
                CADetails.CAAtt.push({
                  CATitle: parentCAResponse.title,
                  CAState: parentCAResponse.state,
                });
              }
            } catch (error) {
              console.error("Error fetching parent CA data:", error);
            }
          }
        }
        CADetails["MCOState"] = CAresponse.state;
        CADetails["MCOTitle"] = CAresponse.title;
      }
    }
    console.log("Final CA Details", CADetails);
    return CADetails;
  } catch (error) {
    console.error("Error in SearchCA:", error);
    throw error;
  }
};
