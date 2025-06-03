import { Elysia, t } from 'elysia';
import { PaymentRequest, PaymentRequestStatus, PaymentMethod } from '../models';
import { isAuthenticated } from '../middleware/auth';
import { UserRole } from '../models/user';
import { AppError } from '../middleware/errorHandler';

// Create payment request routes
export const paymentRequestRoutes = new Elysia({ prefix: '/payment-requests' })
  .use(isAuthenticated)
  // Get all payment requests for user's company
  .get('/', async ({ user, query }) => {
    const { status, client, startDate, endDate, page = '1', limit = '10' } = query || {};
    
    // Build query
    const queryObj: any = {};
    
    // Filter by company (admin can see all)
    if (user.role !== UserRole.ADMIN) {
      queryObj.companyId = user.companyId;
    }
    
    // Filter by status
    if (status) {
      queryObj.status = status;
    }
    
    // Filter by client name
    if (client) {
      queryObj['client.name'] = { $regex: client, $options: 'i' };
    }
    
    // Filter by date range
    if (startDate || endDate) {
      queryObj.createdAt = {};
      if (startDate) {
        queryObj.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        queryObj.createdAt.$lte = new Date(endDate as string);
      }
    }
    
    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination
    const [paymentRequests, total] = await Promise.all([
      PaymentRequest.find(queryObj)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'firstName lastName email'),
      PaymentRequest.countDocuments(queryObj),
    ]);
    
    return {
      success: true,
      data: {
        paymentRequests,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    };
  })
  // Get payment request by ID
  .get(
    '/:id',
    async ({ params, user }) => {
      const { id } = params;
      
      // Find payment request
      const paymentRequest = await PaymentRequest.findById(id)
        .populate('createdBy', 'firstName lastName email');
      
      if (!paymentRequest) {
        throw new AppError('Payment request not found', 404);
      }
      
      // Check if user has access to this payment request
      if (
        user.role !== UserRole.ADMIN &&
        paymentRequest.companyId.toString() !== user.companyId.toString()
      ) {
        throw new AppError('Forbidden: You do not have access to this payment request', 403);
      }
      
      return {
        success: true,
        data: paymentRequest,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  // Create a new payment request
  .post(
    '/',
    async ({ body, user, set }) => {
      // Set company ID and created by from authenticated user
      const paymentRequestData = {
        ...body,
        companyId: user.companyId,
        createdBy: user._id,
      };
      
      // Calculate totals if not provided
      if (!paymentRequestData.subtotal && paymentRequestData.items) {
        paymentRequestData.subtotal = paymentRequestData.items.reduce(
          (sum, item) => sum + item.amount,
          0
        );
      }
      
      if (!paymentRequestData.totalAmount) {
        let total = paymentRequestData.subtotal || 0;
        
        if (paymentRequestData.taxTotal) {
          total += paymentRequestData.taxTotal;
        }
        
        if (paymentRequestData.discountAmount) {
          total -= paymentRequestData.discountAmount;
        }
        
        paymentRequestData.totalAmount = total;
      }
      
      // Create new payment request
      const paymentRequest = new PaymentRequest(paymentRequestData);
      await paymentRequest.save();
      
      set.status = 201;
      return {
        success: true,
        message: 'Payment request created successfully',
        data: paymentRequest,
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
        subtotal: t.Optional(t.Number({ minimum: 0 })),
        taxTotal: t.Optional(t.Number({ minimum: 0 })),
        discountAmount: t.Optional(t.Number({ minimum: 0 })),
        totalAmount: t.Optional(t.Number({ minimum: 0 })),
        dueDate: t.String({ format: 'date-time' }),
        status: t.Optional(t.Enum(PaymentRequestStatus)),
        paymentMethod: t.Optional(t.Enum(PaymentMethod)),
        notes: t.Optional(t.String()),
        attachments: t.Optional(t.Array(t.String())),
      }),
    }
  )
  // Update payment request
  .put(
    '/:id',
    async ({ params, body, user }) => {
      const { id } = params;
      
      // Find payment request
      const paymentRequest = await PaymentRequest.findById(id);
      
      if (!paymentRequest) {
        throw new AppError('Payment request not found', 404);
      }
      
      // Check if user has access to this payment request
      if (
        user.role !== UserRole.ADMIN &&
        paymentRequest.companyId.toString() !== user.companyId.toString()
      ) {
        throw new AppError('Forbidden: You do not have access to this payment request', 403);
      }
      
      // Update payment request
      Object.assign(paymentRequest, body);
      
      // Recalculate totals if items were updated
      if (body.items) {
        paymentRequest.subtotal = body.items.reduce(
          (sum, item) => sum + item.amount,
          0
        );
        
        let total = paymentRequest.subtotal;
        
        if (paymentRequest.taxTotal) {
          total += paymentRequest.taxTotal;
        }
        
        if (paymentRequest.discountAmount) {
          total -= paymentRequest.discountAmount;
        }
        
        paymentRequest.totalAmount = total;
      }
      
      await paymentRequest.save();
      
      return {
        success: true,
        message: 'Payment request updated successfully',
        data: paymentRequest,
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
        subtotal: t.Optional(t.Number({ minimum: 0 })),
        taxTotal: t.Optional(t.Number({ minimum: 0 })),
        discountAmount: t.Optional(t.Number({ minimum: 0 })),
        totalAmount: t.Optional(t.Number({ minimum: 0 })),
        dueDate: t.Optional(t.String({ format: 'date-time' })),
        status: t.Optional(t.Enum(PaymentRequestStatus)),
        paymentMethod: t.Optional(t.Enum(PaymentMethod)),
        notes: t.Optional(t.String()),
        attachments: t.Optional(t.Array(t.String())),
        paymentDetails: t.Optional(
          t.Object({
            transactionId: t.Optional(t.String()),
            paymentDate: t.Optional(t.String({ format: 'date-time' })),
            paidAmount: t.Optional(t.Number({ minimum: 0 })),
            remainingAmount: t.Optional(t.Number({ minimum: 0 })),
            notes: t.Optional(t.String()),
          })
        ),
      }),
    }
  )
  // Delete payment request
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      const { id } = params;
      
      // Find payment request
      const paymentRequest = await PaymentRequest.findById(id);
      
      if (!paymentRequest) {
        throw new AppError('Payment request not found', 404);
      }
      
      // Check if user has access to this payment request
      if (
        user.role !== UserRole.ADMIN &&
        paymentRequest.companyId.toString() !== user.companyId.toString()
      ) {
        throw new AppError('Forbidden: You do not have access to this payment request', 403);
      }
      
      // Only allow deletion of draft or cancelled payment requests
      if (
        ![PaymentRequestStatus.DRAFT, PaymentRequestStatus.CANCELLED].includes(
          paymentRequest.status as PaymentRequestStatus
        )
      ) {
        throw new AppError(
          'Only draft or cancelled payment requests can be deleted',
          400
        );
      }
      
      await PaymentRequest.findByIdAndDelete(id);
      
      set.status = 204;
      return {
        success: true,
        message: 'Payment request deleted successfully',
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
    async ({ params, body, user }) => {
      const { id } = params;
      const { status, paymentDetails } = body;
      
      // Find payment request
      const paymentRequest = await PaymentRequest.findById(id);
      
      if (!paymentRequest) {
        throw new AppError('Payment request not found', 404);
      }
      
      // Check if user has access to this payment request
      if (
        user.role !== UserRole.ADMIN &&
        paymentRequest.companyId.toString() !== user.companyId.toString()
      ) {
        throw new AppError('Forbidden: You do not have access to this payment request', 403);
      }
      
      // Update status
      paymentRequest.status = status;
      
      // Update payment details if provided
      if (paymentDetails) {
        paymentRequest.paymentDetails = {
          ...paymentRequest.paymentDetails,
          ...paymentDetails,
        };
        
        // If payment is marked as paid, set payment date if not provided
        if (
          status === PaymentRequestStatus.PAID &&
          !paymentRequest.paymentDetails?.paymentDate
        ) {
          paymentRequest.paymentDetails.paymentDate = new Date();
        }
      }
      
      await paymentRequest.save();
      
      return {
        success: true,
        message: 'Payment request status updated successfully',
        data: paymentRequest,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        status: t.Enum(PaymentRequestStatus),
        paymentDetails: t.Optional(
          t.Object({
            transactionId: t.Optional(t.String()),
            paymentDate: t.Optional(t.String({ format: 'date-time' })),
            paidAmount: t.Optional(t.Number({ minimum: 0 })),
            remainingAmount: t.Optional(t.Number({ minimum: 0 })),
            notes: t.Optional(t.String()),
          })
        ),
      }),
    }
  );

