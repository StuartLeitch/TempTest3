import { REPORTING_TABLES } from 'libs/shared/src/lib/modules/reporting/constants';
import {
  AbstractEventView,
  EventViewContract
} from './contracts/EventViewContract';
import journalsView from './JournalsView';
import journalSectionsView from './JournalSectionsView';
import journalSpecialIssuesView from './JournalSpecialIssuesView';

class JournalEditorialBoardView extends AbstractEventView
  implements EventViewContract {
  getCreateQuery(): string {
    return `
CREATE MATERIALIZED VIEW IF NOT EXISTS ${this.getViewName()}
AS SELECT
	j.journal_id,
	j.journal_name,
	j.section_id,
	j.section_name,
	j.special_issue_id,
	j.special_issue_name,
	editor_view.email AS "email",
	editor_view. "givenNames" AS given_names,
	editor_view. "surname" AS "surname",
	editor_view. "aff" AS "aff",
	editor_view. "role" ->> 'type' AS role_type,
	editor_view. "role" ->> 'label' AS role_label,
	cast_to_timestamp (editor_view. "expiredDate") AS expired_date,
	cast_to_timestamp (editor_view. "invitedDate") AS invited_date,
	cast_to_timestamp (editor_view. "removedDate") AS removed_date,
	cast_to_timestamp (editor_view. "acceptedDate") AS accepted_date,
	cast_to_timestamp (editor_view. "assignedDate") AS assigned_date,
	cast_to_timestamp (editor_view. "declinedDate") AS declined_date,
	editor_view.country AS "country",
	editor_view. "isCorresponding" AS is_corresponding,
	editor_view. "userId" AS user_id
FROM (
	SELECT
		j.journal_id,
		j.journal_name,
		NULL AS section_id,
		NULL AS section_name,
		NULL AS special_issue_id,
		NULL AS special_issue_name,
		je.payload -> 'editors' AS editors
	FROM
		${journalsView.getViewName()} j
		JOIN ${REPORTING_TABLES.JOURNAL} je ON je.id = j.event_id
UNION ALL
SELECT
	js.journal_id,
	js.journal_name,
	js.section_id,
	js.section_name,
	NULL AS special_issue_id,
	NULL AS special_issue_name,
	js.editors_json AS editors
FROM
	${journalSectionsView.getViewName()} js
UNION ALL
SELECT
	jsi.journal_id,
	jsi.journal_name,
	jsi.section_id,
	jsi.section_name,
	jsi.special_issue_id,
	jsi.special_issue_name,
	jsi.editors_json AS editors
FROM
	${journalSpecialIssuesView.getViewName()} jsi) j,
	jsonb_to_recordset(j.editors) AS editor_view ("expiredDate" text,
		"invitedDate" text,
		"removedDate" text,
		"acceptedDate" text,
		"assignedDate" text,
		"declinedDate" text,
		status text,
		email text,
		country text,
		"isCorresponding" bool,
		"userId" text,
		"givenNames" text,
		surname text,
		aff text,
		ROLE jsonb)
WHERE
	jsonb_array_length(j.editors) > 0
WITH DATA `;
  }

  postCreateQueries = [
    `create index on ${this.getViewName()} (email)`,
    `create index on ${this.getViewName()} (role_type)`
  ];

  getViewName(): string {
    return 'journal_editorial_board';
  }
}

const journalEditorialBoardView = new JournalEditorialBoardView();

journalEditorialBoardView.addDependency(journalsView);
journalEditorialBoardView.addDependency(journalSectionsView);
journalEditorialBoardView.addDependency(journalSpecialIssuesView);

export default journalEditorialBoardView;
