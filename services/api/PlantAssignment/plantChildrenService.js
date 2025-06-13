import { loadWAFData } from "../../../utils/helpers";
export const fetchProductChildren = async (headers, objectId, type) => {
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;

  let urlObjWAF =
    `${ENOVIA_BASE_URL}/resources/v1/modeler/dseng/dseng:EngItem/`;
  urlObjWAF += objectId;
  urlObjWAF += "/expand";
  let body = {
    expandDepth: 1,
    type_filter_bo: ["VPMReference"],
    type_filter_rel: ["VPMInstance"],
  };

  try {
    console.log("[SearchCAService] ProductId is:", objectId);
    const WAFData = await loadWAFData();

    const fetchData = (url, Method, classifyBody) => {
      return new Promise((resolve, reject) => {
        WAFData.authenticatedRequest(url, {
          method: Method,
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          data: JSON.stringify(classifyBody),
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

    const response = await fetchData(urlObjWAF, "POST", body);
    console.log("[Get CA Details Service] Data received:", response);
    const { member } = response;

    if (member) {
      let childs = response.member
        .filter(
          (member) =>
            (member.type === "VPMReference" ||
              member.type === "Raw_Material") &&
            member.id !== objectId
        )
        .map((member) => ({
          id: member.id,
          type: member.type,
          name: member.title,
          state: member.state,
        }));

      // If there are child items, we need to fetch classification data
      if (childs.length > 0) {
        // Use Promise.all to handle multiple async operations
        await Promise.all(
          childs.map(async (child) => {
            if (child.state.toLowerCase() === "released") {
              let classesurl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslib/dslib:ClassifiedItem/${child.id}?$mask=dslib:ClassificationAttributesMask`;
              const classResponse = await fetchData(classesurl, "GET", "");
              console.log("classResponse->", classResponse);

              const classIds = classResponse.member.flatMap((member) => {
                if (member.ClassificationAttributes?.member) {
                  return member.ClassificationAttributes.member.map(
                    (classification) => classification.ClassID
                  );
                }
                return [];
              });
              child.classes = classIds; // Adding classes of released child
            }
          })
        );
      }

      return {
        success: true,
        data: childs,
      };
    }
  } catch (error) {
    console.error("Error while Fetching", error);
    return { success: false, data: [], error };
  }
};
