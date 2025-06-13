import { loadWAFData } from "../../../utils/helpers";

export const getUserGroupCollab = async (headers, objectId, email) => {
  try {
    const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
    console.log("[UserGroup Status] ProductId: ", objectId);
    const WAFData = await loadWAFData();
    let urlObjWAF =
      `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/sharing/getSharing`;
    const response = await new Promise((resolve, reject) => {
      WAFData.authenticatedRequest(urlObjWAF, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        data: JSON.stringify({ data: [{ objectID: objectId }] }),
        // data: JSON.stringify(body),
        type: "json",
        onComplete: resolve,
        onFailure: reject,
      });
    });

    console.log("[Assigned Plant Service] Data received:", response);

    let userGroup = [];

    let userGroupBody = { groups: [] };
    if (response) {
      response.results.forEach((result) => {
        result.sharings.userGroups.forEach((group) => {
          // Check if the access is "Can Edit"
          if (group.access === "Can Edit") {
            userGroupBody.groups.push({
              uri: group.userGroupID.replace(/[<>]/g, ""),
            });
          }
        });
      });
      if (userGroupBody.groups.length > 0) {
        let grpUrl =
          "https://oi000186152-us1-usersgroup.3dexperience.3ds.com/3drdfpersist/resources/v1/usersgroup/groups?select=uri,members,title";
        const grpresponse = await new Promise((resolve, reject) => {
          WAFData.authenticatedRequest(grpUrl, {
            method: "POST",
            headers: {
              // ...headers,
              "Content-Type": "application/json",
            },
            data: JSON.stringify(userGroupBody),
            type: "json",
            onComplete: resolve,
            onFailure: reject,
          });
        });
        console.log("Group Response is:", grpresponse);
        //   const Email = "test"; //Logged in person mail need to change and get dynamically
        if (grpresponse) {
          userGroup = grpresponse.groups
            .filter((group) => group.members.includes(email))
            .map((group) => group.title);
        }
      }
    }

    console.log("[UserGroup Status] User Groups:", userGroup);
    // Return the user groups
    return userGroup;
  } catch (error) {
    console.error("[UserGroup Status] Error occurred:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
};
