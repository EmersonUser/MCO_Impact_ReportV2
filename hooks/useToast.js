// hooks/useToast.js
import { toast } from "react-toastify";
import { Bounce } from "react-toastify";

const useToast = () => {
  const showToast = ({
    message,
    type = "default",
    position = "top-right",
    autoClose = 2000,
    hideProgressBar = false,
    closeOnClick = true,
    pauseOnHover = false,
    pauseOnFocusLoss= false,
    draggable = true,
    theme = "light",
    transition = Bounce,
    progress = undefined,
    ...otherOptions
  }) => {
    const toastFunction = toast[type] || toast;

    toastFunction(message, {
      position,
      autoClose,
      hideProgressBar,
      closeOnClick,
      pauseOnHover,
      draggable,
      theme,
      transition,
      progress,
      ...otherOptions,
    });
  };

  const showSuccessToast = (message, options = {}) => {
    showToast({ message, type: "success", ...options });
  };

  const showErrorToast = (message, options = {}) => {
    showToast({ message, type: "error", ...options });
  };

  const showInfoToast = (message, options = {}) => {
    showToast({ message, type: "info", ...options });
  };

  const showWarningToast = (message, options = {}) => {
    showToast({ message, type: "warn", ...options });
  };

  return { showToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast };
};

// New function that wraps useToast and adds progress
const useToastWithProgress = () => {
  const { showToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast } = useToast();

  const showToastWithProgress = (message, options = {}) => {
    showToast({ message, progress: 1, ...options }); // Add progress property
  };

  const showSuccessToastWithProgress = (message, options = {}) => {
    showSuccessToast(message, { progress: 1, ...options });
  };

  const showErrorToastWithProgress = (message, options = {}) => {
    showErrorToast(message, { progress: 1, ...options });
  };

  const showInfoToastWithProgress = (message, options = {}) => {
    showInfoToast(message, { progress: 1, ...options });
  };

  const showWarningToastWithProgress = (message, options = {}) => {
    showWarningToast(message, { progress: 1, ...options });
  };

  return {
    showToastWithProgress,
    showSuccessToastWithProgress,
    showErrorToastWithProgress,
    showInfoToastWithProgress,
    showWarningToastWithProgress,
  };
};

// export { useToast, useToastWithProgress };
export default useToast;
export { useToastWithProgress };