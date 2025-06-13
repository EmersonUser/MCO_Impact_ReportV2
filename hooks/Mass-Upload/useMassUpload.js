import { MSG_FETCH_CSRF_HEADERS_FAILED } from "../../utils/toastMessages";
import useToast from "../useToast";
import { fetchCsrfToken } from "../../services/api/PlantAssignment/fetchCsrfService";
import { callEnoviaWebService, fetchData } from "../../utils/helpers";
import { useEffect, useState } from "react";

const useMassUpload = () => {
  const { showErrorToast } = useToast();
  const [mappedAttributes, setMappedAttributes] = useState([]);
  const ENOVIA_BASE_URL = process.env.REACT_APP_ENOVIA_BASE_URL;

  // Function to Fetch Spreadsheet Column Mapping
  const fetchColumnMapping = async () => {
    try {
      console.log("Fetching column mapping...");

      // Get CSRF Headers
      const headers = await fetchCsrfToken();
      if (!headers) {
        showErrorToast(MSG_FETCH_CSRF_HEADERS_FAILED);
        return;
      }

      // 🔹 Step 1: Call API 1 (GET) to Fetch Metadata
      const metadataResponse = await callEnoviaWebService(
        "GET",
        `${ENOVIA_BASE_URL}/resources/v1/modeler/dseng/dseng:EngItem/search?%24top=1`,
        "",
        headers
      );

      if (!metadataResponse || !metadataResponse.output) {
        throw new Error("Failed to fetch metadata.");
      }
      console.log("Metadata Member:", metadataResponse.output.member);

      const objectId = metadataResponse.output?.member?.[0]?.id;
      if (!objectId) {
        throw new Error("No object ID found in metadata.");
      }

      console.log("Extracted Object ID:", objectId);

      // 🔹 Step 2: Call API 2 (POST) to Fetch Attributes
      const attributeResponse = await callEnoviaWebService(
        "POST",
        `${ENOVIA_BASE_URL}/resources/v1/collabServices/attributes/op/read?tenant=OI000186152&xrequestedwith=xmlhttprequest`,
        {
          busIDs: [objectId],
        },
        headers
      );

      if (!attributeResponse || !attributeResponse.output) {
        throw new Error("Failed to fetch attribute data.");
      }
      console.log("Attribute Response:", attributeResponse.output);

      // 🔹 Step 3: Extract & Map Relevant Attributes

      const groupData = attributeResponse.output.results?.[0]?.groupData || [];

      console.log(
        "Full Group Data (with all NLS values):",
        groupData.map((item) => item.nls)
      );

      /// Extract attribute groups
      // const attributeGroups = [
      //   ...new Set(groupData.map((item) => item.groupNLS)),
      // ];
      // console.log("Attribute Groups:", attributeGroups);

      const systemAttributes = [
        {
          name: "description", // Change from backendName to name
          nls: "Description",
          groupNLS: "System Attributes",
        },
        {
          name: "Part Number", // Change from backendName to name
          nls: "EIN Number",
          groupNLS: "System Attributes",
        },
        {
          name: "type", // Change from backendName to name
          nls: "Type",
          groupNLS: "System Attributes",
        },
        {
          name: "title", // Change from backendName to name
          nls: "Title",
          groupNLS: "System Attributes",
        },
        {
          name: "collabspaceTitle", // Change from backendName to name
          nls: "Collaborative Space",
          groupNLS: "System Attributes",
        },
      ];

      const attributeGroups = groupData.map((item) => item.groupNLS);
      console.log("Attribute Groups:", attributeGroups);

      // Get NLS values from API response
      const apiNlsValues = groupData.map((item) => item.nls);
      console.log("API NLS Values:", apiNlsValues);

      // Get NLS values from hardcoded system attributes
      const systemNlsValues = systemAttributes.map((item) => item.nls);
      console.log("System NLS Values:", systemNlsValues);

      const allNLSValues = [...new Set([...apiNlsValues, ...systemNlsValues])];
      console.log("all nls value with Hardcode :", allNLSValues);

      // First filter out System Attributes from API response
      const filteredGroupData = groupData.filter(
        (attr) => attr.groupNLS !== "System Attributes"
      );

      console.log(
        "Filtered out API system attributes:",
        groupData.length - filteredGroupData.length,
        "items removed"
      );

      // Then merge only non-system API attributes with your hardcoded ones
      const mergeAttributes = [...filteredGroupData, ...systemAttributes];

      // Then continue with your other filtering if needed
      const relevantAttributes =
        mergeAttributes.filter(
          (attr) =>
            attr.deploymentExtension === true ||
            (attr.groupNLS && attr.groupNLS.trim() !== "")
        ) || [];

      console.log("Non-system attributes from API:", relevantAttributes.length);

      const mappedData = relevantAttributes.map((attr) => ({
        uiLabel: attr.nls, // UI Display Name
        backendName: attr.name || attr.backendName, // Backend Name (or name)
        group: attr.groupNLS || "General", // Default group if not specified
      }));

      // Create a filtered version for dropdown that excludes System Attributes
      const dropdownOptions = mappedData.filter(
        (attr) => attr.group !== "System Attributes"
      );
      console.log("Mapped Attributes (total):", mappedData);
      console.log(
        "Dropdown Options (excluding System Attributes):",
        dropdownOptions
      );
      // Organize attributes by their groups
      const attributesByGroup = {};

      attributeGroups.forEach((group) => {
        attributesByGroup[group] = mappedData.filter(
          (attr) => attr.group === group
        );
      });

      console.log("Mapped Attributes:", mappedData);
      console.log("All available NLS values:", allNLSValues);
      console.log(
        "Mapped Attributes (for dropdown) excluding System Attributes:",
        dropdownOptions
      );
      console.log("Attributes By Group:", attributesByGroup);
      console.log(
        "System Attributes found:",
        relevantAttributes.filter(
          (attr) => attr.groupNLS === "System Attributes"
        ).length
      );
      console.log(
        "Sample System Attribute:",
        relevantAttributes.find((attr) => attr.groupNLS === "System Attributes")
      );

      setMappedAttributes({
        allNLSValues: allNLSValues,
        dropdownOptions: dropdownOptions, // Use filtered list without System Attributes
        mappedData: mappedData, // Keep full list for other purposes
        attributesByGroup: attributesByGroup,
        groups: attributeGroups,
      });
    } catch (error) {
      console.error("Error fetching column mapping:", error);
      showErrorToast(error.message || "Error fetching column mapping.");
    }
  };

  useEffect(() => {
    fetchColumnMapping();
  }, []);

  return { mappedAttributes, refreshMapping: fetchColumnMapping };
};

export default useMassUpload;
