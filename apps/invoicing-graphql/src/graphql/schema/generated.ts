import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string,
  String: string,
  Boolean: boolean,
  Int: number,
  Float: number,
  ReferenceNumber: any,
  Date: any,
  Name: any,
};



export type Address = {
   __typename?: 'Address',
  city?: Maybe<Scalars['String']>,
  country?: Maybe<Scalars['String']>,
  state?: Maybe<Scalars['String']>,
  postalCode?: Maybe<Scalars['String']>,
  addressLine1?: Maybe<Scalars['String']>,
};

export type AddressInput = {
  city?: Maybe<Scalars['String']>,
  country?: Maybe<Scalars['String']>,
  state?: Maybe<Scalars['String']>,
  postalCode?: Maybe<Scalars['String']>,
  addressLine1?: Maybe<Scalars['String']>,
};

export type Article = {
   __typename?: 'Article',
  id?: Maybe<Scalars['String']>,
  journalId?: Maybe<Scalars['ID']>,
  journalTitle?: Maybe<Scalars['String']>,
  customId?: Maybe<Scalars['ID']>,
  created?: Maybe<Scalars['Date']>,
  title?: Maybe<Scalars['String']>,
  articleType?: Maybe<Scalars['String']>,
  authorEmail?: Maybe<Scalars['String']>,
  authorCountry?: Maybe<Scalars['String']>,
  authorSurname?: Maybe<Scalars['String']>,
  authorFirstName?: Maybe<Scalars['String']>,
  datePublished?: Maybe<Scalars['Date']>,
};

export type ArticleFilters = {
  journalId?: Maybe<Array<Maybe<Scalars['ID']>>>,
  customId?: Maybe<Array<Maybe<Scalars['ID']>>>,
};

export type ClientToken = {
   __typename?: 'ClientToken',
  token: Scalars['String'],
};

export type Coupon = {
   __typename?: 'Coupon',
  reduction?: Maybe<Scalars['Float']>,
  code?: Maybe<Scalars['String']>,
};

export type CreditCardInput = {
  amount: Scalars['Float'],
  cardNumber: Scalars['String'],
  expiration: Scalars['String'],
  cvv: Scalars['String'],
  postalCode?: Maybe<Scalars['String']>,
};

export type CreditNote = {
   __typename?: 'CreditNote',
  id: Scalars['String'],
  cancelledInvoiceReference: Scalars['ID'],
};


export type Invoice = {
   __typename?: 'Invoice',
  invoiceId?: Maybe<Scalars['ID']>,
  dateCreated?: Maybe<Scalars['String']>,
  dateChanged?: Maybe<Scalars['String']>,
  dateIssued?: Maybe<Scalars['String']>,
  dateAccepted?: Maybe<Scalars['String']>,
  vat?: Maybe<Scalars['Float']>,
  charge?: Maybe<Scalars['Float']>,
  status?: Maybe<InvoiceStatus>,
  payer?: Maybe<Payer>,
  erpReference?: Maybe<Scalars['String']>,
  revenueRecognitionReference?: Maybe<Scalars['String']>,
  referenceNumber?: Maybe<Scalars['ReferenceNumber']>,
  cancelledInvoiceReference?: Maybe<Scalars['ID']>,
  invoiceItem?: Maybe<InvoiceItem>,
  title?: Maybe<Scalars['String']>,
  price?: Maybe<Scalars['Float']>,
  customId?: Maybe<Scalars['ID']>,
  type?: Maybe<Scalars['String']>,
  payment?: Maybe<Payment>,
  payments?: Maybe<Array<Maybe<Payment>>>,
  creditNote?: Maybe<Invoice>,
};

export type InvoiceFilters = {
  invoiceStatus?: Maybe<Array<Maybe<InvoiceStatus>>>,
  transactionStatus?: Maybe<Array<Maybe<TransactionStatus>>>,
  referenceNumber?: Maybe<Array<Maybe<Scalars['ReferenceNumber']>>>,
  invoiceItem?: Maybe<InvoiceItemFilters>,
};

export type InvoiceId = {
   __typename?: 'InvoiceId',
  invoiceId?: Maybe<Array<Maybe<Scalars['ID']>>>,
};

