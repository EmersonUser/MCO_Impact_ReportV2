export const refreshWidgetData = async (dataItems, handleDrop) => {
  console.log("[refreshWidgetData] called with dataItems:", dataItems);
  if (!dataItems || dataItems.length === 0) {
    console.warn("[Refresh] No dropped data available to refresh.");
    return;
  }
  try {
    if (typeof handleDrop !== "function") {
      throw new Error("[Refresh] handleDrop is not a function.");
    }
    await handleDrop(dataItems);
  } catch (error) {
    console.error("[Refresh] Error during handleDrop execution:", error);
  }
};
