import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  droppedObjectData: {
    initialDraggedData: [],
    cardData: {}, // Dragged object details
    versions: [], // Object versions (revisions)
    parentDetails: [], // Parent metadata
    ownerData: {} /* data from cardOwnerResult */,
  },
  plantObjectData: {
    allPlants: [],
    initialAssignedPlants: [],
    uniquePlants: [],
    productChildren: [],
    CAName: false,
    headers: {},
    proposedChanges: [],
    CAData: {},
  },
  CAItemObjectDetails: {
    CAItemDetails: [],
    CAallPlants: [],
    CAisMFGCA: false,
    CAheaders: {},
  },
  MCAItemObjectDetails: {
    MCAItemDetails: [],
    MCAallPlants: [],
    MCAisMFGCA: false,
    MCAheaders: {},
  },
  MCAItemObjectDetails2: {
    MCAItemDetails2: [],
    MCAallPlants: [],
    MCAisMFGCA: false,
    MCAheaders: {},
  },
  BOSObjectData: {
    specDocument: [],
    childData: [],
  },
  loadingParentDetails: false, // Loading state for parent metadata
  isDropped: false, // Indicates whether an object has been dropped
  loading: false,
  selectedTableRows: [],
};
 
const droppedObjectSlice = createSlice({
  name: "droppedObject",
  initialState,
  reducers: {
    setInitialDroppedObjectData: (state, action) => {
      state.droppedObjectData.initialDraggedData =
        action.payload.initialDraggedData;
    },
    setDroppedObjectData: (state, action) => {
      state.droppedObjectData = {
        ...state.droppedObjectData,
        ...action.payload,
      };
    },
    setPlantObjectData: (state, action) => {
      state.plantObjectData = {
        ...state.plantObjectData,
        ...action.payload,
      };
    },
    setCAItemObjectDetails: (state, action) => {
      state.CAItemObjectDetails = {
        ...state.CAItemObjectDetails,
        ...action.payload,
      };
    },
    setMCAItemObjectDetails: (state, action) => {
      state.MCAItemObjectDetails = {
        ...state.MCAItemObjectDetails,
        ...action.payload,
      };
    },
    setMCAItemObjectDetails2: (state, action) => {
      state.MCAItemObjectDetails2 = {
        ...state.MCAItemObjectDetails2,
        ...action.payload,
      };
    },
    setProductChildren: (state, action) => {
      state.plantObjectData.productChildren = action.payload;
    },
    setProposedChanges: (state, action) => {
      state.plantObjectData.proposedChanges = action.payload;
    },
    setHeaders: (state, action) => {
      state.plantObjectData.headers = action.payload;
    },
    setCAName: (state, action) => {
      state.plantObjectData.CAName = action.payload;
    },
    setCAItemDetails: (state, action) => {
      state.CAItemObjectDetails.CAItemDetails = action.payload;
    },
    setMCAItemDetails: (state, action) => {
      state.MCAItemObjectDetails.MCAItemDetails = action.payload;
    },
    setMCAItemDetails2: (state, action) => {
      state.MCAItemObjectDetails2.MCAItemDetails2 = action.payload;
    },
    setCAAllPlants: (state, action) => {
      state.CAItemObjectDetails.CAallPlants = action.payload;
    },
    setIsMFGCA: (state, action) => {
      state.CAItemObjectDetails.CAisMFGCA = action.payload;
    },
    setCAHeaders: (state, action) => {
      state.CAItemObjectDetails.CAheaders = action.payload;
    },
    setSpecDocument: (state, action) => {
      state.BOSObjectData.specDocument = action.payload;
    },
    setChildData: (state, action) => {
      state.BOSObjectData.childData = action.payload;
    },
 
    setParentDetailsLoading: (state, action) => {
      state.loadingParentDetails = action.payload;
    },
    setIsDropped: (state, action) => {
      state.isDropped = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSelectedTableRows: (state, action) => {
      state.selectedTableRows = action.payload;
    },
    setCAData: (state, action) =>{
      state.plantObjectData.CAData = action.payload;
    },
  },
});
 
export const {
  setInitialDroppedObjectData,
  setDroppedObjectData,
  setPlantObjectData,
  setProductChildren,
  setCAName,
  setHeaders,
  setCAItemDetails,
  setCAAllPlants,
  setIsMFGCA,
  setCAHeaders,
  setParentDetailsLoading,
  setIsDropped,
  setLoading,
  setSpecDocument,
  setChildData,
  setSelectedTableRows,
  setProposedChanges,
  setCAData,
  setCAItemObjectDetails,
  setMCAItemDetails,
  setMCAItemDetails2,
  setMCAItemObjectDetails,
  setMCAItemObjectDetails2
} = droppedObjectSlice.actions;
export default droppedObjectSlice.reducer;