export type InvoiceItem = {
   __typename?: 'InvoiceItem',
  id?: Maybe<Scalars['String']>,
  invoiceId?: Maybe<Scalars['ID']>,
  manuscriptId?: Maybe<Scalars['ID']>,
  type?: Maybe<Scalars['String']>,
  price?: Maybe<Scalars['Float']>,
  rate?: Maybe<Scalars['Float']>,
  vat?: Maybe<Scalars['Float']>,
  vatnote?: Maybe<Scalars['String']>,
  article?: Maybe<Article>,
  dateCreated?: Maybe<Scalars['Date']>,
  coupons?: Maybe<Array<Maybe<Coupon>>>,
  waivers?: Maybe<Array<Maybe<Waiver>>>,
};

export type InvoiceItemFilters = {
  article?: Maybe<ArticleFilters>,
};

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  FINAL = 'FINAL'
}

export type InvoiceVat = {
   __typename?: 'InvoiceVat',
  vatPercentage?: Maybe<Scalars['Float']>,
  vatNote?: Maybe<Scalars['String']>,
  rate?: Maybe<Scalars['Float']>,
};


export enum ReminderType {
  REMINDER_CONFIRMATION = 'REMINDER_CONFIRMATION',
  SANCTIONED_COUNTRY = 'SANCTIONED_COUNTRY',
  REMINDER_PAYMENT = 'REMINDER_PAYMENT',
  INVOICE_CREATED = 'INVOICE_CREATED'
}

export type RemindersStatus = {
  __typename?: 'RemindersStatus',
  confirmation: Scalars['Boolean'],
  payment: Scalars['Boolean']
}

export type SentReminder = {
  __typename?: 'SentReminder',
  forInvoice: Scalars['ID'],
  toEmail: Scalars['String']
  when: Scalars['Date']
  type: ReminderType
}



export type Journal = {
   __typename?: 'Journal',
  journalId?: Maybe<Scalars['ID']>,
  journalTitle?: Maybe<Scalars['String']>,
};

export type MigrateApc = {
  invoiceReference?: Maybe<Scalars['String']>,
  paymentAmount?: Maybe<Scalars['Float']>,
  manuscriptId: Scalars['String'],
  discount?: Maybe<Scalars['Float']>,
  price: Scalars['Float'],
  vat?: Maybe<Scalars['Float']>,
};

export type MigratePayer = {
  vatRegistrationNumber?: Maybe<Scalars['String']>,
  address: MigratePayerAddress,
  organization?: Maybe<Scalars['String']>,
  email: Scalars['String'],
  name: Scalars['String'],
  type: Scalars['String'],
};

export type MigratePayerAddress = {
  addressLine2?: Maybe<Scalars['String']>,
  addressLine1: Scalars['String'],
  countryCode: Scalars['String'],
  state?: Maybe<Scalars['String']>,
  city: Scalars['String'],
};

export type Mutation = {
   __typename?: 'Mutation',
  confirmInvoice: Payer,
  applyCoupon?: Maybe<Coupon>,
  createInvoice?: Maybe<Invoice>,
  deleteInvoice?: Maybe<Scalars['Boolean']>,
  setTransactionToActive?: Maybe<Transaction>,
  creditCardPayment: Payment,
  bankTransferPayment: Payment,
  createCreditNote: CreditNote,
  recordPayPalPayment: Payment,
  migratePayment: Payment,
  migrateInvoice?: Maybe<Invoice>,
  migrateEntireInvoice?: Maybe<Scalars['String']>,
  generateCompensatoryEvents?: Maybe<Scalars['String']>,
  togglePauseConfirmationReminders?: RemindersStatus,
  togglePausePaymentReminders?: RemindersStatus,
  generateMissingReminderJobs?: Maybe<Scalars['String']>
};


export type MutationConfirmInvoiceArgs = {
  payer: PayerInput
};


export type MutationApplyCouponArgs = {
  invoiceId?: Maybe<Scalars['ID']>,
  couponCode?: Maybe<Scalars['String']>
};


export type MutationCreateInvoiceArgs = {
  totalAmount?: Maybe<Scalars['Float']>
};


export type MutationDeleteInvoiceArgs = {
  id: Scalars['ID']
};


export type MutationSetTransactionToActiveArgs = {
  customId?: Maybe<Scalars['ID']>
};


