import { SecurityContext } from "../services/api/droppableService";
import { initWidget } from "./widget";

const widgetEntry = process.env.WIDGET_ENTRY || "revisionFloat"; // Default to revisionFloat
const response = await SecurityContext();
const securitycontext = response.securitycontextpreference;
const email = response.email;

initWidget(
  (widget) => {
    widget.setTitle("");
    // Add Security Context Preference (UI for SecurityContext)
    widget.addPreference(securitycontext);
    // Optionally log all current preferences (if accessible)
    if (widget.preferences) {
      console.log(
        "[widget-starter] Current widget preferences:",
        widget.preferences
      );
    }
    // Dynamically load widget index based on widgetEntry
    if (widgetEntry === "plantAssignment") {
      widget.setValue("email", email);
      import("../pages/plantAssignment/plantIndex")
        .then((module) => {
          module.default();
        })
        .catch((error) => {
          console.error(
            "[widget-starter] Error dynamically importing plantIndex",
            error
          );
          widget.body.innerHTML =
            "<div style='color: red;'>Error loading widget content.</div>";
        });
    } else if (widgetEntry === "massUpload") {
      // Define email preference with a unique key and proper default value (Boolean for checkbox)
      // Only for massUpload add the email preference
      const emailPreference = {
        name: "Email Notification", // Title or internal name
        type: "boolean", // Checkbox type
        label: "Email Notification", // Label on preference UI
        defaultValue: false, // Default unchecked
      };
      widget.addPreference(emailPreference);
      widget.setValue("email", email);
      import("../massuUploadIndex")
        .then((module) => {
          module.default();
        })
        .catch((error) => {
          console.error(
            "[widget-starter] Error dynamically importing massuUploadIndex",
            error
          );
          widget.body.innerHTML =
            "<div style='color: red;'>Error loading widget content.</div>";
        });
    } else if (widgetEntry === "bosAttribute") {
      widget.setValue("email", email);
      import("../pages/BOSWidget/bosIndex")
        .then((module) => {
          module.default();
        })
        .catch((error) => {
          console.error(
            "[widget-starter] Error dynamically importing plantIndex",
            error
          );
          widget.body.innerHTML =
            "<div style='color: red;'>Error loading widget content.</div>";
        });
    }else if (widgetEntry === "mcoimpactreport") {
      widget.setValue("email", email);
      import("../pages/MCOImpactReport/MBOMImpactReportIndex")
        .then((module) => {
          module.default();
        })
        .catch((error) => {
          console.error(
            "[widget-starter] Error dynamically importing plantIndex",
            error
          );
          widget.body.innerHTML =
            "<div style='color: red;'>Error loading widget content.</div>";
        });
    } else {
      widget.setValue("email", email);
      import("../index")
        .then((module) => {
          module.default();
        })
        .catch((error) => {
          console.error(
            "[widget-starter] Error dynamically importing index",
            error
          );
          widget.body.innerHTML =
            "<div style='color: red;'>Error loading widget content.</div>";
        });
    }
  },
  (error) => {
    console.error("[widget-starter] initWidget encountered an error:", error);
  }
);
