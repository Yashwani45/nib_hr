import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  employees: [],
  discontinuedEmployees: [],
  leaves: [],
  passes: [],
  leaveRules: [],
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setEmployees: (state, action) => {
      state.employees = action.payload;
    },
    setDiscontinuedEmployees: (state, action) => {
      state.discontinuedEmployees = action.payload;
    },



    
    setLeaves: (state, action) => {
      state.leaves = action.payload;
    },
    setPasses: (state, action) => {
      state.passes = action.payload;
    },
    setLeaveRules: (state, action) => {
      state.leaveRules = action.payload;
    },
    setDashboardData: (state, action) => {
      const { employees, leaves, passes, leaveRules } = action.payload;
      if (employees !== undefined) state.employees = employees;
      if (leaves !== undefined) state.leaves = leaves;
      if (passes !== undefined) state.passes = passes;
      if (leaveRules !== undefined) state.leaveRules = leaveRules;
    }
  }
});

export const {
  setEmployees,
  setDiscontinuedEmployees,
  setLeaves,
  setPasses,
  setLeaveRules,
  setDashboardData
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