export type MutationCreditCardPaymentArgs = {
  invoiceId: Scalars['ID'],
  payerId: Scalars['String'],
  paymentMethodId: Scalars['String'],
  paymentMethodNonce: Scalars['String'],
  amount: Scalars['Float']
};


export type MutationBankTransferPaymentArgs = {
  invoiceId: Scalars['String'],
  payerId: Scalars['String'],
  paymentMethodId: Scalars['String'],
  paymentReference: Scalars['String'],
  amount: Scalars['Float'],
  datePaid: Scalars['String'],
  markInvoiceAsPaid?: Maybe<Scalars['Boolean']>
};


export type MutationCreateCreditNoteArgs = {
  invoiceId: Scalars['String'],
  createDraft?: Maybe<Scalars['Boolean']>
};


export type MutationRecordPayPalPaymentArgs = {
  paymentMethodId: Scalars['String'],
  invoiceId: Scalars['ID'],
  payerId: Scalars['String'],
  orderId: Scalars['String']
};


export type MutationMigratePaymentArgs = {
  invoiceId: Scalars['ID'],
  payerId: Scalars['String'],
  amount?: Maybe<Scalars['Float']>,
  datePaid?: Maybe<Scalars['String']>
};


export type MutationMigrateInvoiceArgs = {
  invoiceId: Scalars['ID'],
  vatValue?: Maybe<Scalars['Float']>,
  invoiceReference?: Maybe<Scalars['Float']>,
  discount?: Maybe<Scalars['Float']>,
  APC?: Maybe<Scalars['Float']>,
  dateIssued?: Maybe<Scalars['String']>,
  dateAccepted?: Maybe<Scalars['String']>
};


export type MutationMigrateEntireInvoiceArgs = {
  acceptanceDate?: Maybe<Scalars['String']>,
  submissionDate: Scalars['String'],
  paymentDate?: Maybe<Scalars['String']>,
  issueDate?: Maybe<Scalars['String']>,
  erpReference?: Maybe<Scalars['String']>,
  payer?: Maybe<MigratePayer>,
  invoiceId: Scalars['String'],
  apc: MigrateApc,
  token: Scalars['String']
};


export type MutationGenerateCompensatoryEventsArgs = {
  invoiceIds?: Maybe<Array<Maybe<Scalars['String']>>>,
  journalIds?: Maybe<Array<Maybe<Scalars['String']>>>
};


export type MutationPauseRemindersArgs = {
  state: Scalars['Boolean'],
  invoiceId: Scalars['ID'],
}


export type PaginatedInvoices = {
   __typename?: 'PaginatedInvoices',
  totalCount?: Maybe<Scalars['Int']>,
  invoices?: Maybe<Array<Maybe<Invoice>>>,
};

export type Pagination = {
  offset?: Maybe<Scalars['Int']>,
  limit?: Maybe<Scalars['Int']>,
};

export type Payer = {
   __typename?: 'Payer',
  id?: Maybe<Scalars['String']>,
  type?: Maybe<PayerType>,
  name?: Maybe<Scalars['String']>,
  email?: Maybe<Scalars['String']>,
  organization?: Maybe<Scalars['String']>,
  address?: Maybe<Address>,
  vatId?: Maybe<Scalars['String']>,
};

export type PayerInput = {
  id?: Maybe<Scalars['String']>,
  invoiceId?: Maybe<Scalars['String']>,
  type?: Maybe<PayerType>,
  name?: Maybe<Scalars['String']>,
  email?: Maybe<Scalars['String']>,
  organization?: Maybe<Scalars['String']>,
  vatId?: Maybe<Scalars['String']>,
  address?: Maybe<AddressInput>,
};

export enum PayerType {
  INSTITUTION = 'INSTITUTION',
  INDIVIDUAL = 'INDIVIDUAL'
}

export type Payment = {
   __typename?: 'Payment',
  id: Scalars['String'],
  invoiceId?: Maybe<Scalars['String']>,
  payerId?: Maybe<Scalars['String']>,
  paymentMethodId?: Maybe<Scalars['String']>,
  foreignPaymentId?: Maybe<Scalars['String']>,
  paymentProof?: Maybe<Scalars['String']>,
  amount?: Maybe<Scalars['Float']>,
  datePaid?: Maybe<Scalars['Date']>,
  paymentMethod?: Maybe<PaymentMethod>,
};

