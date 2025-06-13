import React from "react";
import ReactDOM from "react-dom/client";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { Provider } from "react-redux";
import store from "./store";
import { ToastContainer } from "react-toastify";
import RevisionFloat from "./pages/revisionFloat/revisionFloat";
// import { io } from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import "./styles/variables.css";
import WidgetLifecycle from "./WidgetLifecycle-munish";

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
      <WidgetLifecycle />
      <RevisionFloat />
      <ToastContainer />
    </Provider>

    //  <div>hi i am just a div {console.log("no worries")}</div>
  );
  // console.log("[index.js] React app rendered.");
}

// Function to inject the refresh listener script into the **parent window**
function injectRefreshListener() {
  console.log("🌍 [index.js] Injecting refresh listener into parent window...");

  const script = document.createElement("script");
  script.innerHTML = `
    document.addEventListener("DOMContentLoaded", function () {
      console.log("🌍 [Injected] Listening for manual refresh clicks...");

      document.body.addEventListener("click", function (event) {
        const refreshButton = document.querySelector("li#refresh"); // Select refresh button
        console.log("🔍 Checking refresh button:", refreshButton);

        if (refreshButton && refreshButton.contains(event.target)) {
          console.log("✅ [Injected] User clicked Refresh!");
          alert("🔄 Refresh button clicked!"); 
          sessionStorage.setItem("userClickedRefresh", "true");

          // ✅ Send message to iframe (React app)
          const iframe = document.querySelector("iframe"); // Select the iframe
          if (iframe) {
            iframe.contentWindow.postMessage({ type: "userClickedRefresh" }, "*");
            console.log("📩 [Injected] Sent refresh message to iframe.");
          }
        }
      });
    });
  `;

  // Inject script **into the parent window**
  if (window.parent && window.parent.document) {
    window.parent.document.body.appendChild(script);
    console.log("✅ [index.js] Script injected successfully into parent!");
  } else {
    console.warn("⚠️ [index.js] Unable to inject script—parent window not accessible.");
  }
}

// Inject the script **when the React app starts**
injectRefreshListener();


// ✅ Listen for "userClickedRefresh" message from the parent window
window.addEventListener("message", (event) => {
  console.log("📩 [index.js] Received a message event:", event);

  // Ensure message has valid structure
  if (!event.data || typeof event.data !== "object") {
    console.warn("⚠️ [index.js] Ignoring invalid message format:", event.data);
    return;
  }

  // ✅ Detect refresh click sent from parent
  if (event.data.type === "userClickedRefresh") {
    console.log("🚀 [index.js] User manually clicked refresh from parent!");
    sessionStorage.setItem("userClickedRefresh", "true");
  } else {
    console.log("⚠️ [index.js] Ignoring unrelated message event:", event.data);
  }
});


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
