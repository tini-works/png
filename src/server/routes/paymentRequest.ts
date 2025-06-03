import { Elysia, t } from 'elysia';
import { PaymentRequest, PaymentRequestStatus, PaymentMethod } from '../models/paymentRequest';
import { isAuthenticated, hasRole } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { NotificationService } from '../services/notifications';
import { PaymentService } from '../services/payments';
import { NotificationType } from '../models/notification';
import mongoose from 'mongoose';

// Payment request routes
export const paymentRequestRoutes = new Elysia().group(
  '/api/payment-requests',
  (app) =>
    app
      // Get all payment requests
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
            sortBy = 'createdAt',
            sortOrder = 'desc',
          } = query;
          const skip = (page - 1) * limit;

          // Build filter
          const filter: any = {
            companyId: user.companyId,
          };

          // Add status filter
          if (status) {
            filter.status = status;
          }

          // Add date filter
          if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
              filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
              filter.createdAt.$lte = new Date(endDate);
            }
          }

          // Add search filter
          if (search) {
            filter.$or = [
              { requestNumber: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { 'client.name': { $regex: search, $options: 'i' } },
              { 'client.email': { $regex: search, $options: 'i' } },
            ];
          }

          // Build sort
          const sort: any = {};
          sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

          // Get payment requests
          const paymentRequests = await PaymentRequest.find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort);

          // Get total count
          const total = await PaymentRequest.countDocuments(filter);

          return {
            success: true,
            data: {
              paymentRequests,
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
            sortBy: t.Optional(t.String()),
            sortOrder: t.Optional(t.String()),
          }),
        }
      )
      // Get payment request by ID
      .get(
        '/:id',
        async ({ params, user, set }) => {
          // Check if payment request exists
          const paymentRequest = await PaymentRequest.findOne({
            _id: params.id,
            companyId: user.companyId,
          });
          if (!paymentRequest) {
            set.status = 404;
            throw new AppError('Payment request not found', 404);
          }

          return {
            success: true,
            data: { paymentRequest },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
        }
      )
      // Create payment request
      .post(
        '/',
        async ({ body, user }) => {
          // Calculate amounts
          const subtotal = body.items.reduce(
            (sum, item) => sum + item.amount,
            0
          );
          const taxTotal = body.items.reduce(
            (sum, item) => sum + (item.taxAmount || 0),
            0
          );
          const totalAmount =
            subtotal + taxTotal - (body.discountAmount || 0);

          // Create payment request
          const paymentRequest = await PaymentRequest.create({
            ...body,
            companyId: user.companyId,
            createdBy: user._id,
            subtotal,
            taxTotal,
            totalAmount,
          });

          // Create notification for managers and accountants
          await NotificationService.notifyRoleUsers(
            user.companyId,
            ['admin', 'manager', 'accountant'],
            NotificationType.PAYMENT_REQUEST_CREATED,
            'New Payment Request',
            `A new payment request (${paymentRequest.requestNumber}) has been created for ${paymentRequest.client.name}.`,
            {
              model: 'PaymentRequest',
              documentId: paymentRequest._id,
            },
            user._id
          );

          return {
            success: true,
            data: { paymentRequest },
          };
        },
        {
          body: t.Object({
            client: t.Object({
              name: t.String(),
              email: t.String({ format: 'email' }),
              phone: t.Optional(t.String()),
              address: t.Optional(t.String()),
              taxId: t.Optional(t.String()),
            }),
            amount: t.Number({ minimum: 0 }),
            currency: t.Optional(t.String()),
            description: t.String(),
            items: t.Array(
              t.Object({
                description: t.String(),
                quantity: t.Number({ minimum: 1 }),
                unitPrice: t.Number({ minimum: 0 }),
                amount: t.Number({ minimum: 0 }),
                taxRate: t.Optional(t.Number({ minimum: 0 })),
                taxAmount: t.Optional(t.Number({ minimum: 0 })),
              })
            ),
            discountAmount: t.Optional(t.Number({ minimum: 0 })),
            dueDate: t.String({ format: 'date-time' }),
            status: t.Optional(t.String()),
            notes: t.Optional(t.String()),
            attachments: t.Optional(t.Array(t.String())),
          }),
        }
      )
      // Update payment request
      .put(
        '/:id',
        async ({ params, body, user, set }) => {
          // Check if payment request exists
          const paymentRequest = await PaymentRequest.findOne({
            _id: params.id,
            companyId: user.companyId,
          });
          if (!paymentRequest) {
            set.status = 404;
            throw new AppError('Payment request not found', 404);
          }

          // Check if payment request can be updated
          if (
            ![
              PaymentRequestStatus.DRAFT,
              PaymentRequestStatus.PENDING,
            ].includes(paymentRequest.status as PaymentRequestStatus)
          ) {
            set.status = 400;
            throw new AppError(
              `Cannot update payment request with status: ${paymentRequest.status}`,
              400
            );
          }

          // Calculate amounts if items are updated
          let updateData: any = { ...body };
          if (body.items) {
            const subtotal = body.items.reduce(
              (sum, item) => sum + item.amount,
              0
            );
            const taxTotal = body.items.reduce(
              (sum, item) => sum + (item.taxAmount || 0),
              0
            );
            const totalAmount =
              subtotal + taxTotal - (body.discountAmount || 0);

            updateData = {
              ...updateData,
              subtotal,
              taxTotal,
              totalAmount,
            };
          }

          // Update payment request
          const updatedPaymentRequest = await PaymentRequest.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true }
          );

          // Create notification for managers and accountants
          await NotificationService.notifyRoleUsers(
            user.companyId,
            ['admin', 'manager', 'accountant'],
            NotificationType.PAYMENT_REQUEST_UPDATED,
            'Payment Request Updated',
            `Payment request ${updatedPaymentRequest?.requestNumber} has been updated.`,
            {
              model: 'PaymentRequest',
              documentId: updatedPaymentRequest?._id,
            },
            user._id
          );

          return {
            success: true,
            data: { paymentRequest: updatedPaymentRequest },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            client: t.Optional(
              t.Object({
                name: t.Optional(t.String()),
                email: t.Optional(t.String({ format: 'email' })),
                phone: t.Optional(t.String()),
                address: t.Optional(t.String()),
                taxId: t.Optional(t.String()),
              })
            ),
            amount: t.Optional(t.Number({ minimum: 0 })),
            currency: t.Optional(t.String()),
            description: t.Optional(t.String()),
            items: t.Optional(
              t.Array(
                t.Object({
                  description: t.String(),
                  quantity: t.Number({ minimum: 1 }),
                  unitPrice: t.Number({ minimum: 0 }),
                  amount: t.Number({ minimum: 0 }),
                  taxRate: t.Optional(t.Number({ minimum: 0 })),
                  taxAmount: t.Optional(t.Number({ minimum: 0 })),
                })
              )
            ),
            discountAmount: t.Optional(t.Number({ minimum: 0 })),
            dueDate: t.Optional(t.String({ format: 'date-time' })),
            status: t.Optional(t.String()),
            notes: t.Optional(t.String()),
            attachments: t.Optional(t.Array(t.String())),
          }),
        }
      )
      // Delete payment request
      .delete(
        '/:id',
        async ({ params, user, set }) => {
          // Check if payment request exists
          const paymentRequest = await PaymentRequest.findOne({
            _id: params.id,
            companyId: user.companyId,
          });
          if (!paymentRequest) {
            set.status = 404;
            throw new AppError('Payment request not found', 404);
          }

          // Check if payment request can be deleted
          if (
            ![
              PaymentRequestStatus.DRAFT,
              PaymentRequestStatus.PENDING,
              PaymentRequestStatus.CANCELLED,
              PaymentRequestStatus.REJECTED,
            ].includes(paymentRequest.status as PaymentRequestStatus)
          ) {
            set.status = 400;
            throw new AppError(
              `Cannot delete payment request with status: ${paymentRequest.status}`,
              400
            );
          }

          // Delete payment request
          await PaymentRequest.findByIdAndDelete(params.id);

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
      // Update payment request status
      .patch(
        '/:id/status',
        async ({ params, body, user, set }) => {
          // Check if payment request exists
          const paymentRequest = await PaymentRequest.findOne({
            _id: params.id,
            companyId: user.companyId,
          });
          if (!paymentRequest) {
            set.status = 404;
            throw new AppError('Payment request not found', 404);
          }

          // Check if status transition is valid
          const { status } = body;
          const currentStatus = paymentRequest.status;

          // Define valid status transitions
          const validTransitions: Record<string, string[]> = {
            [PaymentRequestStatus.DRAFT]: [
              PaymentRequestStatus.PENDING,
              PaymentRequestStatus.CANCELLED,
            ],
            [PaymentRequestStatus.PENDING]: [
              PaymentRequestStatus.APPROVED,
              PaymentRequestStatus.REJECTED,
              PaymentRequestStatus.CANCELLED,
            ],
            [PaymentRequestStatus.APPROVED]: [
              PaymentRequestStatus.PAID,
              PaymentRequestStatus.PARTIALLY_PAID,
              PaymentRequestStatus.CANCELLED,
            ],
            [PaymentRequestStatus.PARTIALLY_PAID]: [
              PaymentRequestStatus.PAID,
              PaymentRequestStatus.CANCELLED,
            ],
            [PaymentRequestStatus.OVERDUE]: [
              PaymentRequestStatus.PAID,
              PaymentRequestStatus.PARTIALLY_PAID,
              PaymentRequestStatus.CANCELLED,
            ],
            [PaymentRequestStatus.REJECTED]: [PaymentRequestStatus.PENDING],
            [PaymentRequestStatus.CANCELLED]: [PaymentRequestStatus.PENDING],
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

          // Update payment request status
          const updatedPaymentRequest = await PaymentRequest.findByIdAndUpdate(
            params.id,
            { status, ...body.notes ? { notes: body.notes } : {} },
            { new: true }
          );

          // Create notification
          await NotificationService.notifyRoleUsers(
            user.companyId,
            ['admin', 'manager', 'accountant'],
            NotificationType.PAYMENT_REQUEST_UPDATED,
            'Payment Request Status Updated',
            `Payment request ${updatedPaymentRequest?.requestNumber} status has been updated to ${status}.`,
            {
              model: 'PaymentRequest',
              documentId: updatedPaymentRequest?._id,
            },
            user._id
          );

          return {
            success: true,
            data: { paymentRequest: updatedPaymentRequest },
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
      // Process payment
      .post(
        '/:id/payments',
        async ({ params, body, user, set }) => {
          // Check if payment request exists
          const paymentRequest = await PaymentRequest.findOne({
            _id: params.id,
            companyId: user.companyId,
          });
          if (!paymentRequest) {
            set.status = 404;
            throw new AppError('Payment request not found', 404);
          }

          // Process payment
          const updatedPaymentRequest = await PaymentService.processPayment(
            new mongoose.Types.ObjectId(params.id),
            body,
            user._id
          );

          return {
            success: true,
            data: { paymentRequest: updatedPaymentRequest },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: t.Object({
            paymentMethod: t.String(),
            transactionId: t.Optional(t.String()),
            paymentDate: t.Optional(t.String({ format: 'date-time' })),
            paidAmount: t.Number({ minimum: 0 }),
            notes: t.Optional(t.String()),
          }),
        }
      )
      // Generate payment URL
      .get(
        '/:id/payment-url',
        async ({ params, query, user, set }) => {
          // Check if payment request exists
          const paymentRequest = await PaymentRequest.findOne({
            _id: params.id,
            companyId: user.companyId,
          });
          if (!paymentRequest) {
            set.status = 404;
            throw new AppError('Payment request not found', 404);
          }

          // Check if payment request is in a valid status for payment
          if (
            ![
              PaymentRequestStatus.PENDING,
              PaymentRequestStatus.APPROVED,
              PaymentRequestStatus.PARTIALLY_PAID,
              PaymentRequestStatus.OVERDUE,
            ].includes(paymentRequest.status as PaymentRequestStatus)
          ) {
            set.status = 400;
            throw new AppError(
              `Cannot generate payment URL for a payment request with status: ${paymentRequest.status}`,
              400
            );
          }

          // Generate payment URL based on payment method
          const { method, returnUrl } = query;
          let paymentUrl = '';

          switch (method) {
            case 'vnpay':
              paymentUrl = PaymentService.generateVNPayUrl(
                paymentRequest,
                returnUrl
              );
              break;
            case 'momo':
              paymentUrl = PaymentService.generateMoMoUrl(
                paymentRequest,
                returnUrl
              );
              break;
            case 'zalopay':
              paymentUrl = PaymentService.generateZaloPayUrl(
                paymentRequest,
                returnUrl
              );
              break;
            default:
              set.status = 400;
              throw new AppError('Invalid payment method', 400);
          }

          return {
            success: true,
            data: { paymentUrl },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          query: t.Object({
            method: t.String(),
            returnUrl: t.String(),
          }),
        }
      )
      // Get payment request statistics
      .get(
        '/statistics',
        async ({ user }) => {
          // Get total count by status
          const statusCounts = await PaymentRequest.aggregate([
            { $match: { companyId: new mongoose.Types.ObjectId(user.companyId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ]);

          // Get total amount by status
          const statusAmounts = await PaymentRequest.aggregate([
            { $match: { companyId: new mongoose.Types.ObjectId(user.companyId) } },
            { $group: { _id: '$status', amount: { $sum: '$totalAmount' } } },
          ]);

          // Get overdue payment requests
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const overdueCount = await PaymentRequest.countDocuments({
            companyId: user.companyId,
            dueDate: { $lt: today },
            status: {
              $in: [
                PaymentRequestStatus.PENDING,
                PaymentRequestStatus.APPROVED,
                PaymentRequestStatus.PARTIALLY_PAID,
                PaymentRequestStatus.OVERDUE,
              ],
            },
          });

          // Format statistics
          const statistics = {
            totalCount: statusCounts.reduce((sum, item) => sum + item.count, 0),
            totalAmount: statusAmounts.reduce(
              (sum, item) => sum + item.amount,
              0
            ),
            statusCounts: Object.values(PaymentRequestStatus).reduce(
              (acc, status) => {
                const found = statusCounts.find((item) => item._id === status);
                acc[status] = found ? found.count : 0;
                return acc;
              },
              {} as Record<string, number>
            ),
            statusAmounts: Object.values(PaymentRequestStatus).reduce(
              (acc, status) => {
                const found = statusAmounts.find((item) => item._id === status);
                acc[status] = found ? found.amount : 0;
                return acc;
              },
              {} as Record<string, number>
            ),
            overdueCount,
          };

          return {
            success: true,
            data: { statistics },
          };
        }
      )
);

