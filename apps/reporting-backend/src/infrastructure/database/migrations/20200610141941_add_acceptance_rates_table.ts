import * as Knex from 'knex';
import acceptanceRatesView from '../../views/AcceptanceRatesView';

export async function up(knex: Knex): Promise<any> {
  await knex.raw(acceptanceRatesView.getCreateQuery());
  await knex.raw(
    `insert into ${acceptanceRatesView.getViewName()} ${acceptanceRatesView.getSelectQuery()}`
  );
}

export async function down(knex: Knex): Promise<any> {
  await knex.raw(acceptanceRatesView.getDeleteQuery());
}

export const name = '20200610141941_add_acceptance_rates_table.ts';
