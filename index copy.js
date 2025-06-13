import React from "react";
import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { initWidget } from "./lib/widget";
import { Provider } from "react-redux";
import store from "./store";
import { refreshWidgetData } from "./services/api/refreshService";
import useDroppableArea from "./hooks/useDroppableArea";
import { ToastContainer } from "react-toastify";
import useToast from "./hooks/useToast";
import { MSG_REFRESH_SUCCESS } from "./utils/toastMessages";
import { SecurityContext } from "./services/api/droppableService";
import RevisionFloat from "./pages/revisionFloat/revisionFloat";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './styles/variables.css';

// Dynamically set Webpack's public path if `widget` is available
if (window.widget && window.widget.uwaUrl) {
  const path = window.widget.uwaUrl.substring(
    0,
    window.widget.uwaUrl.lastIndexOf("/") + 1
  );
  if (path) {
    __webpack_public_path__ = path;
  } else {
    console.error("Invalid uwaUrl format:", window.widget.uwaUrl);
  }
} else {
  console.error("uwaUrl is missing. Using default './' as public path.");
  __webpack_public_path__ = "./";
}
let root; // Declare a global variable for the React root
let isOnRefreshRegistered = false;
function start(widget) {
  const widgetId = widget.id;
  console.log("widgetId", widgetId);
  let rootElement =
    window.widget?.body?.querySelector("#root") ||
    document.getElementById("root");
  if (!rootElement) {
    console.warn("Root element not found. Creating dynamically...");
    if (window.widget && window.widget.body) {
      // Use widget's body if available
      rootElement = document.createElement("div");
      rootElement.id = "root";
      widget.body.appendChild(rootElement);
    } else {
      // Fallback to document body
      rootElement = document.createElement("div");
      rootElement.id = "root";
      document.body.appendChild(rootElement);
    }
  }
  if (!root) {
    root = ReactDOM.createRoot(rootElement);
  } else {
  }
 
  root.render(
    <Provider store={store}>
      <RevisionFloat />
      {/* Pass setter to App */}
      <ToastContainer />
    </Provider>
  );
}

export async function initializeWidget() {
  const response = await SecurityContext();
  const securitycontext = response.securitycontextpreference;
  const email = response.email;

  initWidget(
    (widget) => {
      widget.setTitle(""); 
      widget.addPreference(securitycontext);
      widget.setValue("email", email);
      widget.addEvent("onLoad", () => {        
        start();
      });
      if (!isOnRefreshRegistered) {
        widget.addEvent("onRefresh", async () => {
          const { showSuccessToast, showErrorToast } = useToast();
          const { handleDrop } = useDroppableArea();
          const droppedObjectData =
            store.getState()?.droppedObject?.droppedObjectData;
          const droppedData = droppedObjectData.initialDraggedData;
          console.log("[onRefresh] droppedData:", droppedData);
          if (
            droppedData &&
            droppedData.data.items[0].objectId &&
            droppedData.data.items[0].objectType &&
            typeof handleDrop === "function"
          ) {
            try {
              const dataItems = droppedData.data.items;
              await refreshWidgetData(dataItems, handleDrop);
              
              showSuccessToast(MSG_REFRESH_SUCCESS); // Show success toast after refresh
            } catch (error) {
              console.error("Error during refresh:", error);
              showErrorToast("An error occurred during refresh."); // Show error toast
            }
          } else {
            console.error(
              "[onRefresh] handleDrop is not defined or not a function."
            );
          }
        });
        isOnRefreshRegistered = true; // Prevent duplicate listeners
      }
    },
    (error) => {
      console.error("Widget initialization failed:", error);
    }
  );
}

// Dynamically import setupMocks.js in development mode
if (process.env.NODE_ENV === "development") {
  require("./setupMocks");
  initializeWidget();
} else {
  // Dynamically wait for WidgetContainer's handleDrop in production
  initializeWidget();
}
