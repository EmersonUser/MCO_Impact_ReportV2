import React, { createContext, useContext, useRef, useEffect } from "react";
import useDroppableArea from "../hooks/useDroppableArea"; // Your existing hook

// ✅ Create the Context
const DroppableContext = createContext();

// ✅ Create the Provider Component
export const DroppableProvider = ({ children }) => {
  const { initializeDroppableArea } = useDroppableArea();
  const hasInitialized = useRef(false);

  // ✅ Initialize droppable area only ONCE
  useEffect(() => {
    if (!hasInitialized.current) {
      console.log("[DroppableProvider] Initializing droppable area...");
      initializeDroppableArea();
      hasInitialized.current = true; // ✅ Ensures it runs only once
    }
  }, [initializeDroppableArea]);

  return (
    <DroppableContext.Provider value={{}}>
      {children}
    </DroppableContext.Provider>
  );
};

// ✅ Custom Hook to Use the Context
export const useDroppable = () => useContext(DroppableContext);
