import { MSG_FETCH_CSRF_HEADERS_FAILED } from "../../utils/toastMessages";
import useToast from "../useToast";
import { fetchCsrfToken } from "../../services/api/PlantAssignment/fetchCsrfService";
import { callEnoviaWebService } from "../../utils/helpers";
import { useEffect, useState } from "react";

const useFetchDocumentData = () => {
  const { showErrorToast } = useToast();
  const [documentData, setDocumentData] = useState(null);
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;
  const API_URL = `${ENOVIA_BASE_URL}/resources/v1/collabServices/authoring/createContent/typeInfo?tenant=OI000186152&xrequestedwith=xmlhttprequest`;

  const fetchDocumentData = async () => {
    try {
      console.log("Fetching document data from API...");

      // Get CSRF Headers
      const headers = await fetchCsrfToken();
      if (!headers) {
        console.error("Failed to fetch CSRF headers.");
        showErrorToast(MSG_FETCH_CSRF_HEADERS_FAILED);
        return;
      }
      console.log("CSRF Headers:", headers);
      const body = {"type":"Document","preferedType":"Document","typeName":"Document","subTypes":true,"runUXBL":true,"metrics":{"UXName":"New","client_app_domain":"3DEXPERIENCE 3DDashboard","client_app_name":"ENXWDOC_AP"}};
      // Fetch data from API
      const response = await callEnoviaWebService("POST", API_URL, body, headers);
      console.log("API Response for Document template:", response);

      // Validate response structure
      if (response.status !== true) {
        console.error("Invalid API response structure:", response);
        showErrorToast("Failed to fetch document data. Invalid response structure.");
        return;
      }

      // Extract relevant data
      const documentInfo = response.output.result[0];
      console.log("Extracted Document Info:", documentInfo);

      // Set the document data in state
      setDocumentData(documentInfo);
    } catch (error) {
      console.error("Error fetching document data:", error);
      showErrorToast(error.message || "Error fetching document data.");
    }
  };

  useEffect(() => {
    fetchDocumentData();
  }, []);

  return { documentData, refreshData: fetchDocumentData };
};

export default useFetchDocumentData;