// backend/controllers/finance/loan.controller.js
const loanService = require('../../services/finance/loan.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const requestLoan = asyncHandler(async (req, res) => {
  const loan = await loanService.createLoanRequest(req.body, req.user);
  res.status(201).json(new ApiResponse(201, loan, 'Loan request submitted successfully.'));
});

const getLoans = asyncHandler(async (req, res) => {
  const loans = await loanService.getLoans(req.query, req.user);
  res.status(200).json(new ApiResponse(200, loans, 'Loans retrieved successfully.'));
});

const getLoanDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const loan = await loanService.getLoanDetails(id, req.user);
  res.status(200).json(new ApiResponse(200, loan, 'Loan details retrieved successfully.'));
});

const approveLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const loan = await loanService.approveLoan(id, req.body, req.user?.id);
  res.status(200).json(new ApiResponse(200, loan, 'Loan approved and EMI schedule generated.'));
});

const rejectLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const loan = await loanService.rejectLoan(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, loan, 'Loan request rejected.'));
});

const getLoanRepayments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const repayments = await loanService.getRepayments(id, req.user);
  res.status(200).json(new ApiResponse(200, repayments, 'Loan repayment history retrieved.'));
});

const closeLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const loan = await loanService.closeLoan(id, req.user?.id);
  res.status(200).json(new ApiResponse(200, loan, 'Loan closed manually successfully.'));
});

module.exports = {
  requestLoan,
  getLoans,
  getLoanDetails,
  approveLoan,
  rejectLoan,
  getLoanRepayments,
  closeLoan,
};
