import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";  // Comment out Redux imports for now
import DragAndDropComponent from "../../components/DragAndDrop/DragAndDrop";
import CardComponent from "../../components/Card/Card";
import { Image } from "react-bootstrap";
// import useDroppableArea from "../../hooks/useDroppableArea";
import Loader from "../../components/Loader/Loader";
import ReusableTable from "../../components/Table/Table";
// import {
//   setDroppedObjectData,
//   setIsDropped,
// } from "../../store/droppedObjectSlice";
// import { getCardData, getTableData, tableColumns } from "./dataHelpers";
import { tableColumns } from "./dataHelpers";
// import useToast from "../../hooks/useToast";
import { MSG_WIDGET_RESET_SUCCESS } from "../../utils/toastMessages";
import RevisionFloatToolbarNativeCta from "./revisionFloatToolbarNativeCta";

const RevisionFloat = () => {
  // const { initializeDroppableArea, loading } = useDroppableArea(); // Comment out for now
  const [tableKey, setTableKey] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isCardDataAvailable, setIsCardDataAvailable] = useState(false);
  // const dispatch = useDispatch(); // Comment out for now
  // const { showSuccessToast } = useToast(); // Comment out for now

  // Dummy Data
  const dummyTableData = [
    {
      EIN: "EIN0001",
      Title: "Part A",
      Description: "This is part A",
      Type: "Part",
      Revision: "A.1",
      "Connected Child Revision": "B.1",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "In Work",
      Owner: "John Doe",
      "CAD Format": "SolidWorks",
      Collabspace: "Engineering",
    },
    {
      EIN: "EIN0002",
      Title: "Assembly X",
      Description: "This is assembly X",
      Type: "Assembly",
      Revision: "1.2",
      "Connected Child Revision": "C.2",
      "Latest child connected": "No",
      "To-Be child connected": "Yes",
      State: "Released",
      Owner: "Jane Smith",
      "CAD Format": "CATIA",
      Collabspace: "Manufacturing",
    },
    // Add more dummy data as needed...
    {
      EIN: "EIN0003",
      Title: "Part B",
      Description: "This is part B",
      Type: "Part",
      Revision: "B.2",
      "Connected Child Revision": "D.1",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "In Work",
      Owner: "Peter Jones",
      "CAD Format": "NX",
      Collabspace: "Engineering",
    },
    {
      EIN: "EIN0004",
      Title: "Assembly Y",
      Description: "This is assembly Y",
      Type: "Assembly",
      Revision: "2.1",
      "Connected Child Revision": "E.3",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "Review",
      Owner: "Mary Williams",
      "CAD Format": "Creo",
      Collabspace: "Design",
    },
    {
      EIN: "EIN0005",
      Title: "Part C",
      Description: "This is part C",
      Type: "Part",
      Revision: "C.1",
      "Connected Child Revision": "F.2",
      "Latest child connected": "No",
      "To-Be child connected": "Yes",
      State: "Obsolete",
      Owner: "David Brown",
      "CAD Format": "AutoCAD",
      Collabspace: "Engineering",
    },
    {
      EIN: "EIN0006",
      Title: "Assembly Z",
      Description: "This is assembly Z",
      Type: "Assembly",
      Revision: "3.3",
      "Connected Child Revision": "G.1",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "In Work",
      Owner: "Sarah Miller",
      "CAD Format": "SolidEdge",
      Collabspace: "Manufacturing",
    },
    {
      EIN: "EIN0007",
      Title: "Part D",
      Description: "This is part D",
      Type: "Part",
      Revision: "D.4",
      "Connected Child Revision": "H.2",
      "Latest child connected": "No",
      "To-Be child connected": "Yes",
      State: "Released",
      Owner: "Michael Davis",
      "CAD Format": "Inventor",
      Collabspace: "Design",
    },
    {
      EIN: "EIN0008",
      Title: "Assembly W",
      Description: "This is assembly W",
      Type: "Assembly",
      Revision: "4.1",
      "Connected Child Revision": "I.1",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "In Work",
      Owner: "Emily Wilson",
      "CAD Format": "Fusion 360",
      Collabspace: "Engineering",
    },
    {
      EIN: "EIN0009",
      Title: "Part E",
      Description: "This is part E",
      Type: "Part",
      Revision: "E.2",
      "Connected Child Revision": "J.3",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "Review",
      Owner: "Thomas Moore",
      "CAD Format": "Onshape",
      Collabspace: "Design",
    },
    {
      EIN: "EIN0010",
      Title: "Assembly V",
      Description: "This is assembly V",
      Type: "Assembly",
      Revision: "5.2",
      "Connected Child Revision": "K.4",
      "Latest child connected": "No",
      "To-Be child connected": "Yes",
      State: "Obsolete",
      Owner: "Ashley Taylor",
      "CAD Format": "SolidWorks",
      Collabspace: "Manufacturing",
    },
    {
      EIN: "EIN0011",
      Title: "Part F",
      Description: "This is part F",
      Type: "Part",
      Revision: "F.1",
      "Connected Child Revision": "L.2",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "In Work",
      Owner: "Daniel Anderson",
      "CAD Format": "CATIA",
      Collabspace: "Engineering",
    },
    {
      EIN: "EIN0012",
      Title: "Assembly U",
      Description: "This is assembly U",
      Type: "Assembly",
      Revision: "6.3",
      "Connected Child Revision": "M.1",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "Released",
      Owner: "Olivia Martinez",
      "CAD Format": "NX",
      Collabspace: "Manufacturing",
    },
    {
      EIN: "EIN0013",
      Title: "Part G",
      Description: "This is part G",
      Type: "Part",
      Revision: "G.2",
      "Connected Child Revision": "N.3",
      "Latest child connected": "No",
      "To-Be child connected": "Yes",
      State: "In Work",
      Owner: "William Johnson",
      "CAD Format": "Creo",
      Collabspace: "Engineering",
    },
    {
      EIN: "EIN0014",
      Title: "Assembly T",
      Description: "This is assembly T",
      Type: "Assembly",
      Revision: "5.2",
      "Connected Child Revision": "O.4",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "Review",
      Owner: "Sophie Lee",
      "CAD Format": "SolidEdge",
      Collabspace: "Design",
    },
    {
      EIN: "EIN0015",
      Title: "Part H",
      Description: "This is part H",
      Type: "Part",
      Revision: "H.1",
      "Connected Child Revision": "P.2",
      "Latest child connected": "No",
      "To-Be child connected": "Yes",
      State: "In Work",
      Owner: "James Wilson",
      "CAD Format": "AutoCAD",
      Collabspace: "Engineering",
    },
    {
      EIN: "EIN0016",
      Title: "Assembly S",
      Description: "This is assembly S",
      Type: "Assembly",
      Revision: "7.3",
      "Connected Child Revision": "Q.1",
      "Latest child connected": "Yes",
      "To-Be child connected": "No",
      State: "Released",
      Owner: "Emma Thompson",
      "CAD Format": "Fusion 360",
      Collabspace: "Manufacturing",
    },
  ];

  // Simulate loading
  useEffect(() => {
    setIsTableLoading(true);
    const timer = setTimeout(() => {
      setTableData(dummyTableData);
      setIsTableLoading(false);
      setIsCardDataAvailable(true);
    }, 1000); // Simulate 2 seconds of loading

    return () => clearTimeout(timer);
  }, []);

  // Define columns for the table
  const columns = useMemo(() => tableColumns, []);

  const handleHomeClick = () => {
    // initializeDroppableArea(); // Reset the droppable area
    // dispatch(setIsDropped(false));
    // dispatch(
    //   setDroppedObjectData({ cardData: {}, parentDetails: [], versions: [] })
    // ); // Clear Redux state
    setTableData([]); // Clear local table data
    setIsCardDataAvailable(false);
    // showSuccessToast(MSG_WIDGET_RESET_SUCCESS);
  };

  return (
    <>
      {isTableLoading ? (
        <Loader />
      ) : (
        <div className="wrapper-cta">
          <RevisionFloatToolbarNativeCta />
          <ReusableTable key={tableKey} data={tableData} columns={columns} />
        </div>
      )}

      {/* {isDropped && ( */}
      <div className="content-wrapper p-3">
        {/* <div className="d-flex border-bottom">
            <div className="ms-2 p-0 pt-4">
              <Image
                src="https://thewhitechamaleon.github.io/testrapp/images/home.png"
                alt="home-icon"
                className="home-icon"
                onClick={handleHomeClick}
              />
            </div>
            {isCardDataAvailable && <CardComponent data={cardData} />}
          </div> */}

        {/* {isTableLoading ? (
            <div className="loading-indicator mt-5">
              <Loader />
            </div>
          ) : tableData.length > 0 ? (
            <>
          <div className="wrapper-cta">
        <RevisionFloatToolbarNativeCta />
        <ReusableTable key={tableKey} data={tableData} columns={columns}  />
        </div>
            </>
          ) : (
            <div>No data available</div>
          )} */}
      </div>
      {/* )} */}
    </>
  );
};

export default RevisionFloat;
