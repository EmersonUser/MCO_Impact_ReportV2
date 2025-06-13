import React from "react";
import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store";
import { ToastContainer } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./styles/variables.css";
import MassUpload from "./pages/mass-upload/massUpload";

// This function mounts the React app.
let root = null; // Global React root
function start() {
  requirejs(["DS/PlatformAPI/PlatformAPI"], (PlatformAPI) => {
    window.PlatformAPI = PlatformAPI;
  });
  // console.log("[index.js] start() called. Mounting React app.");
  // Find the root element within the widget's body (if available)
  let rootElement =
    window.widget?.body?.querySelector("#root") ||
    document.getElementById("root");

  // If no root element exists, create one and append it to the widget body or document body.
  if (!rootElement) {
    rootElement = document.createElement("div");
    rootElement.id = "root";
    if (window.widget && window.widget.body) {
      window.widget.body.appendChild(rootElement);
      // console.log("[index.js] Root element appended to widget.body.");
    } else {
      document.body.appendChild(rootElement);
      // console.log("[index.js] Root element appended to document.body.");
    }
  } else {
    // console.log("[index.js] Root element found.");
  }

  if (!root) {
    // console.log("[index.js] Creating new React root.");
    root = ReactDOM.createRoot(rootElement);
  } else {
    // console.log("[index.js] Reusing existing React root.");
  }

  root.render(
    <Provider store={store}>
      <MassUpload />
      <ToastContainer />
    </Provider>

    //  <div>hi i am just a div {console.log("no worries")}</div>
  );
  // console.log("[index.js] React app rendered.");
}

export default function () {
  // console.log("[index.js] 🔍 Checking if widget is available...");

  if (window.widget) {
    // console.log("[index.js] ✅ Widget detected! Registering onLoad event...");

    let hasOnLoadRun = false; // Prevent duplicate execution

    window.widget.addEvent("onLoad", () => {
      if (hasOnLoadRun) {
        console.warn(
          "[index.js] ⏳ onLoad was already executed. Ignoring duplicate trigger."
        );
        return;
      }
      hasOnLoadRun = true;

      // console.log(
      //   "[index.js] ✅ First-time onLoad event fired. Initializing app..."
      // );

      start(); // This will initialize the React app
    });
  } else {
    console.error(
      "[index.js] ❌ Widget not detected! onLoad cannot be registered."
    );
  }
}

