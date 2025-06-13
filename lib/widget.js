
const Widget = function () {
  const events = {};
  let title = "";

  const widgetUrl = window.location.href;

  const prefs = (() => {
    let prefsLocal = localStorage.getItem("_prefs_4_Widget_");
    if (prefsLocal) {
      try {
        prefsLocal = JSON.parse(prefsLocal);
      } catch {
        prefsLocal = {};
        localStorage.setItem("_prefs_4_Widget_", JSON.stringify(prefsLocal));
      }
    } else {
      prefsLocal = {};
      localStorage.setItem("_prefs_4_Widget_", JSON.stringify(prefsLocal));
    }
    return prefsLocal;
  })();

  const _savePrefsLocalStorage = () => {
    localStorage.setItem("_prefs_4_Widget_", JSON.stringify(prefs));
  };

//   this.uwaUrl = "./";

  this.addEvent = (event, callback) => {
    events[event] = callback;
    if (event === "onLoad") {
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", callback);
      } else {
        callback();
      }
    }
  };

  this.addPreference = (pref) => {
    pref.value = pref.defaultValue;
    prefs[pref.name] = pref;
    _savePrefsLocalStorage();
  };

  this.getPreference = (prefName) => {
    return prefs[prefName];
  };

  this.getUrl = () => {
    return widgetUrl;
  };
  this.getValue = (prefName) => {
    return prefs[prefName] === undefined ? undefined : prefs[prefName].value;
  };

  this.setValue = (prefName, value) => {
    prefs[prefName].value = value;
    _savePrefsLocalStorage();
  };

  this.setIcon = (icon) => {};
  this.setTitle = (t) => {
    title = t;
    document.title = title;
  };
  this.dispatchEvent = (...args) => {};
};

const UWA = function () {
  this.log = (args) => {
    /* eslint no-console:off */
  };
};

const initRequireModules = function () {
  define("DS/TagNavigatorProxy/TagNavigatorProxy", [], () => {
    const TagNavigatorProxy = function () {
      this.createProxy = () => {
        return {
          addEvent: (name, event) => {},
          setSubjectsTags: (subject) => {},
        };
      };
    };
    return new TagNavigatorProxy();
  });
  define("DS/PlatformAPI/PlatformAPI", [], () => {
    const PlatformAPI = function () {
      this.getUser = () => {
        return {};
      };
      this.subscribe = (topic, callback) => {
        return { topic, callback };
      };
    };
    return new PlatformAPI();
  });
};


export function initWidget(cbOk, cbError) {
  // console.log("[initWidget] Called.");
  const waitFor = function (whatToWait, maxTry, then) {
    // console.log(`[initWidget] waitFor: Checking for ${whatToWait}, maxTry remaining: ${maxTry}`);
    if (typeof window[whatToWait] !== "undefined") {
      // console.log(`[initWidget] ${whatToWait} is defined.`);
      then();
    } else if (maxTry === 0) {
      document.body.innerHTML =
        "Error while trying to load widget. See console for details";
        console.error(`[initWidget] ${whatToWait} didn't load after maximum tries.`);
      throw new Error(`${whatToWait} didn't load`);
    } else {
      setTimeout(waitFor, 200, whatToWait, --maxTry, then);
    }
  };

  const loadRequire = () => {
    // console.log("[initWidget] loadRequire called. Loading assets/lib/require.js");
    return new Promise((resolve, reject) => {
      const oReq = new XMLHttpRequest();
      oReq.addEventListener("load", (resp) => {
        // console.log("[initWidget] require.js loaded successfully.");
        const script = document.createElement("script"); // Make a script DOM node
        script.innerHTML = resp.target.response; // Set it's src to the provided URL
        document.head.appendChild(script);
        // console.log("[initWidget] Script element appended to head.");
        resolve();
      });
      try {
        oReq.open("GET", "assets/lib/require.js");
        oReq.send();
        // console.log("[initWidget] XMLHttpRequest sent for require.js");
      } catch (err) {
        console.error("[initWidget] Error sending XMLHttpRequest for require.js", err);
        reject(err);
      }
    });
  };
  const updatePublicPath = () => {
    __webpack_public_path__ = widget.uwaUrl.substring(
      0,
      widget.uwaUrl.lastIndexOf("/") + 1
    );
  };

  if (window.widget) {
    // console.log("[initWidget] window.widget exists. Updating public path and calling cbOk.");
    updatePublicPath();
    cbOk(widget);
  } else if (!window.UWA) {
    // console.log("[initWidget] window.widget not found and UWA is undefined. Creating new instances.");
    // outside of 3DDashboard
    window.widget = new Widget();
    window.UWA = new UWA();
    loadRequire().then(() => {
      initRequireModules();
    });
    waitFor("requirejs", 10, () => {
      // console.log("[initWidget] After waiting, calling cbOk with new widget.");
      cbOk(window.widget);
    });
  } else {
    // console.log("[initWidget] window.widget not found but UWA exists. Waiting for widget injection.");
    // in 3DDashboard
    try {
      // sometime (actually, often), dashboard takes time to inject widget object
      waitFor(
        "widget",
        10,
        // finally, ...starts
        () => {
          updatePublicPath();
          // console.log("[initWidget] Widget found after waiting. Calling cbOk.");
          cbOk(widget);
        }
      );
    } catch (error) {
      console.error(error);
      cbError(error);
    }
  }
}