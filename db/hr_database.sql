-- XAMPP-Lite
-- version 8.5.5
-- https://xampplite.sf.net/
--
-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 15, 2026 at 11:23 AM
-- Server version: 11.4.10-MariaDB-log
-- PHP Version: 8.5.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `departmentdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements_surveys`
--

CREATE TABLE `announcements_surveys` (
  `id` int(11) NOT NULL,
  `postId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT 'Announcement',
  `publishDate` varchar(255) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `asset_allocation`
--

CREATE TABLE `asset_allocation` (
  `id` int(11) NOT NULL,
  `allocationId` varchar(255) NOT NULL,
  `employee` varchar(255) NOT NULL,
  `empId` varchar(255) DEFAULT NULL,
  `employeeId` int(11) DEFAULT NULL,
  `assetCategory` varchar(255) DEFAULT NULL,
  `assetName` varchar(255) DEFAULT NULL,
  `assetCode` varchar(255) DEFAULT NULL,
  `serialNumber` varchar(255) DEFAULT NULL,
  `issueDate` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Assigned'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ats_applicant_tracking`
--

CREATE TABLE `ats_applicant_tracking` (
  `id` int(11) NOT NULL,
  `appId` varchar(255) NOT NULL,
  `candidate` varchar(255) DEFAULT NULL,
  `candidateId` int(11) DEFAULT NULL,
  `jobPosting` varchar(255) DEFAULT NULL,
  `recruitmentId` int(11) DEFAULT NULL,
  `appliedDate` varchar(255) DEFAULT NULL,
  `stage` varchar(255) DEFAULT 'Screening',
  `recruiter` varchar(255) DEFAULT NULL,
  `interviewerId` int(11) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `branch`
--

CREATE TABLE `branch` (
  `id` int(11) NOT NULL,
  `branchCode` varchar(255) NOT NULL,
  `branchName` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `companyId` int(11) DEFAULT NULL,
  `branchType` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `district` varchar(255) DEFAULT NULL,
  `pincode` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `manager` varchar(255) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `workingDays` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `candidate_database`
--

CREATE TABLE `candidate_database` (
  `id` int(11) NOT NULL,
  `candidateId` varchar(255) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `qualification` varchar(255) DEFAULT NULL,
  `experience` decimal(5,2) DEFAULT NULL,
  `currentCompany` varchar(255) DEFAULT NULL,
  `expectedSalary` varchar(255) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Applied'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company`
--

CREATE TABLE `company` (
  `id` int(11) NOT NULL,
  `companyCode` varchar(255) NOT NULL,
  `companyName` varchar(255) NOT NULL,
  `shortName` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `regNumber` varchar(255) DEFAULT NULL,
  `cinNumber` varchar(255) DEFAULT NULL,
  `panNumber` varchar(255) DEFAULT NULL,
  `tanNumber` varchar(255) DEFAULT NULL,
  `gstNumber` varchar(255) DEFAULT NULL,
  `pfNumber` varchar(255) DEFAULT NULL,
  `esiNumber` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address1` varchar(255) DEFAULT NULL,
  `address2` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `district` varchar(255) DEFAULT NULL,
  `pincode` varchar(255) DEFAULT NULL,
  `timezone` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `financialYear` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_attendance`
--

CREATE TABLE `daily_attendance` (
  `id` int(11) NOT NULL,
  `empId` varchar(255) NOT NULL,
  `employeeId` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `date` varchar(255) NOT NULL,
  `checkIn` varchar(255) DEFAULT NULL,
  `checkOut` varchar(255) DEFAULT NULL,
  `workingHours` decimal(4,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Present',
  `lateComing` int(11) DEFAULT NULL,
  `earlyLeaving` int(11) DEFAULT NULL,
  `overtime` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `id` int(11) NOT NULL,
  `deptCode` varchar(255) NOT NULL,
  `deptName` varchar(255) NOT NULL,
  `head` varchar(255) DEFAULT NULL,
  `parentDept` varchar(255) DEFAULT NULL,
  `parentDeptId` int(11) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `companyId` int(11) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `branchId` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_profile`
--

CREATE TABLE `employee_profile` (
  `id` int(11) NOT NULL,
  `empCode` varchar(255) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `dob` varchar(255) DEFAULT NULL,
  `maritalStatus` varchar(255) DEFAULT NULL,
  `nationality` varchar(255) DEFAULT NULL,
  `employmentStatus` varchar(255) DEFAULT 'Active',
  `employmentType` varchar(255) DEFAULT NULL,
  `joiningDate` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `departmentId` int(11) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `manager` varchar(255) DEFAULT NULL,
  `managerId` int(11) DEFAULT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `branchId` int(11) DEFAULT NULL,
  `shift` varchar(255) DEFAULT NULL,
  `companyEmail` varchar(255) DEFAULT NULL,
  `personalEmail` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `bankName` varchar(255) DEFAULT NULL,
  `accountNo` varchar(255) DEFAULT NULL,
  `ifscCode` varchar(255) DEFAULT NULL,
  `pan` varchar(255) DEFAULT NULL,
  `aadhaar` varchar(255) DEFAULT NULL,
  `pfNum` varchar(255) DEFAULT NULL,
  `esicNum` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `companyId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hr_tickets`
--

CREATE TABLE `hr_tickets` (
  `id` int(11) NOT NULL,
  `ticketNo` varchar(255) NOT NULL,
  `empName` varchar(255) NOT NULL,
  `employeeId` int(11) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `priority` varchar(255) DEFAULT 'Medium',
  `assignedTo` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_requisition`
--

CREATE TABLE `job_requisition` (
  `id` int(11) NOT NULL,
  `reqId` varchar(255) NOT NULL,
  `jobTitle` varchar(255) NOT NULL,
  `department` varchar(255) DEFAULT NULL,
  `departmentId` int(11) DEFAULT NULL,
  `vacancies` int(11) DEFAULT NULL,
  `employmentType` varchar(255) DEFAULT NULL,
  `experienceRequired` varchar(255) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `budgetSalary` varchar(255) DEFAULT NULL,
  `joiningDate` varchar(255) DEFAULT NULL,
  `approvalStatus` varchar(255) DEFAULT 'Pending',
  `status` varchar(255) DEFAULT 'Open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `reqId` varchar(255) NOT NULL,
  `empName` varchar(255) NOT NULL,
  `employeeId` int(11) DEFAULT NULL,
  `leaveType` varchar(255) NOT NULL,
  `fromDate` varchar(255) NOT NULL,
  `toDate` varchar(255) NOT NULL,
  `totalDays` decimal(4,1) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `recipientId` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(255) DEFAULT 'System',
  `isRead` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payrolls`
--

CREATE TABLE `payrolls` (
  `id` int(11) NOT NULL,
  `employeeId` int(11) NOT NULL,
  `month` varchar(255) NOT NULL,
  `year` varchar(255) NOT NULL,
  `basicSalary` decimal(12,2) DEFAULT NULL,
  `allowances` decimal(12,2) DEFAULT NULL,
  `deductions` decimal(12,2) DEFAULT NULL,
  `netPay` decimal(12,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Draft',
  `paymentDate` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rbac_roles`
--

CREATE TABLE `rbac_roles` (
  `id` int(11) NOT NULL,
  `roleName` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` int(11) DEFAULT 0,
  `status` varchar(255) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rbac_roles`
--

INSERT INTO `rbac_roles` (`id`, `roleName`, `description`, `permissions`, `status`) VALUES
(1, 'Admin', 'System administrator with complete access rights.', 0, 'Active'),
(2, 'Manager', 'Department manager with administrative privileges.', 0, 'Active'),
(3, 'Employee', 'Standard employee with employee portal rights.', 0, 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `roleId` int(11) NOT NULL,
  `permissionId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salary_structure`
--

CREATE TABLE `salary_structure` (
  `id` int(11) NOT NULL,
  `empName` varchar(255) NOT NULL,
  `employeeId` int(11) DEFAULT NULL,
  `basic` decimal(12,2) NOT NULL,
  `hra` decimal(12,2) DEFAULT NULL,
  `da` decimal(12,2) DEFAULT NULL,
  `special` decimal(12,2) DEFAULT NULL,
  `conveyance` decimal(12,2) DEFAULT NULL,
  `gross` decimal(12,2) DEFAULT NULL,
  `pfDeduction` decimal(12,2) DEFAULT NULL,
  `esiDeduction` decimal(12,2) DEFAULT NULL,
  `pt` decimal(12,2) DEFAULT NULL,
  `tds` decimal(12,2) DEFAULT NULL,
  `netSalary` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shift_master`
--

CREATE TABLE `shift_master` (
  `id` int(11) NOT NULL,
  `shiftCode` varchar(255) NOT NULL,
  `shiftName` varchar(255) NOT NULL,
  `startTime` varchar(255) NOT NULL,
  `endTime` varchar(255) NOT NULL,
  `graceTime` int(11) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `roleId` int(11) DEFAULT NULL,
  `refreshToken` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements_surveys`
--
ALTER TABLE `announcements_surveys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `postId` (`postId`);

--
-- Indexes for table `asset_allocation`
--
ALTER TABLE `asset_allocation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `allocationId` (`allocationId`),
  ADD UNIQUE KEY `allocationId_2` (`allocationId`),
  ADD KEY `employeeId` (`employeeId`);

--
-- Indexes for table `ats_applicant_tracking`
--
ALTER TABLE `ats_applicant_tracking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `appId` (`appId`),
  ADD UNIQUE KEY `appId_2` (`appId`),
  ADD KEY `candidateId` (`candidateId`),
  ADD KEY `recruitmentId` (`recruitmentId`),
  ADD KEY `interviewerId` (`interviewerId`);

--
-- Indexes for table `branch`
--
ALTER TABLE `branch`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branchCode` (`branchCode`),
  ADD UNIQUE KEY `branchCode_2` (`branchCode`),
  ADD KEY `companyId` (`companyId`);

--
-- Indexes for table `candidate_database`
--
ALTER TABLE `candidate_database`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `candidateId` (`candidateId`),
  ADD UNIQUE KEY `candidateId_2` (`candidateId`);

--
-- Indexes for table `company`
--
ALTER TABLE `company`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `companyCode` (`companyCode`),
  ADD UNIQUE KEY `companyCode_2` (`companyCode`);

--
-- Indexes for table `daily_attendance`
--
ALTER TABLE `daily_attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employeeId` (`employeeId`);

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `deptCode` (`deptCode`),
  ADD UNIQUE KEY `deptCode_2` (`deptCode`),
  ADD KEY `parentDeptId` (`parentDeptId`),
  ADD KEY `companyId` (`companyId`),
  ADD KEY `branchId` (`branchId`);

--
-- Indexes for table `employee_profile`
--
ALTER TABLE `employee_profile`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `empCode` (`empCode`),
  ADD UNIQUE KEY `empCode_2` (`empCode`),
  ADD KEY `departmentId` (`departmentId`),
  ADD KEY `managerId` (`managerId`),
  ADD KEY `branchId` (`branchId`),
  ADD KEY `userId` (`userId`),
  ADD KEY `companyId` (`companyId`);

--
-- Indexes for table `hr_tickets`
--
ALTER TABLE `hr_tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticketNo` (`ticketNo`);

--
-- Indexes for table `job_requisition`
--
ALTER TABLE `job_requisition`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reqId` (`reqId`),
  ADD UNIQUE KEY `reqId_2` (`reqId`),
  ADD KEY `departmentId` (`departmentId`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reqId` (`reqId`),
  ADD UNIQUE KEY `reqId_2` (`reqId`),
  ADD KEY `employeeId` (`employeeId`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employeeId` (`employeeId`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `name_2` (`name`);

--
-- Indexes for table `rbac_roles`
--
ALTER TABLE `rbac_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roleName` (`roleName`),
  ADD UNIQUE KEY `roleName_2` (`roleName`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`roleId`,`permissionId`);

--
-- Indexes for table `salary_structure`
--
ALTER TABLE `salary_structure`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employeeId` (`employeeId`);

--
-- Indexes for table `shift_master`
--
ALTER TABLE `shift_master`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shiftCode` (`shiftCode`),
  ADD UNIQUE KEY `shiftCode_2` (`shiftCode`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD KEY `roleId` (`roleId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements_surveys`
--
ALTER TABLE `announcements_surveys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `asset_allocation`
--
ALTER TABLE `asset_allocation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ats_applicant_tracking`
--
ALTER TABLE `ats_applicant_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `branch`
--
ALTER TABLE `branch`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `candidate_database`
--
ALTER TABLE `candidate_database`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company`
--
ALTER TABLE `company`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_attendance`
--
ALTER TABLE `daily_attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_profile`
--
ALTER TABLE `employee_profile`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hr_tickets`
--
ALTER TABLE `hr_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_requisition`
--
ALTER TABLE `job_requisition`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payrolls`
--
ALTER TABLE `payrolls`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rbac_roles`
--
ALTER TABLE `rbac_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `salary_structure`
--
ALTER TABLE `salary_structure`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shift_master`
--
ALTER TABLE `shift_master`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asset_allocation`
--
ALTER TABLE `asset_allocation`
  ADD CONSTRAINT `asset_allocation_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employee_profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ats_applicant_tracking`
--
ALTER TABLE `ats_applicant_tracking`
  ADD CONSTRAINT `ats_applicant_tracking_ibfk_1` FOREIGN KEY (`candidateId`) REFERENCES `candidate_database` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ats_applicant_tracking_ibfk_2` FOREIGN KEY (`recruitmentId`) REFERENCES `job_requisition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ats_applicant_tracking_ibfk_3` FOREIGN KEY (`interviewerId`) REFERENCES `employee_profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `branch`
--
ALTER TABLE `branch`
  ADD CONSTRAINT `branch_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `daily_attendance`
--
ALTER TABLE `daily_attendance`
  ADD CONSTRAINT `daily_attendance_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employee_profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `department`
--
ALTER TABLE `department`
  ADD CONSTRAINT `department_ibfk_1` FOREIGN KEY (`parentDeptId`) REFERENCES `department` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `department_ibfk_2` FOREIGN KEY (`companyId`) REFERENCES `company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `department_ibfk_3` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employee_profile`
--
ALTER TABLE `employee_profile`
  ADD CONSTRAINT `employee_profile_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_profile_ibfk_2` FOREIGN KEY (`managerId`) REFERENCES `employee_profile` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_profile_ibfk_3` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_profile_ibfk_4` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `employee_profile_ibfk_5` FOREIGN KEY (`companyId`) REFERENCES `company` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `job_requisition`
--
ALTER TABLE `job_requisition`
  ADD CONSTRAINT `job_requisition_ibfk_1` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employee_profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payrolls`
--
ALTER TABLE `payrolls`
  ADD CONSTRAINT `payrolls_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employee_profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `salary_structure`
--
ALTER TABLE `salary_structure`
  ADD CONSTRAINT `salary_structure_ibfk_1` FOREIGN KEY (`employeeId`) REFERENCES `employee_profile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`roleId`) REFERENCES `rbac_roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
