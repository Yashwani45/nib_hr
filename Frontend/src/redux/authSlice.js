import { createSlice } from "@reduxjs/toolkit";

const getInitialToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token || token === "mock-token-dept-hr" || token === "mock-token-fallback") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

const getInitialUser = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token || token === "mock-token-dept-hr" || token === "mock-token-fallback") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    const saved = JSON.parse(localStorage.getItem("user"));
    if (saved && saved.role === "DepartmentHR" && (saved.departmentName === "Software Engineering" || token?.startsWith("mock-"))) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return saved;
  } catch {
    return null;
  }
};

const initialState = {
  token: getInitialToken(),
  user: getInitialUser(),
  loading: false,
};





const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    logoutSuccess: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { loginSuccess, logoutSuccess, updateUserProfile, setLoading } = authSlice.actions;
export default authSlice.reducer;
