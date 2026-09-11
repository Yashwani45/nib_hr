import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dbData: {},
  loading: false,
  selectedCategory: "CORE",
  selectedModule: "1. Organization Setup",
  selectedTab: "Company",
  viewMode: "dashboard",
  searchText: "",
  showSchema: false,
  checkedIn: false,
  punchTime: "",
};



const hrSlice = createSlice({
  name: "hr",
  initialState,
  reducers: {
    setDbData: (state, action) => {
      state.dbData = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    setSelectedModule: (state, action) => {
      state.selectedModule = action.payload;
    },
    setSelectedTab: (state, action) => {
      state.selectedTab = action.payload;
    },
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setSearchText: (state, action) => {
      state.searchText = action.payload;
    },
    setShowSchema: (state, action) => {
      state.showSchema = action.payload;
    },
    setCheckedInState: (state, action) => {
      state.checkedIn = action.payload.checkedIn;
      state.punchTime = action.payload.punchTime;
    },
    updateTableRecord: (state, action) => {
      const { tableName, id, fields } = action.payload;
      if (state.dbData[tableName]) {
        state.dbData[tableName] = state.dbData[tableName].map(item =>
          item.id === id ? { ...item, ...fields } : item
        );
      }
    },
    deleteTableRecord: (state, action) => {
      const { tableName, id } = action.payload;
      if (state.dbData[tableName]) {
        state.dbData[tableName] = state.dbData[tableName].filter(item => item.id !== id);
      }
    },
    createTableRecord: (state, action) => {
      const { tableName, record } = action.payload;
      if (!state.dbData[tableName]) {
        state.dbData[tableName] = [];
      }
      state.dbData[tableName] = [record, ...state.dbData[tableName]];
    }
  }
});

export const {
  setDbData,
  setLoading,
  setSelectedCategory,
  setSelectedModule,
  setSelectedTab,
  setViewMode,
  setSearchText,
  setShowSchema,
  setCheckedInState,
  updateTableRecord,
  deleteTableRecord,
  createTableRecord
} = hrSlice.actions;

export default hrSlice.reducer;
