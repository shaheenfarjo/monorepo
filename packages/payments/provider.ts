export interface CreatePaymentLinkParams {
  currency: "IQD";
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  customParameter?: string;
  lineItems: Array<{
    label: string;
    amount: number;
    type: "increase" | "decrease";
  }>;
  redirectionUrl?: string;
  referenceId: string;
  total: number; // In IQD
}

export interface PaymentLinkResponse {
  code: string;
  id: string;
  referenceId: string;
  status: string;
  url: string;
}

export interface CreateSubscriptionParams {
  amount: number;
  currency: "IQD";
  customerId: string;
  interval: "month" | "year";
  redirectionUrl?: string;
  referenceId: string;
}

export interface CreateRefundParams {
  amount: number;
  reason: string;
  referenceId: string;
}

export interface RefundResponse {
  id: string;
  status: string;
}

export interface PaymentProvider {
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  createPaymentLink: (
    params: CreatePaymentLinkParams
  ) => Promise<PaymentLinkResponse>;
  createRefund: (params: CreateRefundParams) => Promise<RefundResponse>;

  createSubscription: (
    params: CreateSubscriptionParams
  ) => Promise<PaymentLinkResponse>;
  getPaymentStatus: (referenceId: string) => Promise<unknown>;
  updateSubscription: (
    subscriptionId: string,
    params: unknown
  ) => Promise<void>;
  verifyWebhook: (body: string | Buffer, signature: string) => boolean;
}
