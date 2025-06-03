import { Elysia, t } from 'elysia';
import { ExpenseRequest, ExpenseRequestStatus, ExpenseCategory } from '../models/expenseRequest';
import { isAuthenticated } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { NotificationService } from '../services/notifications';
import { NotificationType } from '../models/notification';
import mongoose from 'mongoose';

// Expense request routes
export const expenseRequestRoutes = new Elysia().group(
  '/api/expense-requests',
  (app) =>
    app
      // Get all expense requests
      .get(
        '/',
        async ({ query, user }) => {
          const {
            page = 1,
            limit = 10,
            status,
            startDate,
            endDate,
            search,
            category,
            sortBy = 'createdAt',
            sortOrder = 'desc',
          } = query;
          const skip = (page - 1) * limit;

          // Build filter
          const filter: any = {
            userId: user._id,
            companyId: user.companyId,
          };

          // Add status filter
          if (status) {
            filter.status = status;
          }

          // Add category filter
          if (category) {
            filter.category = category;
          }

          // Add date filter
          if (startDate || endDate) {
            filter.expenseDate = {};
            if (startDate) {
              filter.expenseDate.$gte = new Date(startDate);
            }
            if (endDate) {
              filter.expenseDate.$lte = new Date(endDate);
            }
          }

          // Add search filter
          if (search) {
            filter.$or = [
              { title: { $regex: search, $options: 'i' } },
              { requestNumber: { $regex: search, $options: 'i' } },
              { vendorName: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
            ];
          }

          // Build sort
          const sort: any = {};
          sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

          // Get expense requests
          const expenseRequests = await ExpenseRequest.find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort);

          // Get total count
          const total = await ExpenseRequest.countDocuments(filter);

          return {
            success: true,
            data: {
              expenseRequests,
              pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
              },
            },
          };
        },
        {
          query: t.Object({
            page: t.Optional(t.Numeric()),
            limit: t.Optional(t.Numeric()),
            status: t.Optional(t.String()),
            startDate: t.Optional(t.String()),
            endDate: t.Optional(t.String()),
            search: t.Optional(t.String()),
            category: t.Optional(t.String()),
            sortBy: t.Optional(t.String()),
            sortOrder: t.Optional(t.String()),
          }),
        }
      )
      // Get expense request by ID
      .get(
        '/:id',
        async ({ params, user, set }) => {
          // Check if expense request exists
          const expenseRequest = await ExpenseRequest.findOne({
            _id: params.id,
            userId: user._id,
            companyId: user.companyId,
          });
          if (!expenseRequest) {
            set.status = 404;
            throw new AppError('Expense request not found', 404);
          }

          return {
            success: true,
            data: { expenseRequest },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      // Create expense request
      .post(
        '/',
        async ({ body, user }) => {
          // Calculate amount in VND
          let amountInVND = body.amount;
          if (body.currency !== 'VND' && body.exchangeRate) {
            amountInVND = body.amount * body.exchangeRate;
          }

          // Create expense request
          const expenseRequest = await ExpenseRequest.create({
            ...body,
            userId: user._id,
            companyId: user.companyId,
            amountInVND,
            status: ExpenseRequestStatus.DRAFT,
          });

          // Create notification for managers and accountants
          await NotificationService.notifyRoleUsers(
            user.companyId,
            ['admin', 'manager', 'accountant'],
            NotificationType.SYSTEM,
            'New Expense Request',
            `A new expense request (${expenseRequest.requestNumber}) has been created by ${user.firstName} ${user.lastName}.`,
            {
              model: 'ExpenseRequest',
              documentId: expenseRequest._id,
            },
            user._id
          );

          return {
            success: true,
            data: { expenseRequest },
          };
        },
        {
          body: t.Object({
            title: t.String(),
            expenseDate: t.String({ format: 'date-time' }),
            amount: t.Number({ minimum: 0 }),
            currency: t.String(),
            exchangeRate: t.Optional(t.Number({ minimum: 0 })),
            vendorName: t.Optional(t.String()),
            category: t.String(),
            description: t.Optional(t.String()),
            attachments: t.Optional(t.Array(t.String())),
            notes: t.Optional(t.String()),
          }),
        }
      )
      // Update expense request
      .put(
        '/:id',
        async ({ params, body, user, set }) => {
          // Check if expense request exists
          const expenseRequest = await ExpenseRequest.findOne({
            _id: params.id,
            userId: user._id,
            companyId: user.companyId,
          });
          if (!expenseRequest) {
            set.status = 404;
            throw new AppError('Expense request not found', 404);
          }

          // Check if expense request can be updated
          if (
            ![
              ExpenseRequestStatus.DRAFT,
              ExpenseRequestStatus.REJECTED,
            ].includes(expenseRequest.status as ExpenseRequestStatus)
          ) {
            set.status = 400;
            throw new AppError(
              `Cannot update expense request with status: ${expenseRequest.status}`,
              400
            );
          }

          // Calculate amount in VND
          let amountInVND = body.amount || expenseRequest.amount;
          const currency = body.currency || expenseRequest.currency;
          const exchangeRate = body.exchangeRate || expenseRequest.exchangeRate;

          if (currency !== 'VND' && exchangeRate) {
            amountInVND = amountInVND * exchangeRate;
          }

          // Update expense request
          const updatedExpenseRequest = await ExpenseRequest.findByIdAndUpdate(
            params.id,
            {
              ...body,
              amountInVND,
            },
            { new: true }
          );

          return {
            success: true,
            data: { expenseRequest: updatedExpenseRequest },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            title: t.Optional(t.String()),
            expenseDate: t.Optional(t.String({ format: 'date-time' })),
            amount: t.Optional(t.Number({ minimum: 0 })),
            currency: t.Optional(t.String()),
            exchangeRate: t.Optional(t.Number({ minimum: 0 })),
            vendorName: t.Optional(t.String()),
            category: t.Optional(t.String()),
            description: t.Optional(t.String()),
            attachments: t.Optional(t.Array(t.String())),
            notes: t.Optional(t.String()),
          }),
        }
      )
      // Delete expense request
      .delete(
        '/:id',
        async ({ params, user, set }) => {
          // Check if expense request exists
          const expenseRequest = await ExpenseRequest.findOne({
            _id: params.id,
            userId: user._id,
            companyId: user.companyId,
          });
          if (!expenseRequest) {
            set.status = 404;
            throw new AppError('Expense request not found', 404);
          }

          // Check if expense request can be deleted
          if (
            ![
              ExpenseRequestStatus.DRAFT,
              ExpenseRequestStatus.REJECTED,
              ExpenseRequestStatus.CANCELLED,
            ].includes(expenseRequest.status as ExpenseRequestStatus)
          ) {
            set.status = 400;
            throw new AppError(
              `Cannot delete expense request with status: ${expenseRequest.status}`,
              400
            );
          }

          // Delete expense request
          await ExpenseRequest.findByIdAndDelete(params.id);

          return {
            success: true,
            data: null,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      // Update expense request status
      .patch(
        '/:id/status',
        async ({ params, body, user, set }) => {
          // Check if expense request exists
          const expenseRequest = await ExpenseRequest.findOne({
            _id: params.id,
            userId: user._id,
            companyId: user.companyId,
          });
          if (!expenseRequest) {
            set.status = 404;
            throw new AppError('Expense request not found', 404);
          }

          // Check if status transition is valid
          const { status } = body;
          const currentStatus = expenseRequest.status;

          // Define valid status transitions
          const validTransitions: Record<string, string[]> = {
            [ExpenseRequestStatus.DRAFT]: [
              ExpenseRequestStatus.SUBMITTED,
              ExpenseRequestStatus.CANCELLED,
            ],
            [ExpenseRequestStatus.SUBMITTED]: [
              ExpenseRequestStatus.APPROVED,
              ExpenseRequestStatus.REJECTED,
              ExpenseRequestStatus.CANCELLED,
            ],
            [ExpenseRequestStatus.APPROVED]: [
              ExpenseRequestStatus.PAID,
              ExpenseRequestStatus.CANCELLED,
            ],
            [ExpenseRequestStatus.REJECTED]: [
              ExpenseRequestStatus.DRAFT,
              ExpenseRequestStatus.CANCELLED,
            ],
            [ExpenseRequestStatus.CANCELLED]: [ExpenseRequestStatus.DRAFT],
          };

          if (
            !validTransitions[currentStatus]?.includes(status) &&
            currentStatus !== status
          ) {
            set.status = 400;
            throw new AppError(
              `Invalid status transition from ${currentStatus} to ${status}`,
              400
            );
          }

          // Update expense request status
          const updatedExpenseRequest = await ExpenseRequest.findByIdAndUpdate(
            params.id,
            { status, ...body.notes ? { notes: body.notes } : {} },
            { new: true }
          );

          // Create notification
          await NotificationService.notifyRoleUsers(
            user.companyId,
            ['admin', 'manager', 'accountant'],
            NotificationType.SYSTEM,
            'Expense Request Status Updated',
            `Expense request ${updatedExpenseRequest?.requestNumber} status has been updated to ${status}.`,
            {
              model: 'ExpenseRequest',
              documentId: updatedExpenseRequest?._id,
            },
            user._id
          );

          return {
            success: true,
            data: { expenseRequest: updatedExpenseRequest },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            status: t.String(),
            notes: t.Optional(t.String()),
          }),
        }
      )
      // Get expense request categories
      .get(
        '/categories',
        async () => {
          return {
            success: true,
            data: {
              categories: Object.values(ExpenseCategory),
            },
          };
        }
      )
);

