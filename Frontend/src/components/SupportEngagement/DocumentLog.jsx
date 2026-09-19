import React from "react";
import EmployeeDocumentsMasterView from "./EmployeeDocumentsMasterView";

const DocumentLog = ({ user }) => {
  return (
    <div className="w-full font-sans">
      <EmployeeDocumentsMasterView user={user} />
    </div>
  );
};

export default DocumentLog;
