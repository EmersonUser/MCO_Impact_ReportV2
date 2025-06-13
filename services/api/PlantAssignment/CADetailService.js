import { loadWAFData } from "../../../utils/helpers";
export const fetchCADetails = async (headers, objectID, state) => {
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
  let resObejct = false;
  let proposedChangesArray = [];
  let CADetails = {"CAName":"", "CAStatus":""};
  const URLCADetails =
    `${ENOVIA_BASE_URL}/resources/enorelnav/v2/navigate/setPreferences`;
 
  let body = {
    widgetId: "ENORIPE_Relations_Preview_2751_2038-15:33:22",
    relations: ["caproposedwhere_from"],
    allRelationsMode: false,
    publicationsMode: false,
    computeWithInstances: false,
    attributesForView: ["ds6w:status", "ds6w:type", "ds6w:identifier","ds6w:label"],
    label: "ENXENG_AP-e1331143-1734517777960",
    lang: "en",
    ghostMode: false,
  };
  let url2 =
    `${ENOVIA_BASE_URL}/resources/enorelnav/v2/navigate/getEcosystem`;
  let bd = {
    widgetId: "ENORIPE_Relations_Preview_2751_2038-15:33:22",
    responseMode: "objectsByPatterns",
    label: "ENXENG_AP-e1331143-1734517780491",
    ids: [objectID],
  };
 
  try {
    console.log("[Get CA Details] Product ID:", objectID);
 
    const WAFData = await loadWAFData();
 
    const response = await new Promise((resolve, reject) => {
      WAFData.authenticatedRequest(URLCADetails, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        data: JSON.stringify(body),
        type: "json",
        onComplete: resolve,
        onFailure: reject,
      });
    });
 
    console.log("[Get CA Details Service] Data received:", response);
 
    if (response.status === "OK") {
      const response2 = await new Promise((resolve, reject) => {
        WAFData.authenticatedRequest(url2, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          data: JSON.stringify(bd),
          type: "json",
          onComplete: resolve,
          onFailure: reject,
        });
      });
 
      console.log("[Get CA Details Service] Data received:", response2);
      if (response2.objectsByPatterns.caproposedwhere_from) {
        await Promise.all(
          response2.objectsByPatterns.caproposedwhere_from.map(async (itm) => {
            const status = itm["ds6w:status"].slice(14);
            const CAName = itm["ds6w:label"];
            if (status !== "Complete") {
              let url3 = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/${itm.id}?$fields=proposedChanges,flowDown`;
 
              const response3 = await new Promise((resolve, reject) => {
                WAFData.authenticatedRequest(url3, {
                  method: "GET",
                  headers,
                  type: "json",
                  onComplete: resolve,
                  onFailure: reject,
                });
              });
 
              if (Array.isArray(response3.proposedChanges)) {
                response3.proposedChanges.forEach((proposedChange) => {
                  proposedChangesArray.push({
                    identifier: proposedChange.where.identifier,
                    action: proposedChange.whats[0].what,
                  });
                });
              }
 
              if (state.toLowerCase() === "released") {
                resObejct = proposedChangesArray.some(
                  (proposedChange) =>
                    proposedChange.identifier === objectID &&
                    proposedChange.action === "Modify"
                );
              } else {
                resObejct = true;
              }
 
              if(resObejct){
                CADetails["CAName"] = CAName;
                CADetails["CAStatus"] = status;
              }
            }
          })
        );
      }
    } else {
      console.error("Unable to Fetch the ");
    }
    console.log("Status is coming inside 7");
    console.log("Response Object is:", resObejct);
 
    return {
      success: true,
      data: resObejct,
      CAData : CADetails,
      proposedChanges: proposedChangesArray,
    };
  } catch (error) {
    console.error("Failed Request:", {
      url: URLCADetails,
      headers,
      body,
      error,
    });
 
    throw error;
  }
};