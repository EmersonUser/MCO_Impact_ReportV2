import useToast from "../hooks/useToast";

import api from "../utils/api"; // Import axios instance
import { MSG_REPLACE_SUCCESS, MSG_REPLACE_ERROR } from "../utils/toastMessages";

const useRevisions = () => {
  const { showSuccessToast, showErrorToast } = useToast();

  const fetchRevisionsAndParents = async (
    objectId,
    objectType,
    relativePath
  ) => {
    if (!relativePath) {
      console.error("[Fetch Revisions] ❌ Missing relative path.");
      return;
    }

    const parentURL = `/revFloat/getParents`;

    try {
      // Use the axios instance to make the POST request
      const response = await api.post(parentURL, {
        data: {
          id: objectId,
          type: objectType,
          relativePath: relativePath,
        },
      });

      if (response.status === 200) {
        const parentDetails = response.data;

        // 🚀 Return data instead of dispatching
        return parentDetails;
      } else {
        throw new Error(
          `[Fetch Revisions] HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("[Fetch Revisions] ❌ Error occurred:", error);
      return null; // Ensure it returns null on error
    }
  };

  const replaceRevisions = async (selectedParents, droppedData, userEmail) => {
    const parentURL = `/revFloat/floatRevisions`; // Use relative path for axios

    try {
      // Make the POST request to the replacement API
      const response = await api.post(parentURL, {
        SelectedParents: selectedParents,
        DroppedData: droppedData,
        userEmail: userEmail,
      });

      if (response.status === 200) {
        // Handle successful replacement
        console.log("Replacement successful:", response.data);
        showSuccessToast(MSG_REPLACE_SUCCESS); // Show success toast
        // You might want to update the Redux store or refetch data here
        return { success: true };
      } else {
        throw new Error(
          `[Replacement API] HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error during replacement:", error);
      showErrorToast(MSG_REPLACE_ERROR); // Show error toast
      return { success: false, error: error.message };
    }
  };

  return { fetchRevisionsAndParents, replaceRevisions };
};

export default useRevisions;
