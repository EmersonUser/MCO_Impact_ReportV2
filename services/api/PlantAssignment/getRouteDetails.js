import { loadWAFData } from "../../../utils/helpers";
 
export const GetFlowDownCADetails = async (flowDownCA, headers) => {
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
    let urlObjWAF = `${ENOVIA_BASE_URL}/resources/v1/modeler/dsrt/routes/search?searchStr=${flowDownCA}`;
    const searchResponse = await fetchData(urlObjWAF);
    const routeData = (searchResponse?.data || []).find(item => item.type === "Route");
 
    if (routeData) {
        const RouteID = routeData.identifier;
        const RouteStatus = routeData.state;
        const RouteURL = `${ENOVIA_BASE_URL}/resources/v1/modeler/dsrt/routes/${RouteID}`;
        const RouteDetails = await fetchData(RouteURL);
        const ChangeData = (RouteDetails?.data || []).find(item => item.type === "Change Action");
        if(ChangeData){
            const MFGCAID = ChangeData.identifier;
            const CAUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/${MFGCAID}?$fields=proposedChanges,flowDown`;
            const CAresponse = await fetchData(CAUrl);
            if (CAresponse) {
                for (const item of CAresponse.isFlowDownOf || []) {
                  if (item.type === "Change Action") {
                    const EngCAUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/changeaction/${item.identifier}`;
                    const EngCAResponse = await fetchData(EngCAUrl);
                    if (EngCAResponse) {
                        CADetails.CAAtt.push({
                          CATitle: EngCAResponse.title,
                          CAState: EngCAResponse.state,
                        });
                      }
                  }
                }
            }
        }
        CADetails["MCOState"] = RouteStatus;
        CADetails["MCOTitle"] = flowDownCA;
    }    
    console.log("Final CA Details", CADetails);
    return CADetails;
  } catch (error) {
    console.error("Error in SearchCA:", error);
    throw error;
  }
};