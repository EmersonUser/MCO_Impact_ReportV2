import React, { useEffect, useRef } from "react";
import "./List.css";
import { makeDraggable } from "../../utils/helpers";
import { useSelector } from "react-redux";

const List = ({ data, isColumn, onDragStart, onDragEnd }) => {
  const titleRef = useRef(null);
  const initialDraggedData = useSelector(
    (state) => state.droppedObject.droppedObjectData.initialDraggedData
  );

  useEffect(() => {
    if (titleRef.current && initialDraggedData) {
      makeDraggable(
        titleRef.current,
        initialDraggedData,
        onDragStart,
        onDragEnd
      );
    }
  }, [data, initialDraggedData, onDragStart, onDragEnd]);

  if (!data) return null;

  return (
    <div className={`d-flex ${isColumn ? "flex-column" : "flex-row"}`}>
      <h5
        ref={titleRef}
        className={`mb-1 text-start title ${!isColumn ? "me-2" : ""}`}
      >
        {data.title}
      </h5>
      <ul
        className={`list-group d-flex flex-row flex-sm-row flex-wrap justify-content-between pb-3 pb-md-0 ${
          !isColumn ? "w-75" : ""
        }`}
      >
        <li
          className={`list-group-item flex-grow-1 text-start mx-0 ps-0 pb-0 ${
            !isColumn ? "d-flex flex-row justify-content-around" : ""
          }`}
          style={{ border: "0" }}
        >
          <p>
            <b>Type:</b>{" "}
            <span className="list-text" title={data.type}>
              {data.type}
            </span>
          </p>
          <p>
            <b>Owner:</b>{" "}
            <span className="list-text" title={data.owner}>
              {data.owner}
            </span>
          </p>
          {isColumn && (
            <p>
              <b>Maturity State:</b>{" "}
              <span className="list-text" title={data["Maturity State"]}>
                {data["Maturity State"]}
              </span>
            </p>
          )}
        </li>
        {isColumn && (
          <li
            className="list-group-item flex-grow-1 text-start mx-0 pt-0"
            style={{ border: "0", paddingLeft: "0" }}
          >
            <p>
              <b>Dropped Revision :</b>{" "}
              <span className="list-text" title={data["Dropped Revision"]}>
                {data["Dropped Revision"]}
              </span>
            </p>
            <p>
              <b>Latest Released Revision:</b>{" "}
              <span
                className="list-text"
                title={data["Latest Released Revision"]}
              >
                {data["Latest Released Revision"]}
              </span>
            </p>
            <p>
              <b>Collabspace:</b>{" "}
              <span
                className="list-text"
                title={data["Collaborative Space Title"]}
              >
                {data["Collaborative Space Title"]}
              </span>
            </p>
          </li>
        )}

        <li
          className={`list-group-item flex-grow-1 text-start mx-0 ${
            !isColumn ? "d-flex flex-row" : ""
          }`}
          style={{ border: "0", paddingLeft: "0" }}
        >
          {data.type !== "Document" && (
            <>
              <p>
                <b>CAD Format:</b>{" "}
                <span className="list-text" title={data["CAD Format"]}>
                  {data["CAD Format"]}
                </span>
              </p>
              <p>
                <b>EIN:</b>{" "}
                <span className="list-text" title={data.EIN}>
                  {data.EIN}
                </span>
              </p>
            </>
          )}
        </li>

        <div className="d-none d-md-flex align-items-stretch">
          <div className="vr"></div>
        </div>

        {/* Horizontal divider after third li on small screens */}
        <div className="d-flex d-md-none w-100">
          <hr className="w-100" />
        </div>

        <li
          className="list-group-item flex-grow-1 text-start mx-0"
          style={{ border: "0" }}
        >
          <p className="description-container" title={data.Description}>
            {data.Description}
          </p>
        </li>
      </ul>
    </div>
  );
};

export default List;
