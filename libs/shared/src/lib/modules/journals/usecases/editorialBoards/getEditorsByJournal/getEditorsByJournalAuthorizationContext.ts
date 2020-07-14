import {
  AccessControlledUsecase,
  AuthorizationContext,
  AccessControlContext,
  Roles,
} from '../../../../../domain/authorization/context';

export { Roles, AccessControlledUsecase, AccessControlContext };
export type GetEditorsByJournalAuthorizationContext = AuthorizationContext<
  Roles
>;