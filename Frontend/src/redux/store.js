import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import hrReducer from "./hrSlice";
import dashboardReducer from "./dashboardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hr: hrReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});




export default store;


