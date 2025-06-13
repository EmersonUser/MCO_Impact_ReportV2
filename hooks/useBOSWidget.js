import { useDispatch } from "react-redux";

import {
  setParentDetailsLoading,
  setSpecDocument,
} from "../store/droppedObjectSlice";
import { MSG_FETCH_CSRF_HEADERS_FAILED } from "../utils/toastMessages";
import useToast from "./useToast";
import { fetchCsrfToken } from "../services/api/PlantAssignment/fetchCsrfService";
import { initWidget } from "../lib/widget";
import { callEnoviaWebService, loadWAFData, fetchData } from "../utils/helpers";

const useBOSWidget = () => {
  const { showErrorToast } = useToast();
  const dispatch = useDispatch();
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
  let email = window.widget.getValue("email");

  console.log("Email in useBOSWidget:", email);
  // console.log("Security context using preferences are", securitycontext);

  const handleBOSWidget = async (
    collabSpace,
    state,
    objectId,
    type,
    parentName,
    parentRevision
  ) => {
    try {
      console.log("Object id is:", objectId);
      console.log("Object type is:", type);
      dispatch(setParentDetailsLoading(true));

      const headers = await fetchCsrfToken();
      if (!headers) {
        showErrorToast(MSG_FETCH_CSRF_HEADERS_FAILED);
        return;
      }

      console.log("[useBOSWidget] CSRF Headers:", headers);

      // Step 1: Call Enovia Web Service
      let baseURL = `${ENOVIA_BASE_URL}/resources/v1/modeler/documents/parentId/${objectId}?parentRelName=SpecificationDocument`;

      let parentDirection = type === "Document" ? "to" : "from";

      let urlObjWAF = `${baseURL}&parentDirection=${parentDirection}`;
      let ChildObject = await callEnoviaWebService(
        "GET",
        urlObjWAF,
        "",
        headers
      );
      console.log("SpecDetails Response:", ChildObject);

      if (
        ChildObject &&
        ChildObject.status &&
        ChildObject.output.data.length > 0
      ) {
        let ChildObjectDocument = ChildObject.output.data.map((sSpec) => ({
          id: sSpec.id,
          title:
            sSpec.dataelements.title && sSpec.dataelements.title.trim() !== ""
              ? sSpec.dataelements.title
              : sSpec.dataelements.secondaryTitle,
          revision: sSpec.dataelements.revision,
          state: sSpec.dataelements.stateNLS,
          name: sSpec.dataelements.name,
        }));

        console.log(
          "[useBOSWidget] Extracted Spec Documents:",
          ChildObjectDocument
        );
        // if type is Document and then iterate ovet the
        if (type === "Document") {
          const revisionBody = {
            data: [],
          };
          ChildObjectDocument.forEach((child) => {
            const body = {
              id: child.id,
              identifier: child.id,
              type: "VPMReference",
              source: `${ENOVIA_BASE_URL}`,
              relativePath: `/resources/v1/modeler/dseng/dseng:EngItem/${child.id}`,
            };
            revisionBody.data.push(body);
          });
          const RevisionUrl = `${ENOVIA_BASE_URL}/resources/v1/modeler/dslc/version/getGraph`;
          const response = await callEnoviaWebService(
            "POST",
            RevisionUrl,
            revisionBody,
            headers
          );
          console.log("response is:", response);
          response.output.results.forEach((item) => {
            // Find the latest version based on the 'revision' key
            const latestVersion = item.versions.reduce((latest, current) => {
              return convertRevisionToNumber(current.revision) >
                convertRevisionToNumber(latest.revision)
                ? current
                : latest;
            });

            // Update 'isLatestRevision' for only the matching document
            ChildObjectDocument = ChildObjectDocument.map((doc) => {
              if (item.versions.some((version) => version.id === doc.id)) {
                return {
                  ...doc,
                  isLatestRevision:
                    doc.id === latestVersion.id ? "TRUE" : "FALSE",
                };
              }
              return doc;
            });
          });

          // Function to convert revision to a comparable numeric value
          function convertRevisionToNumber(rev) {
            if (/^\d+$/.test(rev)) return parseInt(rev, 10); // Handle numeric revisions (1,2,3)

            let number = 0;
            for (let i = 0; i < rev.length; i++) {
              number =
                number * 26 + (rev.charCodeAt(i) - "A".charCodeAt(0) + 1);
            }
            return number; // Handles A-Z, AA-ZZ revisions
          }

          console.log("ChildObjectDocument is:", ChildObjectDocument);
        }
        let requestBody;
        let getUrl;
        if (type === "Document") {
          getUrl =
            "https://saasimplementationserverdev.azurewebsites.net/bosAttribute/getLatestSpecItemDetails";
          requestBody = {
            SpecName: parentName, // Replace with actual SpecName if dynamic
            SpecRevision: parentRevision, // Replace with actual SpecRevision if dynamic
            Items: ChildObjectDocument.map((obj) => ({
              ItemName: obj.name, // Replace dynamically if needed
              ItemRevision: obj.revision,
            })),
          };
        } else {
          getUrl =
            "https://saasimplementationserverdev.azurewebsites.net/bosAttribute/getLatestItemSpecDetails";
          requestBody = {
            ItemName: parentName, // Replace with actual ItemName if dynamic
            ItemRevision: parentRevision, // Replace with actual revision if dynamic
            Specifications: ChildObjectDocument.map((obj) => ({
              SpecName: obj.name,
              SpecRevision: obj.revision,
            })),
          };
        }

        console.log("Requested Body is:", requestBody);

        const response = await fetchData("POST", getUrl, requestBody);

        console.log("the response from node API is:", response);

        let mergedData = [];
        if (response?.data?.data?.Specifications) {
          // **Case 1: API Response Contains "Specifications"**
          response.data.data.Specifications.forEach((spec) => {
            let matchingDoc = ChildObjectDocument.find(
              (obj) =>
                obj.name === spec.SpecName && obj.revision === spec.SpecRevision
            );

            mergedData.push({
              childState: matchingDoc?.state || "",
              childTitle: matchingDoc?.title || "",
              childLatest: matchingDoc?.isLatestRevision || "FALSE",
              childName: spec.SpecName,
              childRevision: spec.SpecRevision,
              PrintOnPurchaseOrderRequired: spec.PrintOnPurchaseOrderRequired,
              PrintOnWorkOrderRequired: spec.PrintOnWorkOrderRequired,
              WorkOrderDocumentRequired: spec.WorkOrderDocumentRequired,
              PrintOnReportOrderRequired: spec.PrintOnReportOrderRequired,
              "SAP/JDE": spec["SAP/JDE"],
            });
          });
        } else if (response?.data?.data?.Items) {
          // get all the id's

          // **Case 2: API Response Contains "Items"**
          response.data.data.Items.forEach((item) => {
            let matchingDoc = ChildObjectDocument.find(
              (doc) =>
                doc.name === item.ItemName && doc.revision === item.ItemRevision
            );

            mergedData.push({
              childState: matchingDoc?.state || "",
              childTitle: matchingDoc?.title || "",
              childName: item.ItemName,
              childRevision: item.ItemRevision,
              childLatest: matchingDoc?.isLatestRevision || "FALSE",
              PrintOnPurchaseOrderRequired: item.PrintOnPurchaseOrderRequired,
              PrintOnWorkOrderRequired: item.PrintOnWorkOrderRequired,
              WorkOrderDocumentRequired: item.WorkOrderDocumentRequired,
              PrintOnReportOrderRequired: item.PrintOnReportOrderRequired,
              "SAP/JDE": item["SAP/JDE"],
            });
          });
        } else {
          console.warn("[useBOSWidget] Unexpected API response format.");
        }
        console.log(
          "[useBOSWidget] Final Merged Data for Dispatch:",
          mergedData
        );

        dispatch(setSpecDocument(mergedData));
        // You can now dispatch or return this data as needed
      } else {
        console.warn("[useBOSWidget] No connected childs.");
        dispatch(setSpecDocument([]));
      }
    } catch (error) {
      console.error("[useBOSWidget] Error:", error);
      throw error; // Let the caller handle the error
    } finally {
      dispatch(setParentDetailsLoading(false)); // Ensure loading state is reset
    }
  };

  return { handleBOSWidget };
};

export default useBOSWidget;

// response.output.results.forEach((item) => {
//   // Find the latest version based on the 'revision' key
//   const latestVersion = item.versions.reduce((latest, current) => {
//     return convertRevisionToNumber(current.revision) > convertRevisionToNumber(latest.revision)
//       ? current
//       : latest;
//   });

//   // Update 'isLatestRevision' for each document
//   ChildObjectDocument = ChildObjectDocument.map((doc) => ({
//     ...doc,
//     isLatestRevision: doc.id === latestVersion.id ? "TRUE" : "FALSE",
//   }));
// });

// // Function to convert revision to a comparable numeric value
// function convertRevisionToNumber(rev) {
//   if (/^\d+$/.test(rev)) return parseInt(rev, 10); // Handle numeric revisions (1,2,3)

//   let number = 0;
//   for (let i = 0; i < rev.length; i++) {
//     number = number * 26 + (rev.charCodeAt(i) - "A".charCodeAt(0) + 1);
//   }
//   return number; // Handles A-Z, AA-ZZ revisions
// }
