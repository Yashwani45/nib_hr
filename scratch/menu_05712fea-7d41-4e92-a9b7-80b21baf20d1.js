return [
122:       { path: "/admin/dashboard", name: "Dashboard Overview", icon: HomeIcon },
123:       {
124:         name: "Organization Setup",
125:         categoryKey: "ORG_SETUP",
126:         icon: BuildingOffice2Icon,
127:         children: [
128:           { name: "Company", tab: "Company" },
129:           { name: "Branch", tab: "Branch" },
130:           { name: "Department", tab: "Department" },
131:           { name: "Designation Master", tab: "Designation" }
132:         ]
133:       },
134:       {
135:         name: "Employee Management",
136:         categoryKey: "EMPLOYEE_MGMT",
137:         icon: UserGroupIcon,
138:         children: [
139:            { name: "Employee Dashboard", tab: "Employee Dashboard" },
140:            showAddEmployee && { name: "Add Employee", tab: "Add Employee" },
141:            (!showAddEmployee) && { name: "Fill Details", tab: "Employee Profile" },
142:            { name: "Documents", tab: "Document Log" },
143:           { name: "Assets", tab: "Asset Allocation" },
144:           { name: "Bank Details", tab: "Bank Details" },
145:           { name: "Salary Details", tab: "Salary Structure" },
146:           { name: "Reporting Manager", tab: "Reporting Hierarchy" }
147:         ].filter(Boolean)
148:       },
149:       {
150:         name: "Attendance",
151:         categoryKey: "ATTENDANCE",
152:         icon: ClockIcon,
153:         children: [
154:           { name: "Dashboard", tab: "Attendance Dashboard" },
155:           { name: "Daily Attendance", tab: "Daily Attendance" },
156:           { name: "Monthly Attendance", tab: "Monthly Attendance" },
157:           { name: "Shift Management", tab: "Shift Master" },
158:           { name: "Biometric", tab: "Biometric" },
159:           { name: "Attendance Regularization", tab: "Attendance Regularization" },
160:           { name: "Overtime Master", tab: "Overtime" },
161:           { name: "Reports", tab: "Reports" }
162:         ]
163:       },
164:       {
165:         name: "Leave Management",
166:         categoryKey: "LEAVE_MGMT",
167:         icon: CalendarDaysIcon,
168:         children: [
169:           { name: "Leave Type Master", tab: "Leave Types" },
170:           { name: "Holiday Master", tab: "Holiday Calendar" },
171:           { name: "Leave Request", tab: "Leave Requests" },
172:           { name: "Leave Approval", tab: "Approvals Pending" },
173:           { name: "Leave Balance", tab: "Leave Balance" },
174:           { name: "Reports", tab: "Reports" }
175:         ]
176:       },
177:       {
178:         name: "Payroll",
179:         categoryKey: "PAYROLL",
180:         icon: BanknotesIcon,
181:         children: [
182:           { name: "Payroll Process", tab: "Payroll Process" },
183:           { name: "Payslip", tab: "Payslip" },
184:           { name: "Loan Management", tab: "Loan Management" },
185:           { name: "ESI Management", tab: "ESI Management" },
186:           { name: "Professional Tax (PT)", tab: "Professional Tax (PT)" },
187:           { name: "Reports", tab: "Reports" },
188:           { name: "Salary Structure", tab: "Salary Structure" }
189:         ]
190:       },
191:       {
192:         name: "Asset Management",
193:         categoryKey: "ASSET_MGMT",
194:         icon: BuildingOffice2Icon,
195:         children: [
196:           { name: "Dashboard", tab: "Asset Dashboard" },
197:           { name: "Asset List", tab: "Inventory" },
198:           { name: "Asset Allocation", tab: "Asset Allocation" },
199:           { name: "Asset Return", tab: "Asset Return" },
200:           { name: "Asset History", tab: "Asset History" },
201:           { name: "Maintenance", tab: "Maintenance" },
202:           { name: "Reports", tab: "Reports" }
203:         ]
204:       },
205:       {
206:         name: "Document Management",
207:         categoryKey: "DOCUMENT_MGMT",
208:         icon: DocumentDuplicateIcon,
209:         children: [
210:           { name: "Letter Workspace", tab: "Letter Workspace" }
211:         ]
212:       },
213:       {
214:         name: "Exit Management",
215:         categoryKey: "EXIT_MGMT",
216:         icon: ArrowRightOnRectangleIcon,
217:         children: [
218:           { name: "Dashboard", tab: "Exit Dashboard" }
219:         ]
220:       },
221:       {
222:         name: "Workflow & Approval",
223:         categoryKey: "WORKFLOW",
224:         icon: InboxStackIcon,
225:         children: [
226:           { name: "Dashboard", tab: "Workflow Dashboard" }
227:         ]
228:       },
229:       {
230:         name: "Helpdesk",
231:         categoryKey: "HELPDESK",
232:         icon: ChatBubbleLeftRightIcon,
233:         children: [
234:           { name: "Dashboard", tab: "Helpdesk Dashboard" }
235:         ]
236:       },
237:       {
238:         name: "Reports",
239:         categoryKey: "REPORTS",
240:         icon: PresentationChartBarIcon,
241:         children: [
242:           { name: "Dashboard", tab: "Reports Dashboard" }
243:         ]
244:       },
245:       {
246:         name: "Departments",
247:         categoryKey: "DEPARTMENT",
248:         icon: UserGroupIcon,
249:         children: departmentChildren
250:       },
251:       {
252:         name: "Settings",
253:         categoryKey: "SETTINGS",
254:         icon: Cog6ToothIcon,
255:         children: [
256:           { name: "Company Settings", tab: "Company Settings" },
257:           { name: "Attendance Settings", tab: "Attendance Settings" },
258:           { name: "Leave Settings", tab: "Leave Settings" },
259:           { name: "Payroll Settings", tab: "Payroll Settings" },
260:           { name: "Shift Settings", tab: "Shift Settings" },
261:           { name: "Notification Settings", tab: "Notification Settings" },
262:           { name: "Email Templates", tab: "Email Templates" },
263:           { name: "Document Templates", tab: "Document Templates" },
264:           { name: "Security", tab: "Security" },
265:           { name: "Audit Logs", tab: "Audit Logs" }
266:         ]
267:       }
268:     ];
269:   }, [departmentsList, user]);
270: 
271:   const employeeMenuItems = useMemo(() => {
272:     return [
273:       {
274:         name: "Dashboard",
275:         categoryKey: "EMP_DASHBOARD",
276:         icon: HomeIcon,
277:         children: [
278:           { name: "Dashboard Home", tab: "Dashboard Home" },
279:           { name: "Welcome Card", tab: "Welcome Card" },
280:           { name: "Employee Summary", tab: "Employee Summary" },
281:           { name: "Quick Actions", tab: "Quick Actions" },
282:           { name: "Today's Attendance", tab: "Today's Attendance" },
283:           { name: "Leave Balance", tab: "Leave Balance" },
284:           { name: "Working Hours", tab: "Working Hours" },
285:           { name: "Pending Requests", tab: "Pending Requests" },
286:           { name: "Assigned Assets", tab: "Assigned Assets" },
287:           { name: "Upcoming Holidays", tab: "Upcoming Holidays" },
288:           { name: "Upcoming Birthdays", tab: "Upcoming Birthdays" },
289:           { name: "Work Anniversary", tab: "Work Anniversary" },
290:           { name: "Announcements", tab: "Announcements" },
291:           { name: "Notifications", tab: "Notifications" },
292:           { name: "Performance Summary", tab: "Performance Summary" },
293:           { name: "Training Progress", tab: "Training Progress" },
294:           { name: "Recent Activities", tab: "Recent Activities" }
295:         ]
296:       },
297:       {
298:         name: "Employee Management",
299:         categoryKey: "EMPLOYEE_MGMT",
300:         icon: UserGroupIcon,
301:         children: [
302:           { name: "Employee Dashboard", tab: "Employee Dashboard" },
303:           { name: "Fill Details", tab: "Employee Profile" },
304:           { name: "Documents", tab: "Document Log" },
305:           { name: "Assets", tab: "Asset Allocation" },
306:           { name: "Bank Details", tab: "Bank Details" },
307:           { name: "Salary Details", tab: "Salary Structure" },
308:           { name: "Reporting Manager", tab: "Reporting Hierarchy" }
309:         ]
310:       },
311: 
312:       {
313:         name: "Attendance",
314:         categoryKey: "EMP_ATTENDANCE",
315:         icon: ClockIcon,
316:         children: [
317:           { name: "Check In", tab: "Check In" },
318:           { name: "Check Out", tab: "Check Out" },
319:           { name: "Today's Attendance", tab: "Today's Attendance" },
320:           { name: "Attendance Calendar", tab: "Attendance Calendar" },
321:           { name: "Attendance History", tab: "Attendance History" },
322:           { name: "Monthly Attendance", tab: "Monthly Attendance" },
323:           { name: "Shift Details", tab: "Shift Details" },
324:           { name: "Overtime", tab: "Overtime" },
325:           { name: "Attendance Regularization", tab: "Attendance Regularization" },
326:           { name: "Biometric Logs", tab: "Biometric Logs" },
327:           { name: "Attendance Reports", tab: "Attendance Reports" }
328:         ]
329:       },
330:       {
331:         name: "Leave Management",
332:         categoryKey: "EMP_LEAVE",
333:         icon: CalendarDaysIcon,
334:         children: [
335:           { name: "Apply Leave", tab: "Apply Leave" },
336:           { name: "Leave Balance", tab: "Leave Balance" },
337:           { name: "Leave History", tab: "Leave History" },
338:           { name: "Leave Calendar", tab: "Leave Calendar" },
339:           { name: "Holiday Calendar", tab: "Holiday Calendar" },
340:           { name: "Comp-Off", tab: "Comp-Off" },
341:           { name: "Leave Status", tab: "Leave Status" },
342:           { name: "Leave Approval History", tab: "Leave Approval History" },
343:           { name: "Leave Reports", tab: "Leave Reports" }
344:         ]
345:       },
346:       {
347:         name: "Payroll",
348:         categoryKey: "EMP_PAYROLL",
349:         icon: BanknotesIcon,
350:         children: [
351:           { name: "Salary Slips", tab: "Salary Slips" },
352:           { name: "Salary Structure", tab: "Salary Structure" },
353:           { name: "Payroll History", tab: "Payroll History" },
354:           { name: "Tax Details", tab: "Tax Details" },
355:           { name: "PF Details", tab: "PF Details" },
356:           { name: "ESI Details", tab: "ESI Details" },
357:           { name: "Loan Details", tab: "Loan Details" },
358:           { name: "Reimbursements", tab: "Reimbursements" },
359:           { name: "Form-16", tab: "Form-16" },
360:           { name: "Payroll Reports", tab: "Payroll Reports" }
361:         ]
362:       },
363:       {
364:         name: "Asset Management",
365:         categoryKey: "EMP_ASSETS",
366:         icon: BriefcaseIcon,
367:         children: [
368:           { name: "Assigned Assets", tab: "Assigned Assets" },
369:           { name: "Asset Requests", tab: "Asset Requests" },
370:           { name: "Asset Return", tab: "Asset Return" },
371:           { name: "Asset History", tab: "Asset History" },
372:           { name: "Software Licenses", tab: "Software Licenses" },
373:           { name: "Asset Documents", tab: "Asset Documents" }
374:         ]
375:       },
376:       {
377:         name: "Travel & Expense",
378:         categoryKey: "EMP_TRAVEL_EXPENSE",
379:         icon: InboxStackIcon,
380:         children: [
381:           { name: "Travel Request", tab: "Travel Request" },
382:           { name: "Travel History", tab: "Travel History" },
383:           { name: "Expense Claims", tab: "Expense Claims" },
384:           { name: "Bills Upload", tab: "Bills Upload" },
385:           { name: "Reimbursements", tab: "Reimbursements" },
386:           { name: "Expense Reports", tab: "Expense Reports" }
387:         ]
388:       },
389:       {
390:         name: "Documents",
391:         categoryKey: "EMP_DOCUMENTS",
392:         icon: DocumentDuplicateIcon,
393:         children: [
394:           { name: "Letter Workspace", tab: "Letter Workspace" }
395:         ]
396:       },
397:       {
398:         name: "Exit Management",
399:         categoryKey: "EXIT_MGMT",
400:         icon: ArrowRightOnRectangleIcon,
401:         children: [
402:           { name: "Dashboard", tab: "Exit Dashboard" }
403:         ]
404:       },
405:       {
406:         name: "Helpdesk",
407:         categoryKey: "EMP_HELPDESK",
408:         icon: WrenchScrewdriverIcon,
409:         children: [
410:           { name: "Dashboard", tab: "Helpdesk Dashboard" }
411:         ]
412:       },
413:       {
414:         name: "Reports",
415:         categoryKey: "EMP_REPORTS",
416:         icon: PresentationChartBarIcon,
417:         children: [
418:           { name: "Attendance Report", tab: "Attendance Report" },
419:           { name: "Leave Report", tab: "Leave Report" },
420:           { name: "Payroll Report", tab: "Payroll Report" },
421:           { name: "Performance Report", tab: "Performance Report" },
422:           { name: "Training Report", tab: "Training Report" },
423:           { name: "Asset Report", tab: "Asset Report" },
424:           { name: "Expense Report", tab: "Expense Report" }
425:         ]
426:       },
427:       {
428:         name: "Settings",
429:         categoryKey: "EMP_SETTINGS",
430:         icon: Cog6ToothIcon,
431:         children: [
432:           { name: "Change Password", tab: "Change Password" },
433:           { name: "Two-Factor Authentication", tab: "Two-Factor Authentication" },
434:           { name: "Security Settings", tab: "Security Settings" },
435:           { name: "Notification Preferences", tab: "Notification Preferences" },
436:           { name: "Language", tab: "Language" },
437:           { name: "Theme", tab: "Theme" },
438:           { name: "Privacy Settings", tab: "Privacy Settings" },
439:           { name: "Logout", tab: "Logout" }
440:         ]
441:       }
442:     ];
443:   }, []);
444: 
445:   // Auto-expand category accordions on mount or query updates
446:   useEffect(() => {
447:     const activeCategory = searchParams.get("category");
448:     if (activeCategory) {
449:       const match = menuItems.find((item) => item.categoryKey === activeCategory);
450:       if (match) {
451:         setOpenMenus((prev) => ({ ...prev, [match.name]: true }));
452:       }
453:     }
454:   }, [searchParams]);
455: 
456:   const navRef = useRef(null);
457: 
458:   const handleNavScroll = (e) => {
459:     if (e?.currentTarget) {
460:       sessionStorage.setItem("sidebar_scroll_top", String(e.currentTarget.scrollTop));
461:     }
462:   };
463: 
464:   useEffect(() => {
465:     const savedScroll = sessionStorage.getItem("sidebar_scroll_top");
466:     if (savedScroll && navRef.current) {
467:       navRef.current.scrollTop = Number(savedScroll);
468:     }
469:   }, [isOpen, searchParams]);
470: 
471:   const toggleMenu = (name) => {
472:     setOpenMenus((prev) => ({
473:       ...prev,
474:       [name]: !prev[name],
475:     }));
476:   };
477: 
478:   const closeOnMobile = () => {
479:     if (window.matchMedia("(max-width: 1023px)").matches) {
480:       setIsOpen(false);
481:     }
482:   };
483: 
484:   const userRoleStr = typeof user?.role === "object" ? user?.role?.name : user?.role;
485:   const isEmployee = String(userRoleStr || "").toLowerCase() === "employee";
486:   const isSuperAdmin = String(userRoleStr || "").toLowerCase() === "superadmin" || String(userRoleStr || "").toLowerCase() === "super admin" || user?.email === "superadmin@nib.com";
487:   const hasAssignedModules = Array.isArray(user?.assignedModules) && user.assignedModules.length > 0;
488: 
489:   const activeMenuItems = useMemo(() => {
490:     let items = [];
491: 
492:     if (isEmployee) {
493:       items = [...employeeMenuItems];
494:     } else if (!isSuperAdmin && hasAssignedModules) {
495:       const allowed = user.assignedModules.map(m => String(m).toLowerCase().trim());
496:       
497:       const filteredStandard = menuItems.map(item => {
498:         const itemNameLower = String(item.name).toLowerCase().trim();
499: 
500:         // Check if it's a top level link (like Dashboard Overview)
501:         if (!item.children) {
502:           const isAllowed = allowed.includes("dashboard") || allowed.includes("dashboard overview");
503:           return isAllowed ? item : null;
504:         }
505: 
506:         if (item.categoryKey === "PROFILE") {
507:           return item;
508:         }
509: 
510:         // The category must be explicitly checked in the assigned modules list
511:         const isCatAllowed = allowed.includes(itemNameLower);
512:         if (!isCatAllowed) {
513:           return null;
514:         }
515: 
516:         return item;
517:       }).filter(Boolean);
518: 
519:       // Dynamically add custom modules assigned to this user/department
520:       const customAssigned = user.assignedModules.filter(mod => {
521:         const modLower = String(mod).toLowerCase().trim();
522:         const matchesStandard = menuItems.some(item => {
523:           if (!item.children) return modLower === "dashboard" || modLower === "dashboard overview";
524:           const categoryName = String(item.name).toLowerCase().trim();
525:           return categoryName === modLower;
526:         });
527:         return !matchesStandard;
528:       });
529: 
530:       if (customAssigned.length > 0) {
531:         const customMenuItems = customAssigned.map(customMod => ({
532:           name: customMod,
533:           icon: CubeIcon,
534:           children: [
535:             {
536:               name: `${customMod} Workspace`,
537:               path: `/department/${customMod.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
538:               icon: DocumentTextIcon
539:             }
540:           ]
541:         }));
542:         items = [...filteredStandard, ...customMenuItems];
543:       } else {
544:         items = filteredStandard;
545:       }
546:     } else {
547:       items = [...menuItems];
548:     }
549:     return items;
550:   }, [isEmployee, isSuperAdmin, hasAssignedModules, user?.assignedModules, employeeMenuItems, menuItems]);
551: 
552:   