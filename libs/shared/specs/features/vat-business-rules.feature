Feature: UK VAT Business rules

  Scenario Outline: UK VAT rates calculation for an APC
    Given The Payer is an <payerType> in <payerCountry>
    When  The payer will pay for an APC of <invoiceNetValue>
    Then  The invoice total amount should be <invoiceTotalValue>

    Examples:
      | payerCountry | payerType         | invoiceNetValue | invoiceTotalValue |
      | UK           | individual        | 100             | 120               |
      | UK           | institution       | 100             | 120               |
      | UK           | nonVatInstitution | 100             | 120               |
      | RO           | individual        | 200             | 240               |
      | RO           | institution       | 200             | 200               |
      | RO           | nonVatInstitution | 200             | 200               |
      | CH           | individual        | 300             | 300               |
      | CH           | institution       | 300             | 300               |

  Scenario Outline: UK VAT notes setup for an APC
    Given The Payer is an <payerType> in <payerCountry>
    When The VAT note is generated
    Then The VAT note should have the following properties
      | NoteTemplate | TaxTreatmentValue | TaxTreatmentText | TaxTypeValue | TaxTypeText |
      | <note>       | <treatmentValue>  | <treatmentText>  | <typeValue>  | <typeText>  |

    Examples:
      | payerCountry | payerType   | note                                                                                                                         | treatmentValue     | treatmentText           | typeValue          | typeText         |
      | UK           | individual  | UK VAT applies to this invoice, based on the country of the payer. (VAT amount in GBP is {Vat/Rate} GBP, 1 GBP = {Rate} USD) | a6B0Y000000fyPVUAY | UK Sale Services        | a680Y0000000CvBQAU | Standard Rate UK |
      | UK           | institution | UK VAT applies to this invoice, based on the country of the payer. (VAT amount in GBP is {Vat/Rate} GBP, 1 GBP = {Rate} USD) | a6B0Y000000fyPVUAY | UK Sale Services        | a680Y0000000CvBQAU | Standard Rate UK |
      | RO           | individual  | UK VAT applies to this invoice, based on the country of the payer. (VAT amount in GBP is {Vat/Rate} GBP, 1 GBP = {Rate} USD) | a6B0Y000000fyPVUAY | UK Sale Services        | a680Y0000000CvBQAU | Standard Rate UK |
      | RO           | institution | Outside the scope of UK VAT as per Article 44 of 2006/112/EC                                                                 | a6B0Y000000fyOuUAI | EC Sale Services UK     | a680Y0000000CvCQAU | Zero Rate UK     |
      | CH           | individual  | Outside the scope of UK VAT as per Article 44 of 2006/112/EC                                                                 | a6B0Y000000fyOyUAI | Worldwide Sale Services | a680Y0000000Cv8QAE | Exempt UK        |
      | CH           | institution | Outside the scope of UK VAT as per Article 44 of 2006/112/EC                                                                 | a6B0Y000000fyOyUAI | Worldwide Sale Services | a680Y0000000Cv8QAE | Exempt UK        |

