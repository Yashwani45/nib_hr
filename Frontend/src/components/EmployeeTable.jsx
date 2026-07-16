const EmployeeTable = () => {
  const employees = [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      department: "HR",
      status: "Active",
    },
    {
      id: 2,
      name: "Amit Verma",
      email: "amit@gmail.com",
      department: "IT",
      status: "Active",
    },
    {
      id: 3,
      name: "Neha Singh", 
      email: "neha@gmail.com",
      department: "Finance",
      status: "Deactive",
    },     
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-6">
      <h2 className="text-xl font-bold mb-4">Employee List</h2>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">ID</th>
              <th className="p-3 border text-left">Name</th>
              <th className="p-3 border text-left">Email</th>
              <th className="p-3 border text-left">Department</th>
              <th className="p-3 border text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="p-3 border">{employee.id}</td>
                <td className="p-3 border">{employee.name}</td>
                <td className="p-3 border">{employee.email}</td>
                <td className="p-3 border">{employee.department}</td>
                <td
                  className={`p-3 border font-semibold ${
                    employee.status === "Active"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {employee.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;