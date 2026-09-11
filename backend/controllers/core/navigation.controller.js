// backend/controllers/core/navigation.controller.js
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { applyAccessScope } = require('../../utils/scopeHelper');

const { User, Role, Employee } = require('../../models');

const getAccessibleUIConfig = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [{
      model: Role,
      as: 'role'
    }]
  });

  if (!user || !user.role) {
    return res.status(403).json(new ApiResponse(403, null, 'Invalid user session.'));
  }

  const { QueryTypes } = require('sequelize');

  // 1. Fetch dynamic navigation menu items linked to this role
  const menus = await req.tenantDb.query(
    `SELECT m.* FROM navigation_menus m
     JOIN role_navigation_menus rm ON m.id = rm.menu_id
     WHERE rm.role_id = ?
     ORDER BY m.display_order ASC`,
    { replacements: [user.role.id], type: QueryTypes.SELECT }
  );

  // 2. Fetch dashboard widgets allowed for this role
  const widgets = await req.tenantDb.query(
    `SELECT w.* FROM dashboard_widgets w
     JOIN role_dashboard_widgets rw ON w.id = rw.widget_id
     WHERE rw.role_id = ?`,
    { replacements: [user.role.id], type: QueryTypes.SELECT }
  );

  // 3. Construct contextual team/member statistics
  const employeeCount = await Employee.count(
    applyAccessScope(req, { modelName: 'Employee' })
  );

  res.status(200).json(
    new ApiResponse(200, {
      roleName: user.role.roleName,
      menus,
      widgets,
      kpiSummary: {
        totalAccessibleStaff: employeeCount
      }
    }, 'Dynamic UI layout configured successfully.')
  );
});

module.exports = {
  getAccessibleUIConfig
};
