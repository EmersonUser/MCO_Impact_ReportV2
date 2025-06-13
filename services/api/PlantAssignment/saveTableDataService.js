import axios from "axios";
import { fetchData, loadWAFData } from "../../../utils/helpers";
 
// Function to extract IDs from titles
const extractIdsFromTitles = (data, allPlants) => {
  console.log("Data Received for ID Extraction:", data);
  console.log("[PlantAssignment] All Plants Data:", allPlants);
 
  const newClasses = data
    .map((item) => {
      const itemTitle = item.title.replace(/\s+/g, "").replace(/plant/i, "");
 
      const matchedPlant = allPlants.find((plant) => {
        const plantTitle = plant.title
          .replace(/\s+/g, "")
          .replace(/plant/i, "");
        return plantTitle.toLowerCase() === itemTitle.toLowerCase();
      });
 
      return matchedPlant ? matchedPlant.id : null;
    })
    .filter((id) => id !== null);
  // Remove null values (non-matching titles)
 
  console.log("Extracted IDs (newClasses):", newClasses);
  return newClasses;
};
 
export const handleRemoveData = async (
  allPlants,
  removedTitles,
  productId,
  type
) => {
  console.log("allPlants", allPlants);
  console.log("removedTitles", removedTitles);
  const rowstoDelete = extractIdsFromTitles(removedTitles, allPlants);
  // console.log("newClasses handleRemoveData",newClasses);
 
  if (rowstoDelete.length > 0) {
    let declassifyUrl =
      "https://saasimplementationserverdev.azurewebsites.net/plantAssignment/declassifyProductToClass";
 
    let classifybody = {
      id: productId,
      type: type,
      classes: rowstoDelete,
    };
    const declassifyResponse = await fetchData(
       "POST",
      declassifyUrl,
      classifybody,
     
    );
    console.log("declassifyResponse:", JSON.stringify(declassifyResponse));
  }
};
 
// Updated handleAddData function
export const handleAddData = async (
  data,
  allPlants,
  objectId,
  type,
  proposedChanges,
  productChilds,
  hasMBOM
) => {
  console.log("Data Received for handleAddData:", data);
 
  // Step 1: Convert incoming data (titles) to class IDs
  const newClasses = extractIdsFromTitles(data, allPlants);
  console.log("newClasses before filtering:", newClasses);
  console.log("productChilds", productChilds);
 
  // Step 2: Filter productChilds that are released but not being modified
  const NotPropagableChilds = productChilds.filter((prodChild) => {
    if (prodChild.state.toLowerCase() === "released") {
      const change = proposedChanges.find(
        (change) =>
          change.identifier === prodChild.id &&
          change.action.toLowerCase() === "modify"
      );
      return !change;
    }
    return false;
  });
 
  console.log("NotPropagableChilds ARE:", NotPropagableChilds);
 
  // Step 3: Prepare Error Object
  const ErrorObject = [];
 
  newClasses.forEach((classId) => {
    const missingIn = NotPropagableChilds.filter(
      (child) => !child.classes.includes(classId)
    )
      .map((child) => child.name)
      .join(", ");
 
    if (missingIn !== "" && missingIn !== "Undefined") {
      ErrorObject.push({ ClassID: classId, Childs: missingIn });
    }
  });
  console.log("error object savetable", ErrorObject);
 
  // Step 4: Generate Final Messages
  let Finalmessage = "";
  ErrorObject.forEach((item) => {
    const classTitle = allPlants.find(
      (plant) => plant.id === item.ClassID
    )?.title;
    const message = `Unable to classify product in ${classTitle} due to unclassified child items: ${item.Childs}`;
    Finalmessage += `${message}\n`;
  });
 
  console.log("Final Message:\n", Finalmessage);
 
  // Step 5: Filter out newClasses that are present in ErrorObject
  const filteredNewClasses = newClasses.filter(
    (id) => !ErrorObject.some((item) => item.ClassID === id)
  );
  console.log(
    "Filtered New Classes (excluding errored ones):",
    filteredNewClasses
  );
 
  // Make the API call if newClasses is not empty
  if (filteredNewClasses.length > 0) {
    const classifyUrl =
      "https://saasimplementationserverdev.azurewebsites.net/plantAssignment/classifyProductToClass";
 
    const classifybody = {
      id: objectId, // Use objectId from Redux
      type: type, // Use type from Redux
      classes: filteredNewClasses,
      mode: "classifyParent",
    };
 
    console.log("Classify API Body:", classifybody);
 
    try {
      const classifyResponse = await fetchData(
        "POST",
        classifyUrl,
        classifybody,
       
      );
      console.log("Classify Response:", JSON.stringify(classifyResponse));
    } catch (error) {
      console.error("Error in Classify API Call:", error);
    }
  }

  if (
    filteredNewClasses.length > 0 &&
    productChilds.length > 0 &&
    type === "VPMReference" &&
    hasMBOM
  ) {
    let classifyUrl =
      "https://saasimplementationserverdev.azurewebsites.net/plantAssignment/classifyProductToClass";

    let classifybody = {
      id: objectId,
      type: type,
      classes: filteredNewClasses,
      childs: productChilds,
      mode: "classifychilds",
    };
    const childclassifyResponse = await fetchData(
       "POST",
      classifyUrl,
      classifybody,
     
    );
    console.log(
      "child classifyResponse:",
      JSON.stringify(childclassifyResponse)
    );
  }
 
  return {
    success: true,
    message: "Data saved successfully",
    ErrorObject: ErrorObject,
    Finalmessage: Finalmessage,
  };
};
 
