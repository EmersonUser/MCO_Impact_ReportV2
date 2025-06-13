import { loadWAFData } from "../../../utils/helpers";
import { SearchCA } from "./searchCAService";
import {GetFlowDownCADetails} from "./getRouteDetails";

export const fetchAssignedPlants = async (
  allPlants,
  headers,
  objectId // ProductId
) => {
  try {
    const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
    console.log("[Assigned Plant Service] Plant Members:", allPlants);

    const libraryDataURL = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslib/dslib:ClassifiedItem/${objectId}?$mask=dslib:ClassificationAttributesMask`;

    const WAFData = await loadWAFData();

    const response = await new Promise((resolve, reject) => {
      WAFData.authenticatedRequest(libraryDataURL, {
        method: "GET",
        headers,
        type: "json",
        onComplete: resolve,
        onFailure: reject,
      });
    });

    console.log("[Assigned Plant Service] Data received:", response);

    let initialAssignedClasses = [];
    let uniqueInAllclasses = [];

    // Getting ClassMembers
    let ClassExtensions = response.member[0].ClassificationAttributes.member;

    // Process ClassExtensions and wait for promises to resolve
    await Promise.all(
      ClassExtensions.map(async (classItem) => {
        console.log("Class Item is ", classItem);
        for (let parentClass of allPlants) {
          if (classItem.ClassID === parentClass.id) {
            let PlantName = parentClass.title;
            PlantName = PlantName.replace("Plant", "").replace(/\s+/g, "");
            let obj = { id: classItem.ClassID, title: parentClass.title };

            const promiseArray = classItem.Attributes.map((eachAttribute) => {
              if (
                eachAttribute.name.includes("FlowDownCA") &&
                eachAttribute.value
              ) {
                return GetFlowDownCADetails(eachAttribute.value, headers).then(
                  (flowDownCADetails) => {
                    if (flowDownCADetails) {
                      console.log(flowDownCADetails);
                      obj["MFGChange"] = flowDownCADetails?.MCOTitle;
                      obj["MFGStatus"] = flowDownCADetails?.MCOState;

                      let CATitle = "",
                        CAState = "";

                      flowDownCADetails.CAAtt.forEach((CA) => {
                        CATitle += "," + CA.CATitle;
                        CAState += "," + CA.CAState;
                      });

                      obj["Change"] = CATitle.slice(1); // Remove leading comma
                      obj["ChangeStatus"] = CAState.slice(1); // Remove leading comma
                    }
                  }
                );
              } else {
                // Handle non-async attributes
                obj[eachAttribute.name.replace(PlantName, "").trim()] =
                  eachAttribute.value;
                return Promise.resolve(); // Create a resolved Promise for consistency
              }
            });

            // Wait for all promises to complete
            await Promise.all(promiseArray);
            initialAssignedClasses = [...initialAssignedClasses, obj];
            console.log("Initial Assigned Classes", initialAssignedClasses);
            console.log("Processed Object:", obj);
          }
        }
      })
    );

    console.log(
      "[Assigned Plant Service] Initial Assigned Classes:",
      initialAssignedClasses
    );
    uniqueInAllclasses = allPlants.filter(
      (allClass) =>
        !initialAssignedClasses.some((assigned) => assigned.id === allClass.id)
    );
    console.log("uniqueInAllclasses--:", uniqueInAllclasses);

    // Dispatch only after the classes are fully populated

    return {
      success: true,
      data: {
        plantData: {
          allPlants: allPlants,
          initialAssignedPlants: initialAssignedClasses,
          uniquePlants: uniqueInAllclasses,
        },
      },
    };
  } catch (error) {
    console.error("[Object Details] Failed to fetch data:", error);
    return { success: false, error };
  }
};
