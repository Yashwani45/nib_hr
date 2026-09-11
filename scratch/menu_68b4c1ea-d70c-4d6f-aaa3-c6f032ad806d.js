return [
164:       { path: "/admin/dashboard", name: "Dashboard Overview", icon: HomeIcon },
165:       {
166:         name: "Organization Setup",
167:         categoryKey: "ORG_SETUP",
168:         icon: BuildingOffice2Icon,
169:         children: [
170:           { name: "Company", tab: "Company" },
171:           { name: "Branch", tab: "Branch" },
172:           { name: "Department", tab: "Department" },
173:           { name: "Designation Master", tab: "Designation" },
174:           { name: "Business Unit", tab: "Business Unit" },
175:           { name: "Cost Center", tab: "Cost Center" },
176:           { name: "Reporting Hierarchy", tab: "Reporting Hierarchy" },
177:           { name: "Organizational Chart", tab: "Organizational Chart" }
178:         ]
179:       },
180:       {
181:         name: "Employee Management",
182:         categoryKey: "EMPLOYEE_MGMT",
183:         icon: UserGroupIcon,
184:         children: [
185:            { name: "Employee Dashboard", tab: "Employee Dashboard" },
186:            showAddEmployee && { name: "Add Employee", tab: "Add Employee" },
187:            (!showAddEmployee) && { name: "Fill Details", tab: "Employee Profile" },
188:            { name: "Documents", tab: "Document Log" },
189:           { name: "Assets", tab: "Asset Allocation" },
190:           { name: "Bank Details", tab: "Bank Details" },
191:           { name: "Salary Details", tab: "Salary Structure" },
192:           { name: "Reporting Manager", tab: "Reporting Hierarchy" },
193:           { name: "Employee Timeline", tab: "Employee Timeline" }
194:         ].filter(Boolean)
195:       },
196:       {
197:         name: groupName,
198:         categoryKey: "RECRUITMENT",
199:         icon: BriefcaseIcon,
200:         children: recruitmentChildren
201:       },
202:       {
203:         name: "Attendance",
204:         categoryKey: "ATTENDANCE",
205:         icon: ClockIcon,
206:         children: [
207:           { name: "Dashboard", tab: "Attendance Dashboard" },
208:           { name: "Daily Attendance", tab: "Daily Attendance" },
209:           { name: "Monthly Attendance", tab: "Monthly Attendance" },
210:           { name: "Shift Management", tab: "Shift Master" },
211:           { name: "Biometric", tab: "Biometric" },
212:           { name: "Attendance Regularization", tab: "Attendance Regularization" },
213:           { name: "Overtime Master", tab: "Overtime" },
214:           { name: "Reports", tab: "Reports" }
215:         ]
216:       },
217:       {
218:         name: "Leave Management",
219:         categoryKey: "LEAVE_MGMT",
220:         icon: CalendarDaysIcon,
221:         children: [
222:           { name: "Dashboard", tab: "Leave Dashboard" },
223:           { name: "Leave Type Master", tab: "Leave Types" },
224:           { name: "Holiday Master", tab: "Holiday Calendar" },
225:           { name: "Leave Request", tab: "Leave Requests" },
226:           { name: "Leave Approval", tab: "Approvals Pending" },
227:           { name: "Leave Balance", tab: "Leave Balance" },
228:           { name: "Reports", tab: "Reports" }
229:         ]
230:       },
231:       {
232:         name: "Payroll",
233:         categoryKey: "PAYROLL",
234:         icon: BanknotesIcon,
235:         children: [
236:           { name: "Payroll Process", tab: "Payroll Process" },
237:           { name: "Payslip", tab: "Payslip" },
238:           { name: "Loan Management", tab: "Loan Management" },
239:           { name: "ESI Management", tab: "ESI Management" },
240:           { name: "Professional Tax (PT)", tab: "Professional Tax (PT)" },
241:           { name: "Reports", tab: "Reports" },
242:           { name: "Salary Structure", tab: "Salary Structure" }
243:         ]
244:       },
245:       {
246:         name: "Performance",
247:         categoryKey: "PERFORMANCE",
248:         icon: PresentationChartBarIcon,
249:         children: [
250:           { name: "Dashboard", tab: "Performance Dashboard" },
251:           { name: "Performance Master", tab: "Performance Reviews" },
252:           { name: "KPI", tab: "KPI & OKR" },
253:           { name: "Goals", tab: "Goals" },
254:           { name: "Appraisal", tab: "Performance Reviews" },
255:           { name: "Promotion", tab: "Promotion" },
256:           { name: "Increment", tab: "Increment" },
257:           { name: "Reports", tab: "Reports" }
258:         ]
259:       },
260:       {
261:         name: "Learning",
262:         categoryKey: "LEARNING",
263:         icon: AcademicCapIcon,
264:         children: [
265:           { name: "Dashboard", tab: "Learning Dashboard" },
266:           { name: "Training", tab: "Training" },
267:           { name: "LMS", tab: "LMS Progress" },
268:           { name: "Courses", tab: "Courses" },
269:           { name: "Certification", tab: "Certification" },
270:           { name: "Reports", tab: "Reports" }
271:         ]
272:       },
273:       {
274:         name: "Asset Management",
275:         categoryKey: "ASSET_MGMT",
276:         icon: BuildingOffice2Icon,
277:         children: [
278:           { name: "Dashboard", tab: "Asset Dashboard" },
279:           { name: "Asset List", tab: "Inventory" },
280:           { name: "Asset Allocation", tab: "Asset Allocation" },
281:           { name: "Asset Return", tab: "Asset Return" },
282:           { name: "Asset History", tab: "Asset History" },
283:           { name: "Maintenance", tab: "Maintenance" },
284:           { name: "Reports", tab: "Reports" }
285:         ]
286:       },
287:       {
288:         name: "Document Management",
289:         categoryKey: "DOCUMENT_MGMT",
290:         icon: DocumentDuplicateIcon,
291:         children: [
292:           { name: "Offer Letter", tab: "Offer Letter" },
293:           { name: "Appointment Letter", tab: "Appointment Letter" },
294:           { name: "Promotion Letter", tab: "Promotion Letter" },
295:           { name: "Increment Letter", tab: "Increment Letter" },
296:           { name: "Warning Letter", tab: "Warning Letter" },
297:           { name: "Contracts", tab: "Contracts" },
298:           { name: "Salary Slip", tab: "Salary Slip" },
299:           { name: "Form 16", tab: "Form 16" },
300:           { name: "Policies", tab: "Policies" },
301:           { name: "Reports", tab: "Document Log" }
302:         ]
303:       },
304:       {
305:         name: "Employee Exit",
306:         categoryKey: "EXIT_MGMT",
307:         icon: ArrowRightOnRectangleIcon,
308:         children: [
309:           { name: "Resignation", tab: "Resignation" },
310:           { name: "Notice Period", tab: "Notice Period" },
311:           { name: "Exit Clearance", tab: "Exit Logs" },
312:           { name: "Asset Return", tab: "Asset Return" },
313:           { name: "No Dues", tab: "No Dues" },
314:           { name: "F&F Settlement", tab: "F&F Settlement" },
315:           { name: "Exit Interview", tab: "Exit Interview" },
316:           { name: "Experience Letter", tab: "Experience Letter" }
317:         ]
318:       },
319:       {
320:         name: "Workflow & Approval",
321:         categoryKey: "WORKFLOW",
322:         icon: InboxStackIcon,
323:         children: [
324:           { name: "Dashboard", tab: "Workflow Dashboard" },
325:           { name: "Leave Approval", tab: "Approvals Pending" },
326:           { name: "Expense Approval", tab: "Expense Claims" },
327:           { name: "Recruitment Approval", tab: "Recruitment Approval" },
328:           { name: "Promotion Approval", tab: "Promotion Approval" },
329:           { name: "Transfer Approval", tab: "Transfer Approval" },
330:           { name: "Separation Approval", tab: "Separation Approval" },
331:           { name: "Approval History", tab: "Approval History" }
332:         ]
333:       },
334:       {
335:         name: "Employee Engagement",
336:         categoryKey: "ENGAGEMENT",
337:         icon: ChatBubbleLeftRightIcon,
338:         children: [
339:           { name: "Announcements", tab: "Announcements & Surveys" },
340:           { name: "News", tab: "News" },
341:           { name: "Events", tab: "Events" },
342:           { name: "Birthday", tab: "Birthday" },
343:           { name: "Work Anniversary", tab: "Work Anniversary" },
344:           { name: "Rewards", tab: "Rewards" },
345:           { name: "Survey", tab: "Announcements & Surveys" },
346:           { name: "Feedback", tab: "Feedback" }
347:         ]
348:       },
349:       {
350:         name: "Helpdesk",
351:         categoryKey: "HELPDESK",
352:         icon: ChatBubbleLeftRightIcon,
353:         children: [
354:           { name: "Dashboard", tab: "Helpdesk Dashboard" },
355:           { name: "Tickets", tab: "HR Tickets" },
356:           { name: "Complaints", tab: "Complaint Management" },
357:           { name: "Service Request", tab: "Service Requests" },
358:           { name: "Query Resolution", tab: "Query Resolution" },
359:           { name: "Tracking", tab: "Ticket Tracking" }
360:         ]
361:       },
362:       {
363:         name: "Reports",
364:         categoryKey: "REPORTS",
365:         icon: PresentationChartBarIcon,
366:         children: [
367:           { name: "Employee", tab: "Employee Report" },
368:           { name: "Attendance", tab: "Attendance Report" },
369:           { name: "Leave", tab: "Leave Report" },
370:           { name: "Payroll", tab: "Payroll Report" },
371:           { name: "Recruitment", tab: "Recruitment Report" },
372:           { name: "Performance", tab: "Performance Report" },
373:           { name: "Training", tab: "Training Report" },
374:           { name: "Compliance", tab: "Compliance Report" },
375:           { name: "Attrition", tab: "Attrition Report" },
376:           { name: "Custom Reports", tab: "Custom Reports" }
377:         ]
378:       },
379:       {
380:         name: "Notifications",
381:         categoryKey: "NOTIFICATIONS",
382:         icon: BellIcon,
383:         children: [
384:           { name: "Email", tab: "Email Notifications" },
385:           { name: "SMS", tab: "SMS Notifications" },
386:           { name: "Push", tab: "Push Notifications" },
387:           { name: "Approval Alerts", tab: "Approval Alerts" },
388:           { name: "Birthday Alerts", tab: "Birthday Alerts" },
389:           { name: "Policy Updates", tab: "Policy Updates" }
390:         ]
391:       },
392:       {
393:         name: "Departments",
394:         categoryKey: "DEPARTMENT",
395:         icon: UserGroupIcon,
396:         children: departmentChildren
397:       },
398:       {
399:         name: "Settings",
400:         categoryKey: "SETTINGS",
401:         icon: Cog6ToothIcon,
402:         children: [
403:           { name: "Company Settings", tab: "Company Settings" },
404:           { name: "Attendance Settings", tab: "Attendance Settings" },
405:           { name: "Leave Settings", tab: "Leave Settings" },
406:           { name: "Payroll Settings", tab: "Payroll Settings" },
407:           { name: "Shift Settings", tab: "Shift Settings" },
408:           { name: "Notification Settings", tab: "Notification Settings" },
409:           { name: "Email Templates", tab: "Email Templates" },
410:           { name: "Document Templates", tab: "Document Templates" },
411:           { name: "Security", tab: "Security" },
412:           { name: "Audit Logs", tab: "Audit Logs" }
413:         ]
414:       }
415:     ];
416:   }, [departmentsList, user]);
417: 
418:   const employeeMenuItems = useMemo(() => {
419:     return [
420:       {
421:         name: "Dashboard",
422:         categoryKey: "EMP_DASHBOARD",
423:         icon: HomeIcon,
424:         children: [
425:           { name: "Dashboard Home", tab: "Dashboard Home" },
426:           { name: "Welcome Card", tab: "Welcome Card" },
427:           { name: "Employee Summary", tab: "Employee Summary" },
428:           { name: "Quick Actions", tab: "Quick Actions" },
429:           { name: "Today's Attendance", tab: "Today's Attendance" },
430:           { name: "Leave Balance", tab: "Leave Balance" },
431:           { name: "Working Hours", tab: "Working Hours" },
432:           { name: "Pending Requests", tab: "Pending Requests" },
433:           { name: "Assigned Assets", tab: "Assigned Assets" },
434:           { name: "Upcoming Holidays", tab: "Upcoming Holidays" },
435:           { name: "Upcoming Birthdays", tab: "Upcoming Birthdays" },
436:           { name: "Work Anniversary", tab: "Work Anniversary" },
437:           { name: "Announcements", tab: "Announcements" },
438:           { name: "Notifications", tab: "Notifications" },
439:           { name: "Performance Summary", tab: "Performance Summary" },
440:           { name: "Training Progress", tab: "Training Progress" },
441:           { name: "Recent Activities", tab: "Recent Activities" }
442:         ]
443:       },
444:       {
445:         name: "Employee Management",
446:         categoryKey: "EMPLOYEE_MGMT",
447:         icon: UserGroupIcon,
448:         children: [
449:           { name: "Employee Dashboard", tab: "Employee Dashboard" },
450:           { name: "Fill Details", tab: "Employee Profile" },
451:           { name: "Documents", tab: "Document Log" },
452:           { name: "Assets", tab: "Asset Allocation" },
453:           { name: "Bank Details", tab: "Bank Details" },
454:           { name: "Salary Details", tab: "Salary Structure" },
455:           { name: "Reporting Manager", tab: "Reporting Hierarchy" },
456:           { name: "Employee Timeline", tab: "Employee Timeline" }
457:         ]
458:       },
459: 
460:       {
461:         name: "Attendance",
462:         categoryKey: "EMP_ATTENDANCE",
463:         icon: ClockIcon,
464:         children: [
465:           { name: "Check In", tab: "Check In" },
466:           { name: "Check Out", tab: "Check Out" },
467:           { name: "Today's Attendance", tab: "Today's Attendance" },
468:           { name: "Attendance Calendar", tab: "Attendance Calendar" },
469:           { name: "Attendance History", tab: "Attendance History" },
470:           { name: "Monthly Attendance", tab: "Monthly Attendance" },
471:           { name: "Shift Details", tab: "Shift Details" },
472:           { name: "Overtime", tab: "Overtime" },
473:           { name: "Attendance Regularization", tab: "Attendance Regularization" },
474:           { name: "Biometric Logs", tab: "Biometric Logs" },
475:           { name: "Attendance Reports", tab: "Attendance Reports" }
476:         ]
477:       },
478:       {
479:         name: "Leave Management",
480:         categoryKey: "EMP_LEAVE",
481:         icon: CalendarDaysIcon,
482:         children: [
483:           { name: "Apply Leave", tab: "Apply Leave" },
484:           { name: "Leave Balance", tab: "Leave Balance" },
485:           { name: "Leave History", tab: "Leave History" },
486:           { name: "Leave Calendar", tab: "Leave Calendar" },
487:           { name: "Holiday Calendar", tab: "Holiday Calendar" },
488:           { name: "Comp-Off", tab: "Comp-Off" },
489:           { name: "Leave Status", tab: "Leave Status" },
490:           { name: "Leave Approval History", tab: "Leave Approval History" },
491:           { name: "Leave Reports", tab: "Leave Reports" }
492:         ]
493:       },
494:       {
495:         name: "Payroll",
496:         categoryKey: "EMP_PAYROLL",
497:         icon: BanknotesIcon,
498:         children: [
499:           { name: "Salary Slips", tab: "Salary Slips" },
500:           { name: "Salary Structure", tab: "Salary Structure" },
501:           { name: "Payroll History", tab: "Payroll History" },
502:           { name: "Tax Details", tab: "Tax Details" },
503:           { name: "PF Details", tab: "PF Details" },
504:           { name: "ESI Details", tab: "ESI Details" },
505:           { name: "Loan Details", tab: "Loan Details" },
506:           { name: "Reimbursements", tab: "Reimbursements" },
507:           { name: "Form-16", tab: "Form-16" },
508:           { name: "Payroll Reports", tab: "Payroll Reports" }
509:         ]
510:       },
511:       {
512:         name: "Performance",
513:         categoryKey: "EMP_PERFORMANCE",
514:         icon: PresentationChartBarIcon,
515:         children: [
516:           { name: "Goals", tab: "Goals" },
517:           { name: "KPI", tab: "KPI" },
518:           { name: "OKR", tab: "OKR" },
519:           { name: "Self Appraisal", tab: "Self Appraisal" },
520:           { name: "Manager Feedback", tab: "Manager Feedback" },
521:           { name: "Performance Rating", tab: "Performance Rating" },
522:           { name: "Promotions", tab: "Promotions" },
523:           { name: "Increments", tab: "Increments" },
524:           { name: "Performance History", tab: "Performance History" }
525:         ]
526:       },
527:       {
528:         name: "Learning & Training",
529:         categoryKey: "EMP_LEARNING",
530:         icon: AcademicCapIcon,
531:         children: [
532:           { name: "Assigned Courses", tab: "Assigned Courses" },
533:           { name: "My Learning", tab: "My Learning" },
534:           { name: "Training Calendar", tab: "Training Calendar" },
535:           { name: "Certifications", tab: "Certifications" },
536:           { name: "Assessments", tab: "Assessments" },
537:           { name: "Quiz", tab: "Quiz" },
538:           { name: "Training Feedback", tab: "Training Feedback" },
539:           { name: "Learning Reports", tab: "Learning Reports" }
540:         ]
541:       },
542:       {
543:         name: "Asset Management",
544:         categoryKey: "EMP_ASSETS",
545:         icon: BriefcaseIcon,
546:         children: [
547:           { name: "Assigned Assets", tab: "Assigned Assets" },
548:           { name: "Asset Requests", tab: "Asset Requests" },
549:           { name: "Asset Return", tab: "Asset Return" },
550:           { name: "Asset History", tab: "Asset History" },
551:           { name: "Software Licenses", tab: "Software Licenses" },
552:           { name: "Asset Documents", tab: "Asset Documents" }
553:         ]
554:       },
555:       {
556:         name: "Travel & Expense",
557:         categoryKey: "EMP_TRAVEL_EXPENSE",
558:         icon: InboxStackIcon,
559:         children: [
560:           { name: "Travel Request", tab: "Travel Request" },
561:           { name: "Travel History", tab: "Travel History" },
562:           { name: "Expense Claims", tab: "Expense Claims" },
563:           { name: "Bills Upload", tab: "Bills Upload" },
564:           { name: "Reimbursements", tab: "Reimbursements" },
565:           { name: "Expense Reports", tab: "Expense Reports" }
566:         ]
567:       },
568:       {
569:         name: "Documents",
570:         categoryKey: "EMP_DOCUMENTS",
571:         icon: DocumentDuplicateIcon,
572:         children: [
573:           { name: "Offer Letter", tab: "Offer Letter" },
574:           { name: "Appointment Letter", tab: "Appointment Letter" },
575:           { name: "Confirmation Letter", tab: "Confirmation Letter" },
576:           { name: "Promotion Letter", tab: "Promotion Letter" },
577:           { name: "Increment Letter", tab: "Increment Letter" },
578:           { name: "Experience Letter", tab: "Experience Letter" },
579:           { name: "Salary Slips", tab: "Salary Slips" },
580:           { name: "Tax Documents", tab: "Tax Documents" },
581:           { name: "Company Policies", tab: "Company Policies" },
582:           { name: "Personal Documents", tab: "Personal Documents" }
583:         ]
584:       },
585:       {
586:         name: "Helpdesk",
587:         categoryKey: "EMP_HELPDESK",
588:         icon: WrenchScrewdriverIcon,
589:         children: [
590:           { name: "Raise Ticket", tab: "Raise Ticket" },
591:           { name: "My Tickets", tab: "My Tickets" },
592:           { name: "Ticket Status", tab: "Ticket Status" },
593:           { name: "Service Requests", tab: "Service Requests" },
594:           { name: "Ticket History", tab: "Ticket History" }
595:         ]
596:       },
597:       {
598:         name: "Employee Engagement",
599:         categoryKey: "EMP_ENGAGEMENT",
600:         icon: MegaphoneIcon,
601:         children: [
602:           { name: "Announcements", tab: "Announcements" },
603:           { name: "Company News", tab: "Company News" },
604:           { name: "Events", tab: "Events" },
605:           { name: "Birthdays", tab: "Birthdays" },
606:           { name: "Work Anniversaries", tab: "Work Anniversaries" },
607:           { name: "Surveys", tab: "Surveys" },
608:           { name: "Polls", tab: "Polls" },
609:           { name: "Recognition", tab: "Recognition" },
610:           { name: "Rewards", tab: "Rewards" }
611:         ]
612:       },
613:       {
614:         name: "Notifications",
615:         categoryKey: "EMP_NOTIFICATIONS",
616:         icon: BellIcon,
617:         children: [
618:           { name: "Inbox", tab: "Inbox" },
619:           { name: "Email Notifications", tab: "Email Notifications" },
620:           { name: "Push Notifications", tab: "Push Notifications" },
621:           { name: "Approval Alerts", tab: "Approval Alerts" },
622:           { name: "HR Notifications", tab: "HR Notifications" },
623:           { name: "System Notifications", tab: "System Notifications" }
624:         ]
625:       },
626:       {
627:         name: "Reports",
628:         categoryKey: "EMP_REPORTS",
629:         icon: PresentationChartBarIcon,
630:         children: [
631:           { name: "Attendance Report", tab: "Attendance Report" },
632:           { name: "Leave Report", tab: "Leave Report" },
633:           { name: "Payroll Report", tab: "Payroll Report" },
634:           { name: "Performance Report", tab: "Performance Report" },
635:           { name: "Training Report", tab: "Training Report" },
636:           { name: "Asset Report", tab: "Asset Report" },
637:           { name: "Expense Report", tab: "Expense Report" }
638:         ]
639:       },
640:       {
641:         name: "Settings",
642:         categoryKey: "EMP_SETTINGS",
643:         icon: Cog6ToothIcon,
644:         children: [
645:           { name: "Change Password", tab: "Change Password" },
646:           { name: "Two-Factor Authentication", tab: "Two-Factor Authentication" },
647:           { name: "Security Settings", tab: "Security Settings" },
648:           { name: "Notification Preferences", tab: "Notification Preferences" },
649:           { name: "Language", tab: "Language" },
650:           { name: "Theme", tab: "Theme" },
651:           { name: "Privacy Settings", tab: "Privacy Settings" },
652:           { name: "Logout", tab: "Logout" }
653:         ]
654:       }
655:     ];
656:   }, []);
657: 
658:   // Auto-expand category accordions on mount or query updates
659:   useEffect(() => {
660:     const activeCategory = searchParams.get("category");
661:     if (activeCategory) {
662:       const match = menuItems.find((item) => item.categoryKey === activeCategory);
663:       if (match) {
664:         setOpenMenus((prev) => ({ ...prev, [match.name]: true }));
665:       }
666:     }
667:   }, [searchParams]);
668: 
669:   const toggleMenu = (name) => {
670:     setOpenMenus((prev) => ({
671:       ...prev,
672:       [name]: !prev[name],
673:     }));
674:   };
675: 
676:   const closeOnMobile = () => {
677:     if (window.matchMedia("(max-width: 1023px)").matches) {
678:       setIsOpen(false);
679:     }
680:   };
681: 
682:   const userRoleStr = typeof user?.role === "object" ? user?.role?.name : user?.role;
683:   const isEmployee = String(userRoleStr || "").toLowerCase() === "employee";
684:   const isSuperAdmin = String(userRoleStr || "").toLowerCase() === "superadmin" || String(userRoleStr || "").toLowerCase() === "super admin" || user?.email === "superadmin@nib.com";
685:   const hasAssignedModules = Array.isArray(user?.assignedModules) && user.assignedModules.length > 0;
686: 
687:   const activeMenuItems = useMemo(() => {
688:     let items = [];
689: 
690:     if (isEmployee) {
691:       items = [...employeeMenuItems];
692:     } else if (!isSuperAdmin && hasAssignedModules) {
693:       const allowed = user.assignedModules.map(m => String(m).toLowerCase().trim());
694:       
695:       const filteredStandard = menuItems.map(item => {
696:         const itemNameLower = String(item.name).toLowerCase().trim();
697: 
698:         // Check if it's a top level link (like Dashboard Overview)
699:         if (!item.children) {
700:           const isAllowed = allowed.includes("dashboard") || allowed.includes("dashboard overview");
701:           return isAllowed ? item : null;
702:         }
703: 
704:         if (item.categoryKey === "PROFILE") {
705:           return item;
706:         }
707: 
708:         // The category must be explicitly checked in the assigned modules list
709:         const isCatAllowed = allowed.includes(itemNameLower);
710:         if (!isCatAllowed) {
711:           return null;
712:         }
713: 
714:         return item;
715:       }).filter(Boolean);
716: 
717:       // Dynamically add custom modules assigned to this user/department
718:       const customAssigned = user.assignedModules.filter(mod => {
719:         const modLower = String(mod).toLowerCase().trim();
720:         const matchesStandard = menuItems.some(item => {
721:           if (!item.children) return modLower === "dashboard" || modLower === "dashboard overview";
722:           const categoryName = String(item.name).toLowerCase().trim();
723:           return categoryName === modLower;
724:         });
725:         return !matchesStandard;
726:       });
727: 
728:       if (customAssigned.length > 0) {
729:         const customMenuItems = customAssigned.map(customMod => ({
730:           name: customMod,
731:           icon: CubeIcon,
732:           children: [
733:             {
734:               name: `${customMod} Workspace`,
735:               path: `/department/${customMod.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
736:               icon: DocumentTextIcon
737:             }
738:           ]
739:         }));
740:         items = [...filteredStandard, ...customMenuItems];
741:       } else {
742:         items = filteredStandard;
743:       }
744:     } else {
745:       items = [...menuItems];
746:     }
747:     return items;
748:   }, [isEmployee, isSuperAdmin, hasAssignedModules, user?.assignedModules, employeeMenuItems, menuItems]);
749: 
750:   