Feature: ResumeInvoiceConfirmationReminderUsecase test 

    Scenario: Resume confirmation reminders for given invoice
        Given the invoice "test-invoice"
        And the notification "test-notification" for invoice "test-invoice"
        When I try to resume confirmation reminders for "test-invoice"
        Then it should resume the reminders of type confirmation

    Scenario: Don't pause already confirmed invoice
        Given the invoice "confirmed-invoice"
        And the notification "test-notification" for confirmed invoice "confirmed-invoice"
        When I try to resume confirmation reminders for "confirmed-invoice"
        Then it should return an error