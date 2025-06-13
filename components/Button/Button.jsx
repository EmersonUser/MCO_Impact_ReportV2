import React from "react";
import { Button } from "react-bootstrap";
import PropTypes from "prop-types";

const CustomButton = ({
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  title,
  text,
  imageSrc,
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      title={title}
      {...props}
    >
      {imageSrc && (
        <img
          src={imageSrc}
          alt={text}
          style={{ width: "20px", height: "20px", marginRight: "5px" }}
        />
      )}{" "}
      {/* Render image if provided */}
      {text}
    </Button>
  );
};

CustomButton.propTypes = {
  variant: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.string,
  imageSrc: PropTypes.string, // PropType for image source
};

export default CustomButton;
