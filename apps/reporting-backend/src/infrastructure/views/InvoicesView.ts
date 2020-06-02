import { REPORTING_TABLES } from 'libs/shared/src/lib/modules/reporting/constants';
import {
  AbstractEventView,
  EventViewContract,
} from './contracts/EventViewContract';
import submissionView from './SubmissionsView';
import authorsView from './AuthorsView';
import invoiceDataView from './InvoicesDataView';
import articleDataView from './ArticleDataView';
import submissionDataView from './SubmissionDataView';

class InvoicesView extends AbstractEventView implements EventViewContract {
  getCreateQuery(): string {
    return `
CREATE MATERIALIZED VIEW IF NOT EXISTS ${this.getViewName()}
AS SELECT
    inv.reference_number as "invoice_reference_number",
    original_invoice.reference_number as "credited_invoice_reference_number",
    inv.is_credit_note,
    inv.manuscript_custom_id as "manuscript_custom_id",
    inv.invoice_created_date as "invoice_created_date",
    case when sd.submission_event = 'SubmissionQualityCheckPassed' then sd.event_timestamp else null end as manuscript_accepted_date,
    case 
    	when inv.status = 'DRAFT' then null
    	when coalesce(inv.paid_amount, 0) = 0 then null
    	when inv.status = 'ACTIVE' then 'Partially Paid'
    	when inv.status = 'FINAL' then 'Paid'
    	else 'unknown'
    end as payment_status,
    inv.invoice_issue_date as "invoice_issue_date",
    inv.invoice_id as "invoice_id",
    inv.status as "invoice_status",
    inv.gross_apc_value as "gross_apc_value",
    inv."discount",
    inv.net_apc as "net_apc",
    inv."vat_amount",
    inv.net_amount as "net_amount",
    inv."due_amount",
    inv.paid_amount as "paid_amount",
    article_data.published_date,
    inv.payment_date,
    inv.payer_given_name as "payer_given_name",
    inv.payer_email as "payer_email",
    inv.payment_type as "payment_type",
    inv.payer_country as "payer_country",
    inv.payer_address as payer_address,
    inv.payment_currency as "payment_currency",
    inv.organization,
    waivers.waiver_types as waivers,
    coupons.coupon_names as coupons,
    inv.event_id as "event_id",
    s.title as "manuscript_title",
    s.article_type as "manuscript_article_type",
    s.journal_name as "journal_name",
    s.publisher_name as "publisher_name",
    s.journal_code as "journal_code",
    CASE WHEN s.special_issue_id is null THEN 'special'
         ELSE 'regular'
    END as "issue_type",
    s.submission_date as "manuscript_submission_date",
    CASE WHEN inv.gross_apc_value = 0 THEN 'free'
         ELSE 'paid'
    END as "apc",
    CONCAT(a.given_names, ' ', a.surname) as "corresponding_author_name",
    a.country as "corresponding_author_country",
    a.email as "corresponding_author_email",
    a.aff as "corresponding_author_affiliation" 
  FROM
    ${invoiceDataView.getViewName()} inv
  JOIN (select event_id from (select event_id, row_number() over (partition by invoice_id ORDER BY case when id.status = 'FINAL' then 1 when id.status = 'ACTIVE' then 2 else 3 end, event_timestamp desc nulls last) as rn from ${invoiceDataView.getViewName()} id) i where i.rn = 1) last_invoices
    ON last_invoices.event_id = inv.event_id
  LEFT JOIN LATERAL (select * from ${articleDataView.getViewName()} a WHERE
      a.manuscript_custom_id = inv.manuscript_custom_id
    LIMIT 1) article_data on article_data.manuscript_custom_id = inv.manuscript_custom_id
  LEFT JOIN ${submissionView.getViewName()} s on
    s.manuscript_custom_id = inv.manuscript_custom_id
  LEFT JOIN LATERAL (
    SELECT
      *
    FROM
      ${authorsView.getViewName()} a
    WHERE
      a.manuscript_custom_id = s.manuscript_custom_id
      and a.is_submitting = true
    LIMIT 1) a on
    a.manuscript_custom_id = inv.manuscript_custom_id
  LEFT JOIN (
    select id as event_id, STRING_AGG(type_id, ', ') as waiver_types
    from ${REPORTING_TABLES.INVOICE} ie,
    jsonb_to_recordset(payload -> 'invoiceItems' -> 0 -> 'waivers') as waivers(type_id text)
    group by event_id
  ) waivers on waivers.event_id = inv.event_id
  LEFT JOIN (
    select id as event_id, STRING_AGG(name, ', ') as coupon_names
    from ${REPORTING_TABLES.INVOICE} ie,
    jsonb_to_recordset(payload -> 'invoiceItems' -> 0 -> 'coupons') as coupons(name text)
    group by event_id
  ) coupons on coupons.event_id = inv.event_id
  LEFT JOIN LATERAL (SELECT * FROM ${submissionDataView.getViewName()} sd where sd.manuscript_custom_id = inv.manuscript_custom_id and sd.submission_event in ('SubmissionQualityCheckPassed') 
    order by event_timestamp desc limit 1) sd on sd.manuscript_custom_id = inv.manuscript_custom_id
  LEFT JOIN LATERAL (SELECT * FROM ${invoiceDataView.getViewName()} id2 where id2.invoice_id = inv.cancelled_invoice_reference limit 1) original_invoice on original_invoice.invoice_id = inv.cancelled_invoice_reference
WITH DATA;
    `;
  }

  postCreateQueries = [
    `create index on ${this.getViewName()} (manuscript_custom_id)`,
    `create index on ${this.getViewName()} (manuscript_custom_id, invoice_created_date)`,
    `create index on ${this.getViewName()} (manuscript_custom_id, invoice_created_date, is_credit_note)`,
    `create index on ${this.getViewName()} (journal_code)`,
    `create index on ${this.getViewName()} (issue_type)`,
    `create index on ${this.getViewName()} (invoice_id)`,
    `create index on ${this.getViewName()} (publisher_name)`,
    `create index on ${this.getViewName()} (journal_name)`,
    `create index on ${this.getViewName()} (event_id)`,
  ];

  getViewName(): string {
    return 'invoices';
  }
}

const invoicesView = new InvoicesView();

invoicesView.addDependency(submissionView);
invoicesView.addDependency(articleDataView);
invoicesView.addDependency(authorsView);
invoicesView.addDependency(invoiceDataView);

export default invoicesView;
