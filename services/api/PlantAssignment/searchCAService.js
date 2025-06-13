import { loadWAFData } from "../../../utils/helpers";

export const SearchCA = async (flowDownCA, headers) => {
  let CADetails = { CAAtt: [] };
  console.log("We are into Search CA Details");
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;

  try {
    const WAFData = await loadWAFData();

    const fetchData = async (url) => {
      return new Promise((resolve, reject) => {
        WAFData.authenticatedRequest(url, {
          method: "GET",
          headers,
          type: "json",
          onComplete: (response) => {
            console.log("Received response:", response);

            resolve(response); // Resolve the promise with the response data
          },
          onFailure: (error) => {
            console.error("Request failed:", error);
            reject(error); // Reject the promise with the error
          },
        });
      });
    };

    // 1st API call to search for the Change Action
    let urlObjWAF = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/search?$searchStr=name:${flowDownCA}`;
    const searchResponse = await fetchData(urlObjWAF);
    const caID = searchResponse.changeAction[0]?.identifier;

    console.log("Response From 1st Call", caID);

    if (caID) {
      // 2nd API call to fetch Change Action details
      const CAUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/${caID}?$fields=proposedChanges,flowDown`;
      const CAresponse = await fetchData(CAUrl);

      console.log("Response From 2nd Call", CAresponse);

      if (CAresponse) {
        // Use for...of for async handling in loop
        for (const item of CAresponse.isFlowDownOf || []) {
          if (item.type === "Change Action") {
            const parentCAUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/${item.identifier}?$fields=proposedChanges,flowDown`;

            try {
              // 3rd API call to fetch Parent Change Action details
              const parentCAResponse = await fetchData(parentCAUrl);

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
