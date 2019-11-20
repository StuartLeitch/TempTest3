import gql from "graphql-tag";

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
    journalId
    authorSurname
    authorFirstName
  }
`;

export const invoiceFragment = gql`
  fragment invoiceFragment on Invoice {
    id
    status
    dateCreated
    payer {
      ...payerFragment
    }
    invoiceItem {
      id
      price
      dateCreated
      article {
        ...articleFragment
      }
    }
  }
  ${payerFragment}
  ${articleFragment}
`;
