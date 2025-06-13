import { loadWAFData } from "../../../utils/helpers";

export const getAllPlants = async (allCollabSpaces, headers, objectId) => {
  try {
    const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
    let UserGroupClasses = [];
    console.log("[All Plant Service] CollabSpaces: ", allCollabSpaces);
    console.log("[All Plant Service] headers: ", headers);
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

    // Iterate through all collab spaces and fetch data for each
    const plantDataPromises = allCollabSpaces.map(async (collabSpace) => {
      try {
        const collabspaceURL = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslib/dslib:Library/search?$searchStr=${collabSpace}`;

        const collabspaceResponse = await fetchData(collabspaceURL);
        const libraryId = collabspaceResponse.member?.find(
          (item) => item.title === collabSpace
        )?.id;

        console.log("[All Plant Service] Library id is:", libraryId);

        if (libraryId) {
          const libraryDataURL = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslib/dslib:Library/${libraryId}?$mask=dslib:ExpandClassifiableClassesMask`;

          const classResponse = await fetchData(libraryDataURL);

          const { member } = classResponse;

          if (member && member.length > 0) {
            console.log("[Library Data Service] Member found:", member);

            const factoriesData = member[0]?.ChildClasses;

            if (factoriesData?.member?.length > 0) {
              const plantsData = factoriesData.member[0].ChildClasses?.member;

              if (plantsData && plantsData.length > 0) {
                // Filter out duplicates based on `id` (or any unique property)
                const uniquePlantsData = plantsData.filter(
                  (plant) =>
                    !UserGroupClasses.some(
                      (userClass) => userClass.id === plant.id
                    )
                );

                // Add only unique items from plantsData to UserGroupClasses
                UserGroupClasses = [...UserGroupClasses, ...uniquePlantsData];
              }
            }
          }
        }
      } catch (error) {
        console.error("Error processing group:", collabSpace, error);
        throw error; // Throw the error to be handled by Promise.all
      }
    });

    await Promise.all(plantDataPromises); // Wait for all promises to resolve
    return UserGroupClasses; // Return the updated UserGroupClasses
  } catch (error) {
    console.error("[All Plant Service] Error occurred:", error);
    throw error; // Re-throw the error for upstream handling
  }
};
