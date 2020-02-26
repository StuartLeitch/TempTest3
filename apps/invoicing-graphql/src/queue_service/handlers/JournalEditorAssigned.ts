/* eslint-disable max-len */

import { AssignEditorsToJournalUsecase } from '../../../../../libs/shared/src/lib/modules/journals/usecases/editorialBoards/assignEditorsToJournal/assignEditorsToJournal';
import { JournalEventMap } from '../../../../../libs/shared/src/lib/modules/journals/mappers/JournalEventMap';
import { Logger } from '../../lib/logger';

const JOURNAL_EDITOR_ASSIGNED = 'JournalEditorAssigned';
const JOURNAL_SECTION_EDITOR_ASSIGNED = 'JournalSectionEditorAssigned';
const logger = new Logger(`PhenomEvent:${JOURNAL_EDITOR_ASSIGNED}`);
// const JOURNAL_SECTION_SPECIAL_ISSUE_EDITOR_ASSIGNED =
//   'JournalSectionSpecialIssueEditorAssigned';
// const JOURNAL_SECTION_EDITOR_ASSIGNED = 'JournalSectionEditorAssigned';
// const JOURNAL_SPECIAL_ISSUE_EDITOR_ASSIGNED =
//   'JournalSpecialIssueEditorAssigned';

function addEditorEventHandlerFactory(eventName: string): any {
  return async function(data: any) {
    logger.info(`Incoming Event Data`, data);
    const {
      repos: { catalog: catalogRepo, editor: editorRepo }
    } = this;

    const assignEditorToJournal = new AssignEditorsToJournalUsecase(
      editorRepo,
      catalogRepo
    );

    try {
      const journalId = data.id;
      const editors = JournalEventMap.extractEditors(data);
      const assignEditorResponse = await assignEditorToJournal.execute({
        journalId,
        allEditors: editors
      });

      if (assignEditorResponse.isLeft()) {
        logger.error(assignEditorResponse.value.errorValue().message);
        throw assignEditorResponse.value.error;
      }

      logger.info(`Successfully executed event ${eventName}`);
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  };
}

export const JournalEditorAssignedHandler = {
  event: JOURNAL_EDITOR_ASSIGNED,
  handler: addEditorEventHandlerFactory(JOURNAL_EDITOR_ASSIGNED)
};

export const JournalSectionEditorAssignedHandler = {
  event: JOURNAL_SECTION_EDITOR_ASSIGNED,
  handler: addEditorEventHandlerFactory(JOURNAL_SECTION_EDITOR_ASSIGNED)
};

// Removed, we do not treat assistants/special issue editors/section editors as journal editors
// export const JournalSectionSpecialIssueEditorAssignedHandler = {
//   event: JOURNAL_SECTION_SPECIAL_ISSUE_EDITOR_ASSIGNED,
//   handler: addEditorEventHandlerFactory(JOURNAL_SECTION_SPECIAL_ISSUE_EDITOR_ASSIGNED)
// };

// export const JournalSectionEditorAssignedHandler = {
//   event: JOURNAL_SECTION_EDITOR_ASSIGNED,
//   handler: addEditorEventHandlerFactory(JOURNAL_SECTION_EDITOR_ASSIGNED)
// };

// export const JournalSpecialIssueEditorAssignedHandler = {
//   event: JOURNAL_SPECIAL_ISSUE_EDITOR_ASSIGNED,
//   handler: addEditorEventHandlerFactory(JOURNAL_SPECIAL_ISSUE_EDITOR_ASSIGNED)
// };