export type PaymentMethod = {
   __typename?: 'PaymentMethod',
  id: Scalars['String'],
  name: Scalars['String'],
  isActive?: Maybe<Scalars['Boolean']>,
};

export type Query = {
   __typename?: 'Query',
  getPaymentMethods?: Maybe<Array<Maybe<PaymentMethod>>>,
  getClientToken?: Maybe<ClientToken>,
  invoice?: Maybe<Invoice>,
  invoiceVat?: Maybe<InvoiceVat>,
  invoices?: Maybe<PaginatedInvoices>,
  invoiceIdByManuscriptCustomId?: Maybe<InvoiceId>,
  journals?: Maybe<Array<Maybe<Journal>>>,
  echo?: Maybe<Scalars['String']>,
};


export type QueryInvoiceArgs = {
  invoiceId?: Maybe<Scalars['ID']>
};


export type QueryInvoiceVatArgs = {
  invoiceId?: Maybe<Scalars['ID']>,
  country?: Maybe<Scalars['String']>,
  state?: Maybe<Scalars['String']>,
  postalCode?: Maybe<Scalars['String']>,
  payerType?: Maybe<Scalars['String']>
};


export type QueryInvoicesArgs = {
  filters?: Maybe<InvoiceFilters>,
  pagination?: Maybe<Pagination>
};


export type QueryInvoiceIdByManuscriptCustomIdArgs = {
  customId?: Maybe<Scalars['ID']>
};


export type QueryEchoArgs = {
  value?: Maybe<Scalars['String']>
};

export type QueryInvoiceSentReminders = {
  invoiceId: Scalars['ID']
}

export type QueryInvoiceRemindersStatus = {
  invoiceId: Scalars['ID']
}


export type Transaction = {
   __typename?: 'Transaction',
  id?: Maybe<Scalars['String']>,
  status?: Maybe<Scalars['String']>,
};

export enum TransactionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  FINAL = 'FINAL'
}

export type Waiver = {
   __typename?: 'Waiver',
  reduction?: Maybe<Scalars['Float']>,
  type_id?: Maybe<Scalars['String']>,
};



export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;


export type StitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes>;

export type isTypeOfResolverFn<T = {}> = (obj: T, info: GraphQLResolveInfo) => boolean;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>,
  PaymentMethod: ResolverTypeWrapper<PaymentMethod>,
  String: ResolverTypeWrapper<Scalars['String']>,
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>,
  ClientToken: ResolverTypeWrapper<ClientToken>,
  ID: ResolverTypeWrapper<Scalars['ID']>,
  Invoice: ResolverTypeWrapper<Invoice>,
  Float: ResolverTypeWrapper<Scalars['Float']>,
  InvoiceStatus: InvoiceStatus,
  Payer: ResolverTypeWrapper<Payer>,
  PayerType: PayerType,
  Address: ResolverTypeWrapper<Address>,
  ReferenceNumber: ResolverTypeWrapper<Scalars['ReferenceNumber']>,
  InvoiceItem: ResolverTypeWrapper<InvoiceItem>,
  Article: ResolverTypeWrapper<Article>,
  Date: ResolverTypeWrapper<Scalars['Date']>,
  Coupon: ResolverTypeWrapper<Coupon>,
  Waiver: ResolverTypeWrapper<Waiver>,
  Payment: ResolverTypeWrapper<Payment>,
  InvoiceVat: ResolverTypeWrapper<InvoiceVat>,
  InvoiceFilters: InvoiceFilters,
  TransactionStatus: TransactionStatus,
  InvoiceItemFilters: InvoiceItemFilters,
  ArticleFilters: ArticleFilters,
  Pagination: Pagination,
  Int: ResolverTypeWrapper<Scalars['Int']>,
  PaginatedInvoices: ResolverTypeWrapper<PaginatedInvoices>,
  InvoiceId: ResolverTypeWrapper<InvoiceId>,
  Journal: ResolverTypeWrapper<Journal>,
  Mutation: ResolverTypeWrapper<{}>,
  PayerInput: PayerInput,
  AddressInput: AddressInput,
  Transaction: ResolverTypeWrapper<Transaction>,
  CreditNote: ResolverTypeWrapper<CreditNote>,
  MigratePayer: MigratePayer,
  MigratePayerAddress: MigratePayerAddress,
  MigrateAPC: MigrateApc,
  Name: ResolverTypeWrapper<Scalars['Name']>,
  CreditCardInput: CreditCardInput,
  RemindersStatus: RemindersStatus,
  SentReminder: SentReminder
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {},
  PaymentMethod: PaymentMethod,
  String: Scalars['String'],
  Boolean: Scalars['Boolean'],
  ClientToken: ClientToken,
  ID: Scalars['ID'],
  Invoice: Invoice,
  Float: Scalars['Float'],
  InvoiceStatus: InvoiceStatus,
  Payer: Payer,
  PayerType: PayerType,
  Address: Address,
  ReferenceNumber: Scalars['ReferenceNumber'],
  InvoiceItem: InvoiceItem,
  Article: Article,
  Date: Scalars['Date'],
  Coupon: Coupon,
  Waiver: Waiver,
  Payment: Payment,
  InvoiceVat: InvoiceVat,
  InvoiceFilters: InvoiceFilters,
  TransactionStatus: TransactionStatus,
  InvoiceItemFilters: InvoiceItemFilters,
  ArticleFilters: ArticleFilters,
  Pagination: Pagination,
  Int: Scalars['Int'],
  PaginatedInvoices: PaginatedInvoices,
  InvoiceId: InvoiceId,
  Journal: Journal,
  Mutation: {},
  PayerInput: PayerInput,
  AddressInput: AddressInput,
  Transaction: Transaction,
  CreditNote: CreditNote,
  MigratePayer: MigratePayer,
  MigratePayerAddress: MigratePayerAddress,
  MigrateAPC: MigrateApc,
  Name: Scalars['Name'],
  CreditCardInput: CreditCardInput,
};

