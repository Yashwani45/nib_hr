import { createSlice } from "@reduxjs/toolkit";

const getInitialUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

const initialState = {
  token: localStorage.getItem("token") || null,
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
