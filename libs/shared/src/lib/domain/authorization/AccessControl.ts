import { AccessControlPlus } from 'accesscontrol-plus';

import { Roles } from '../../modules/users/domain/enums/Roles';
import { AccessControlContext } from './AccessControlContext';

const userOwnsEntity = (context: AccessControlContext): boolean => {
  return context.entityOwnerId === context.userId;
};

const tenantMatches = (context: AccessControlContext): boolean =>
  context.entityTenantId === context.userTenantId;

const accessControl = new AccessControlPlus();

accessControl
  .deny('public')
  .resource('*')
  .action('*')
  .grant(Roles.CUSTOMER)
  .resource('invoice')
  .action('create')
  .where(userOwnsEntity)
  .grant(Roles.PAYER)
  .resource('invoice')
  .action('read')
  .resource('payer')
  .action('update')
  .resource('payments')
  .action('read')
  // .where(userOwnsEntity)
  .resource('payment')
  .action('create')
  // .where(userOwnsEntity)
  .resource('payments')
  .action('create')
  .action('update')
  .action('read')
  .resource('transaction')
  .action('read')
  // .where(userOwnsEntity)
  .grant(Roles.AUTHOR)
  .inherits(Roles.CUSTOMER)
  .grant(Roles.ADMIN)
  .inherits(Roles.CUSTOMER)
  .resource('*')
  .action('*')
  .where(tenantMatches)
  .grant(Roles.SUPER_ADMIN)
  .resource('*')
  .action('*')
  .grant(Roles.EVENT_HANDLER)
  .resource('invoice')
  .action('read')
  .grant(Roles.SERVICE)
  .resource('payments')
  .action('read');

export { accessControl };