export const saveData = async (
  updatedItems,
  classesToBeClassified,
  initialAssignedClasses,
  headers,
  productId,
  AllClasses,
  productChilds,
  type,
  rowstoDelete,
  finalArray,
  proposedChanges
) => {
  try {
    const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
    console.log("[Save Data] Starting data saving process...");
    console.log("Type in Save Table Data:", type);
    console.log("Final aRRAY IS inside Save:", finalArray);
    console.log("Proposed Changes in Save", proposedChanges);
    const classifiedClasses = [...classesToBeClassified];
    const WAFData = await loadWAFData();
    const fetchOOTBData = async (url, body, method) => {
      console.log("Fetching URL:", url);
      console.log("Request Body:", JSON.stringify(body, null, 2));
 
      return new Promise((resolve, reject) => {
        WAFData.authenticatedRequest(url, {
          method,
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          data: JSON.stringify(body),
          type: "json",
          onComplete: (response) => {
            console.log("Response received:", response);
            resolve(response);
          },
          onFailure: (error) => {
            console.error("Request failed:", error);
            reject(error);
          },
        });
      });
    };
 
 
 
    // released childs but not present in CA Proposed Changes
    let NotPropagableChilds = productChilds.filter((prodChild) => {
      console.log("Processing prodChild:", prodChild);
      if (prodChild.state.toLowerCase() === "released") {
        console.log("Released prodChild:", prodChild);
        const change = proposedChanges.find(
          (change) =>
            change.identifier === prodChild.id &&
            change.action.toLowerCase() === "modify"
        );
        console.log("Matching change for prodChild:", change);
        return !change;
      }
      console.log("prodChild state is not 'released':", prodChild.state);
      return false;
    });
    console.log("NotPropagableChilds ARE :", NotPropagableChilds);
 
    let ErrorObj = [];
    finalArray.forEach((classItem) => {
      //if (classItem.Type === "New" || classItem.Type === "Update" ) {
      if (classItem.MBOMValue) {
        let prodchilds = [];
        NotPropagableChilds.forEach((notPropagableChild) => {
          if (!notPropagableChild.classes.includes(classItem.id)) {
            prodchilds.push({
              childId: notPropagableChild.id,
              childName: notPropagableChild.name,
            });
          }
        });
        if (prodchilds.length > 0) {
          ErrorObj.push({
            id: classItem.id,
            title: classItem.title,
            childs: prodchilds,
            type: classItem.Type,
          });
        }
      }
    });
    let Finalmessage = "";
    console.log("ErrorObj IS", ErrorObj);
    ErrorObj.forEach((item) => {
      let message = "";
 
      // Check if item.childs is an array and contains valid objects with titles
      if (
        Array.isArray(item.childs) &&
        item.childs.every((child) => child.childName)
      ) {
        const childTitles = item.childs
          .map((child) => child.childName)
          .join(", ");
        console.log("Chilld Titles are", childTitles);
        if (item.type.toLowerCase() !== "new") {
          message = `${item.title} MBOM can't be Make due to unclassified child items: ${childTitles}`;
        } else {
          message = `Unable to classify product ${item.title} due to unclassified child items: ${childTitles}`;
        }
        console.log("Message is:", message);
      } else {
        // Handle case where childs is invalid or missing titles
        message = `Invalid child data for ${item.title}.`;
      }
 
      //  item.message = message;
      Finalmessage += `${message}\n`; // Using '\n' to separate each message with a new line
    });
    console.log(ErrorObj);
    console.log("Concatenated Messages:\n", Finalmessage);
 
    let newClasses = finalArray
      .filter(
        (classItem) =>
          classItem.Type.toLowerCase() === "new" &&
          !ErrorObj.some((errorItem) => errorItem.id === classItem.id)
      )
      .map((classItem) => classItem.id);
    console.log("New Classes are:", newClasses);
    let updateBody = {};
    finalArray.forEach((classItem) => {
      const isIdNotInErrorObj = !ErrorObj.some(
        (errorItem) => errorItem.id === classItem.id
      );
      if (
        isIdNotInErrorObj &&
        (classItem.Type.toLowerCase() === "update" ||
          (classItem.Type.toLowerCase() === "new" && classItem.MBOMValue))
      ) {
        updateBody[classItem.MBOMName] = classItem.MBOMValue;
      }
    });
    console.log("Update body is:", updateBody);
 
    let propagateClasses = finalArray
      .filter(
        (classItem) =>
          classItem.MBOMValue &&
          !ErrorObj.some((errorItem) => errorItem.id === classItem.id)
      )
      .map((classItem) => classItem.id);
 
    console.log("Propogateable classes are", propagateClasses);
 
    if (newClasses.length > 0) {
      let classifyUrl =
        "https://saasimplementationserverdev.azurewebsites.net/plantAssignment/classifyProductToClass";
      let classifybody = {
        id: productId,
        type: type,
        classes: newClasses,
        mode: "classifyParent",
      };
      const classifyResponse = await fetchData(
        "POST",
        classifyUrl,
        classifybody,
       
      );
      console.log("classifyResponse:", JSON.stringify(classifyResponse));
    }
 
    if (Object.keys(updateBody).length > 0) {
      const nextApiUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslib/dslib:ClassifiedItem/${productId}`;
      const response = await fetchOOTBData(nextApiUrl, "", "GET");
      console.log("CStamp Response:", response);
      let cestamp = response.member[0]?.cestamp || "";
      updateBody["cestamp"] = cestamp;
 
      const patchUrl = `https://saasimplementationserverdev.azurewebsites.net/plantAssignment/updateClassificationAttribute?id=${productId}`;
      await fetchData("PATCH",patchUrl, updateBody, );
      console.log("Updated database successfully.");
    }
 
    if (
      propagateClasses.length > 0 &&
      productChilds.length > 0 &&
      type === "VPMReference"
    ) {
      let classifyUrl =
        "https://saasimplementationserverdev.azurewebsites.net/plantAssignment/classifyProductToClass";
 
      let classifybody = {
        id: productId,
        type: type,
        classes: propagateClasses,
        childs: productChilds,
        mode: "classifychilds",
      };
      const childclassifyResponse = await fetchData(
         "POST",
        classifyUrl,
        classifybody,
       
      );
      console.log(
        "child classifyResponse:",
        JSON.stringify(childclassifyResponse)
      );
    }
    if (rowstoDelete.length > 0) {
      let declassifyUrl =
        "https://saasimplementationserverdev.azurewebsites.net/plantAssignment/declassifyProductToClass";
 
      let classifybody = {
        id: productId,
        type: type,
        classes: rowstoDelete,
      };
      const declassifyResponse = await fetchData(
        "POST",
        declassifyUrl,
        classifybody,
       
      );
      console.log("declassifyResponse:", JSON.stringify(declassifyResponse));
    }
 
    console.log("All classification API calls completed successfully.");
 
    return {
      success: true,
      message: "Data saved successfully",
      ErrorObj: ErrorObj,
      Finalmessage: Finalmessage,
    };
  } catch (error) {
    console.error("Error occurred:", error);
    return { success: false, message: "Failed to save data", error };
  }
};