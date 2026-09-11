import React, { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess, logoutSuccess } from "../redux/authSlice";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);

  const login = (newToken, newUser) => {
    dispatch(loginSuccess({ token: newToken, user: newUser }));
  };
















  

  const logout = () => {
    dispatch(logoutSuccess());
    navigate("/login");
  };

  const fetchWithAuth = async (url, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401 || response.status === 403) {
        // Auto-logout if token is expired, forbidden, or invalid
        dispatch(logoutSuccess());
        navigate("/login");
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
