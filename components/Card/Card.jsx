import React, { useState } from "react";
import "./Card.css";
import "bootstrap/dist/css/bootstrap.css";
import { Image, Card, CardBody } from "react-bootstrap";
import List from "../List/List";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faAngleUp } from "@fortawesome/free-solid-svg-icons";

const CardComponent = ({ data, onDragStart, onDragEnd }) => {
  const [isColumn, setIsColumn] = useState(true);

  const toggleFlexDirection = () => {
    setIsColumn(!isColumn);
  };

  return (
    <Card className="d-flex flex-row mt-4 border-0 " style={{ width: "100%" }}>
      <div className="pb-3 d-none d-md-block me-5 ms-4">
        <Card.Img
          className={`${
            !isColumn ? "image-resize img-thumbnail" : "img-thumbnail"
          } `}
          src={data.imageURL} // Use dynamic image URL from data
          alt="Card image"
        />
      </div>
      <CardBody className={`${!isColumn ? "p-0 layout-change" : "p-0"} `}>
        <List
          data={data}
          isColumn={isColumn}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      </CardBody>
      <button
        className="me-2 p-0 btn btn-link accordion-toggle"
        onClick={toggleFlexDirection}
      >
        {/* <FontAwesomeIcon
          icon={faAngleUp}
          size="xs"
          style={{ color: "#212121" }}
          className={`rotatable ${isColumn ? "rotated" : ""}`}
        /> */}

        <Image
          src="https://khanfarzan17.github.io/tedting-revision-float/images/arrow.png"
          alt="downArrow"
          className={`rotatable ${isColumn ? "rotated" : ""}`}
        />
      </button>
    </Card>
  );
};

export default CardComponent;
