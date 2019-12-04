import gql from "graphql-tag";

export const invoiceVatFragment = gql`
  fragment invoiceVatFragment on InvoiceVat {
    vatPercentage
    vatNote
    rate
  }
`

export const addressFragment = gql`
  fragment addressFragment on Address {
    city
    country
    addressLine1
  }
`;

export const payerFragment = gql`
  fragment payerFragment on Payer {
    id
    type
    name
    email
    vatId
    organization
    address {
      ...addressFragment
    }
  }
  ${addressFragment}
`;

export const articleFragment = gql`
  fragment articleFragment on Article {
    id
    title
    created
    articleType
    authorCountry
    authorEmail
    customId
    journalTitle
    authorSurname
    authorFirstName
  }
`;

export const invoiceFragment = gql`
  fragment invoiceFragment on Invoice {
    invoiceId
    status
    dateCreated
    dateIssued
    dateAccepted
    referenceNumber
    payer {
      ...payerFragment
    }
    invoiceItem {
      id
      price
      rate
      vat
      vatnote
      dateCreated
      article {
        ...articleFragment
      }
    }
  }
  ${payerFragment}
  ${articleFragment}
`;
