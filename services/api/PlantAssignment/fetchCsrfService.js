import { loadWAFData } from "../../../utils/helpers";

export const fetchCsrfToken = async () => {
  try {
    let securityContext1 = window.widget.getValue("Credentials");
    const WAFData = await loadWAFData();
    console.log("Security Context is:", securityContext1);
    const csrfURL = process.env.REACT_APP_CSRF_URL;

    const response = await new Promise((resolve, reject) => {
      WAFData.authenticatedRequest(csrfURL, {
        method: "GET",
        type: "json",
        onComplete: resolve,
        onFailure: reject,
      });
    });

    const csrfToken = response.csrf.name;
    const csrfValue = response.csrf.value;
    const securityContextHeader = "SecurityContext";
    const securityContextValue = securityContext1;

    const headers = {
      [csrfToken]: csrfValue,
      [securityContextHeader]: securityContextValue,
    };
    return headers;
  } catch (error) {
    console.error("[CSRF] Failed to fetch token:", error);
    return; // Return empth so that the else block should execute.
  }
};
