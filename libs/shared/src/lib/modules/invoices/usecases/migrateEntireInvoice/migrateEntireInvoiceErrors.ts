import { UseCaseError } from '../../../../core/logic/UseCaseError';
import { Result } from '../../../../core/logic/Result';

export type AllMigrateEntireInvoiceErrors =
  | MigrateEntireInvoiceErrors.StateIsRequiredForUnitedStates
  | MigrateEntireInvoiceErrors.AddressLine1Required
  | MigrateEntireInvoiceErrors.ManuscriptIdRequired
  | MigrateEntireInvoiceErrors.PayerAddressRequired
  | MigrateEntireInvoiceErrors.CountryCodeRequired
  | MigrateEntireInvoiceErrors.IncorrectPayerType
  | MigrateEntireInvoiceErrors.ManuscriptNotFound
  | MigrateEntireInvoiceErrors.PostalCodeRequired
  | MigrateEntireInvoiceErrors.PayerNameRequired
  | MigrateEntireInvoiceErrors.PayerTypeRequired
  | MigrateEntireInvoiceErrors.TransactionError
  | MigrateEntireInvoiceErrors.CityRequired
  | MigrateEntireInvoiceErrors.ApcRequired;

export type PayerAddressErrors =
  | MigrateEntireInvoiceErrors.StateIsRequiredForUnitedStates
  | MigrateEntireInvoiceErrors.AddressLine1Required
  | MigrateEntireInvoiceErrors.PayerAddressRequired
  | MigrateEntireInvoiceErrors.CountryCodeRequired
  | MigrateEntireInvoiceErrors.PostalCodeRequired
  | MigrateEntireInvoiceErrors.CityRequired;

export type ApcErrors =
  | MigrateEntireInvoiceErrors.ManuscriptIdRequired
  | MigrateEntireInvoiceErrors.ManuscriptNotFound
  | MigrateEntireInvoiceErrors.ApcRequired;

export namespace MigrateEntireInvoiceErrors {
  export class ManuscriptIdRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Manuscript id is required.`
      });
    }
  }

  export class ManuscriptNotFound extends Result<UseCaseError> {
    constructor(id: string) {
      super(false, {
        message: `The Manuscript with id {${id}} does not exists.`
      });
    }
  }

  export class PayerAddressRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Address of payer is required, with the following fields: addressLine1, countryCode, city, postalCode, state (if country is US) and optionally addressLine2 `
      });
    }
  }

  export class StateIsRequiredForUnitedStates extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `State is required in address for when the country code is {US}.`
      });
    }
  }

  export class CountryCodeRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Country Code is required for payer address.`
      });
    }
  }

  export class PostalCodeRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Postal code is required for payer address.`
      });
    }
  }

  export class AddressLine1Required extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Address line 1 is required for payer address.`
      });
    }
  }

  export class CityRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `City is required for payer address.`
      });
    }
  }

  export class PayerTypeRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Payer type is required.`
      });
    }
  }

  export class IncorrectPayerType extends Result<UseCaseError> {
    constructor(type: string) {
      super(false, {
        message: `The provided payer type {${type}} is incorrect, it must be "INDIVIDUAL" or "INSTITUTION".`
      });
    }
  }

  export class ApcRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `APC is required, with the following fields: manuscriptId, price, vat and discount.`
      });
    }
  }

  export class PayerNameRequired extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Payer name is required, it must contain First Name and Last Name.`
      });
    }
  }

  export class TransactionError extends Result<UseCaseError> {
    constructor(message: string) {
      super(false, {
        message
      });
    }
  }
}
