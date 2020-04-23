export const APPLY_COUPON_MUTATION = `
    mutation applyCoupon($invoiceId: ID!, $couponCode: String!) {
      applyCoupon(invoiceId: $invoiceId, couponCode: $couponCode) {
            reduction
            error
        }
    }
`;

export const BANK_TRANSFER_MUTATION = `
    mutation bankTransferPayment (
        $invoiceId: String!
        $payerId: String!
        $paymentMethodId: String!
        $amount: Float!
        $paymentReference: String!
        $datePaid: String!
        $markInvoiceAsPaid: Boolean
    ) {
        bankTransferPayment(
            invoiceId: $invoiceId
            payerId: $payerId
            paymentMethodId: $paymentMethodId
            paymentReference: $paymentReference
            amount: $amount
            datePaid: $datePaid
            markInvoiceAsPaid: $markInvoiceAsPaid
        ) {
          id
          foreignPaymentId
        }
    }
`;

export const CREATE_CREDIT_NOTE_MUTATION = `
  mutation createCreditNote (
    $invoiceId: String!
    $createDraft: Boolean!,
  ) {
    createCreditNote(
      invoiceId: $invoiceId
      createDraft: $createDraft
    ) {
      id
    }
  }
`;