export type ModelDirectiveArgs = {   id?: Maybe<Scalars['ID']> };

export type ModelDirectiveResolver<Result, Parent, ContextType = any, Args = ModelDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type FilterDirectiveArgs = {   key?: Maybe<Scalars['Name']> };

export type FilterDirectiveResolver<Result, Parent, ContextType = any, Args = FilterDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AddressResolvers<ContextType = any, ParentType extends ResolversParentTypes['Address'] = ResolversParentTypes['Address']> = {
  city?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  country?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  postalCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  addressLine1?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type ArticleResolvers<ContextType = any, ParentType extends ResolversParentTypes['Article'] = ResolversParentTypes['Article']> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  journalId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  journalTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  customId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  created?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>,
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  articleType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  authorEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  authorCountry?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  authorSurname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  authorFirstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  datePublished?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type ClientTokenResolvers<ContextType = any, ParentType extends ResolversParentTypes['ClientToken'] = ResolversParentTypes['ClientToken']> = {
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type CouponResolvers<ContextType = any, ParentType extends ResolversParentTypes['Coupon'] = ResolversParentTypes['Coupon']> = {
  reduction?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type CreditNoteResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreditNote'] = ResolversParentTypes['CreditNote']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  cancelledInvoiceReference?: Resolver<ResolversTypes['ID'], ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date'
}

export type InvoiceResolvers<ContextType = any, ParentType extends ResolversParentTypes['Invoice'] = ResolversParentTypes['Invoice']> = {
  invoiceId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  dateCreated?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  dateChanged?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  dateIssued?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  dateAccepted?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  vat?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  charge?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  status?: Resolver<Maybe<ResolversTypes['InvoiceStatus']>, ParentType, ContextType>,
  payer?: Resolver<Maybe<ResolversTypes['Payer']>, ParentType, ContextType>,
  erpReference?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  revenueRecognitionReference?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  referenceNumber?: Resolver<Maybe<ResolversTypes['ReferenceNumber']>, ParentType, ContextType>,
  cancelledInvoiceReference?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  invoiceItem?: Resolver<Maybe<ResolversTypes['InvoiceItem']>, ParentType, ContextType>,
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  price?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  customId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  payment?: Resolver<Maybe<ResolversTypes['Payment']>, ParentType, ContextType>,
  payments?: Resolver<Maybe<Array<Maybe<ResolversTypes['Payment']>>>, ParentType, ContextType>,
  creditNote?: Resolver<Maybe<ResolversTypes['Invoice']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type InvoiceIdResolvers<ContextType = any, ParentType extends ResolversParentTypes['InvoiceId'] = ResolversParentTypes['InvoiceId']> = {
  invoiceId?: Resolver<Maybe<Array<Maybe<ResolversTypes['ID']>>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type InvoiceItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['InvoiceItem'] = ResolversParentTypes['InvoiceItem']> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  invoiceId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  manuscriptId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  type?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  price?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  rate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  vat?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  vatnote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  article?: Resolver<Maybe<ResolversTypes['Article']>, ParentType, ContextType>,
  dateCreated?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>,
  coupons?: Resolver<Maybe<Array<Maybe<ResolversTypes['Coupon']>>>, ParentType, ContextType>,
  waivers?: Resolver<Maybe<Array<Maybe<ResolversTypes['Waiver']>>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type InvoiceVatResolvers<ContextType = any, ParentType extends ResolversParentTypes['InvoiceVat'] = ResolversParentTypes['InvoiceVat']> = {
  vatPercentage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  vatNote?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  rate?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type JournalResolvers<ContextType = any, ParentType extends ResolversParentTypes['Journal'] = ResolversParentTypes['Journal']> = {
  journalId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>,
  journalTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  confirmInvoice?: Resolver<ResolversTypes['Payer'], ParentType, ContextType, RequireFields<MutationConfirmInvoiceArgs, 'payer'>>,
  applyCoupon?: Resolver<Maybe<ResolversTypes['Coupon']>, ParentType, ContextType, MutationApplyCouponArgs>,
  createInvoice?: Resolver<Maybe<ResolversTypes['Invoice']>, ParentType, ContextType, MutationCreateInvoiceArgs>,
  deleteInvoice?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationDeleteInvoiceArgs, 'id'>>,
  setTransactionToActive?: Resolver<Maybe<ResolversTypes['Transaction']>, ParentType, ContextType, MutationSetTransactionToActiveArgs>,
  creditCardPayment?: Resolver<ResolversTypes['Payment'], ParentType, ContextType, RequireFields<MutationCreditCardPaymentArgs, 'invoiceId' | 'payerId' | 'paymentMethodId' | 'paymentMethodNonce' | 'amount'>>,
  bankTransferPayment?: Resolver<ResolversTypes['Payment'], ParentType, ContextType, RequireFields<MutationBankTransferPaymentArgs, 'invoiceId' | 'payerId' | 'paymentMethodId' | 'paymentReference' | 'amount' | 'datePaid'>>,
  createCreditNote?: Resolver<ResolversTypes['CreditNote'], ParentType, ContextType, RequireFields<MutationCreateCreditNoteArgs, 'invoiceId'>>,
  recordPayPalPayment?: Resolver<ResolversTypes['Payment'], ParentType, ContextType, RequireFields<MutationRecordPayPalPaymentArgs, 'paymentMethodId' | 'invoiceId' | 'payerId' | 'orderId'>>,
  migratePayment?: Resolver<ResolversTypes['Payment'], ParentType, ContextType, RequireFields<MutationMigratePaymentArgs, 'invoiceId' | 'payerId'>>,
  migrateInvoice?: Resolver<Maybe<ResolversTypes['Invoice']>, ParentType, ContextType, RequireFields<MutationMigrateInvoiceArgs, 'invoiceId'>>,
  migrateEntireInvoice?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationMigrateEntireInvoiceArgs, 'submissionDate' | 'invoiceId' | 'apc' | 'token'>>,
  generateCompensatoryEvents?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, MutationGenerateCompensatoryEventsArgs>,
  togglePauseConfirmationReminders?: Resolver<Maybe<ResolversTypes['RemindersStatus']>, ParentType, ContextType, MutationPauseRemindersArgs>,
  togglePausePaymentReminders?: Resolver<Maybe<ResolversTypes['RemindersStatus']>, ParentType, ContextType, MutationPauseRemindersArgs>,
  generateMissingReminderJobs?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, unknown>
};

export interface NameScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Name'], any> {
  name: 'Name'
}

export type PaginatedInvoicesResolvers<ContextType = any, ParentType extends ResolversParentTypes['PaginatedInvoices'] = ResolversParentTypes['PaginatedInvoices']> = {
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>,
  invoices?: Resolver<Maybe<Array<Maybe<ResolversTypes['Invoice']>>>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type PayerResolvers<ContextType = any, ParentType extends ResolversParentTypes['Payer'] = ResolversParentTypes['Payer']> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  type?: Resolver<Maybe<ResolversTypes['PayerType']>, ParentType, ContextType>,
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  organization?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  address?: Resolver<Maybe<ResolversTypes['Address']>, ParentType, ContextType>,
  vatId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type PaymentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Payment'] = ResolversParentTypes['Payment']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  invoiceId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  payerId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  paymentMethodId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  foreignPaymentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  paymentProof?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  amount?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  datePaid?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>,
  paymentMethod?: Resolver<Maybe<ResolversTypes['PaymentMethod']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type PaymentMethodResolvers<ContextType = any, ParentType extends ResolversParentTypes['PaymentMethod'] = ResolversParentTypes['PaymentMethod']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>,
  isActive?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  getPaymentMethods?: Resolver<Maybe<Array<Maybe<ResolversTypes['PaymentMethod']>>>, ParentType, ContextType>,
  getClientToken?: Resolver<Maybe<ResolversTypes['ClientToken']>, ParentType, ContextType>,
  invoice?: Resolver<Maybe<ResolversTypes['Invoice']>, ParentType, ContextType, QueryInvoiceArgs>,
  invoiceVat?: Resolver<Maybe<ResolversTypes['InvoiceVat']>, ParentType, ContextType, QueryInvoiceVatArgs>,
  invoices?: Resolver<Maybe<ResolversTypes['PaginatedInvoices']>, ParentType, ContextType, QueryInvoicesArgs>,
  invoiceIdByManuscriptCustomId?: Resolver<Maybe<ResolversTypes['InvoiceId']>, ParentType, ContextType, QueryInvoiceIdByManuscriptCustomIdArgs>,
  journals?: Resolver<Maybe<Array<Maybe<ResolversTypes['Journal']>>>, ParentType, ContextType>,
  echo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, QueryEchoArgs>,
  remindersStatus?: Resolver<Maybe<ResolversTypes['RemindersStatus']>, ParentType, ContextType, QueryInvoiceRemindersStatus>,
  remindersSent?: Resolver<Maybe<Array<ResolversTypes['SentReminder']>>, ParentType, ContextType, QueryInvoiceSentReminders>,
};

export interface ReferenceNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ReferenceNumber'], any> {
  name: 'ReferenceNumber'
}

export type TransactionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction']> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type WaiverResolvers<ContextType = any, ParentType extends ResolversParentTypes['Waiver'] = ResolversParentTypes['Waiver']> = {
  reduction?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>,
  type_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>,
  __isTypeOf?: isTypeOfResolverFn<ParentType>,
};

export type Resolvers<ContextType = any> = {
  Address?: AddressResolvers<ContextType>,
  Article?: ArticleResolvers<ContextType>,
  ClientToken?: ClientTokenResolvers<ContextType>,
  Coupon?: CouponResolvers<ContextType>,
  CreditNote?: CreditNoteResolvers<ContextType>,
  Date?: GraphQLScalarType,
  Invoice?: InvoiceResolvers<ContextType>,
  InvoiceId?: InvoiceIdResolvers<ContextType>,
  InvoiceItem?: InvoiceItemResolvers<ContextType>,
  InvoiceVat?: InvoiceVatResolvers<ContextType>,
  Journal?: JournalResolvers<ContextType>,
  Mutation?: MutationResolvers<ContextType>,
  Name?: GraphQLScalarType,
  PaginatedInvoices?: PaginatedInvoicesResolvers<ContextType>,
  Payer?: PayerResolvers<ContextType>,
  Payment?: PaymentResolvers<ContextType>,
  PaymentMethod?: PaymentMethodResolvers<ContextType>,
  Query?: QueryResolvers<ContextType>,
  ReferenceNumber?: GraphQLScalarType,
  Transaction?: TransactionResolvers<ContextType>,
  Waiver?: WaiverResolvers<ContextType>,
};


/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
*/
export type IResolvers<ContextType = any> = Resolvers<ContextType>;
export type DirectiveResolvers<ContextType = any> = {
  model?: ModelDirectiveResolver<any, any, ContextType>,
  filter?: FilterDirectiveResolver<any, any, ContextType>,
};


/**
* @deprecated
* Use "DirectiveResolvers" root object instead. If you wish to get "IDirectiveResolvers", add "typesPrefix: I" to your config.
*/
export type IDirectiveResolvers<ContextType = any> = DirectiveResolvers<ContextType>;