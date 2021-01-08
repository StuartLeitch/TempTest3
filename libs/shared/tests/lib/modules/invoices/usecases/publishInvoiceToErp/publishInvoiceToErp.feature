Feature: Publish invoice to erp system

    Scenario: Invoice is saved successfully to erp
        Given There is an existing Invoice with the ID "erp-invoice"
        And The payer is from "GB" and their type is "INDIVIDUAL"
        When The Invoice with the ID "erp-invoice" is published
        Then The Invoice with the ID "erp-invoice" is registered to erp

    Scenario Outline: Tax code is assigned correctly
        Given There is an existing Invoice with the ID "tax-invoice"
        And The payer is from "<payerCountry>" and their type is "<payerType>"
        When The Invoice with the ID "tax-invoice" is published
        Then The tax code selected for the Invoice with the ID "tax-invoice" is <taxRate>

        Examples:
            | payerCountry | payerType   | taxRate |
            | GB           | INDIVIDUAL  | 7       |
            | GB           | INSTITUTION | 7       |
            | UK           | INDIVIDUAL  | 7       |
            | UK           | INSTITUTION | 7       |
            | RO           | INDIVIDUAL  | 20      |
            | RO           | INSTITUTION | 20      |
            | CH           | INDIVIDUAL  | 20      |
            | CH           | INSTITUTION | 20      |

    Scenario: Fully discounted invoices are not sent to sage
        Given There is an fully discounted Invoice with an existing ID "discounted-invoice"
        And The payer is from "GB" and their type is "INDIVIDUAL"
        When The Invoice with the ID "discounted-invoice" is published
        Then The Invoice with the ID "discounted-invoice" is not registered to erp
