Feature: ResumeInvoicePaymentReminderUsecase test

    Scenario: Resume payment reminders for given invoice
        Given an invoice "test-invoice"
        And a notification "test-notification" for invoice "test-invoice"
        When I try to resume payment reminders for "test-invoice"
        Then it should resume the reminders of type payment

    Scenario: Don't resume reminders for paid invoice
        Given an invoice "paid-invoice"
        And a notification "paid-notification" for paid invoice "paid-invoice"
        When I try to resume payment reminders for "paid-invoice"
        Then it should not resume the reminder