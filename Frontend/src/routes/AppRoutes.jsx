import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layout/MainLayout";
import Dashboard from "../pages/Dashboard";
import HrConsolidationHub from "../pages/HrConsolidationHub";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="hr-hub" element={<HrConsolidationHub />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;