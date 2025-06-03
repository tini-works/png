import { PaymentRequest, PaymentRequestStatus, PaymentMethod } from '../models/paymentRequest';
import { NotificationService } from './notifications';
import { NotificationType } from '../models/notification';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

// Payment service
export class PaymentService {
  // Process a payment
  static async processPayment(
    paymentRequestId: mongoose.Types.ObjectId,
    paymentData: {
      paymentMethod: PaymentMethod;
      transactionId?: string;
      paymentDate?: Date;
      paidAmount: number;
      notes?: string;
    },
    userId: mongoose.Types.ObjectId
  ): Promise<PaymentRequest> {
    // Find the payment request
    const paymentRequest = await PaymentRequest.findById(paymentRequestId);
    if (!paymentRequest) {
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
      throw new AppError(
        `Cannot process payment for a payment request with status: ${paymentRequest.status}`,
        400
      );
    }

    // Calculate remaining amount
    const currentPaidAmount = paymentRequest.paymentDetails?.paidAmount || 0;
    const newPaidAmount = currentPaidAmount + paymentData.paidAmount;
    const remainingAmount = paymentRequest.totalAmount - newPaidAmount;

    // Determine new status
    let newStatus: PaymentRequestStatus;
    if (remainingAmount <= 0) {
      newStatus = PaymentRequestStatus.PAID;
    } else {
      newStatus = PaymentRequestStatus.PARTIALLY_PAID;
    }

    // Update payment request
    const updatedPaymentRequest = await PaymentRequest.findByIdAndUpdate(
      paymentRequestId,
      {
        status: newStatus,
        paymentMethod: paymentData.paymentMethod,
        paymentDetails: {
          transactionId: paymentData.transactionId,
          paymentDate: paymentData.paymentDate || new Date(),
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, remainingAmount),
          notes: paymentData.notes,
        },
      },
      { new: true }
    );

    if (!updatedPaymentRequest) {
      throw new AppError('Failed to update payment request', 500);
    }

    // Create notification
    await NotificationService.notifyRoleUsers(
      updatedPaymentRequest.companyId,
      ['admin', 'manager', 'accountant'],
      NotificationType.PAYMENT_RECEIVED,
      'Payment Received',
      `Payment of ${paymentData.paidAmount.toLocaleString()} ${
        updatedPaymentRequest.currency
      } received for payment request ${updatedPaymentRequest.requestNumber}`,
      {
        model: 'PaymentRequest',
        documentId: updatedPaymentRequest._id,
      },
      userId
    );

    return updatedPaymentRequest;
  }

  // Generate payment URL for VNPay
  static generateVNPayUrl(
    paymentRequest: PaymentRequest,
    returnUrl: string
  ): string {
    // This is a simplified implementation
    // In a real application, you would use the VNPay SDK or API
    const { merchantId, secureHash } = config.paymentGateways.vnpay;
    const amount = paymentRequest.totalAmount;
    const orderId = paymentRequest.requestNumber;

    // Generate a simple URL for demonstration purposes
    return `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Version=2.1.0&vnp_Command=pay&vnp_TmnCode=${merchantId}&vnp_Amount=${amount * 100}&vnp_CreateDate=${Date.now()}&vnp_CurrCode=${paymentRequest.currency}&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=${orderId}&vnp_OrderType=billpayment&vnp_ReturnUrl=${encodeURIComponent(returnUrl)}&vnp_TxnRef=${orderId}&vnp_SecureHash=${secureHash}`;
  }

  // Generate payment URL for MoMo
  static generateMoMoUrl(
    paymentRequest: PaymentRequest,
    returnUrl: string
  ): string {
    // This is a simplified implementation
    // In a real application, you would use the MoMo SDK or API
    const { partnerCode, accessKey } = config.paymentGateways.momo;
    const amount = paymentRequest.totalAmount;
    const orderId = paymentRequest.requestNumber;

    // Generate a simple URL for demonstration purposes
    return `https://test-payment.momo.vn/v2/gateway/pay?partnerCode=${partnerCode}&accessKey=${accessKey}&amount=${amount}&orderId=${orderId}&orderInfo=Payment for ${orderId}&returnUrl=${encodeURIComponent(returnUrl)}&notifyUrl=${encodeURIComponent(returnUrl)}&extraData=`;
  }

  // Generate payment URL for ZaloPay
  static generateZaloPayUrl(
    paymentRequest: PaymentRequest,
    returnUrl: string
  ): string {
    // This is a simplified implementation
    // In a real application, you would use the ZaloPay SDK or API
    const { appId, key1 } = config.paymentGateways.zalopay;
    const amount = paymentRequest.totalAmount;
    const orderId = paymentRequest.requestNumber;

    // Generate a simple URL for demonstration purposes
    return `https://sandbox.zalopay.com.vn/v001/tpe/createorder?appid=${appId}&appuser=user123&apptime=${Date.now()}&amount=${amount}&apptransid=${orderId}&embeddata={"redirecturl":"${encodeURIComponent(returnUrl)}"}&item=[]&description=Payment for ${orderId}&mac=${key1}`;
  }

  // Check for overdue payment requests and update their status
  static async checkOverduePayments(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find payment requests that are past due date and not paid
    const result = await PaymentRequest.updateMany(
      {
        dueDate: { $lt: today },
        status: {
          $in: [
            PaymentRequestStatus.PENDING,
            PaymentRequestStatus.APPROVED,
            PaymentRequestStatus.PARTIALLY_PAID,
          ],
        },
      },
      { status: PaymentRequestStatus.OVERDUE }
    );

    // Create notifications for overdue payment requests
    const overdueRequests = await PaymentRequest.find({
      dueDate: { $lt: today },
      status: PaymentRequestStatus.OVERDUE,
    });

    for (const request of overdueRequests) {
      await NotificationService.notifyRoleUsers(
        request.companyId,
        ['admin', 'manager', 'accountant'],
        NotificationType.PAYMENT_OVERDUE,
        'Payment Overdue',
        `Payment request ${request.requestNumber} is overdue. Due date was ${request.dueDate.toLocaleDateString()}.`,
        {
          model: 'PaymentRequest',
          documentId: request._id,
        }
      );
    }

    return result.modifiedCount;
  }
}

