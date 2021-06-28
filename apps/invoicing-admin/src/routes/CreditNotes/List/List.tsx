import React, { useEffect } from 'react';
import { useManualQuery } from 'graphql-hooks';
import { Filters } from '@utils';
import { useLocalStorage } from '@rehooks/local-storage';

import {
  Card,
  CardFooter,
  Error,
  ListPagination,
  Table,
} from '../../../components';

import { TrTableCreditNotesList } from './components/TrTableList';
import { Loading } from '../../components';

import { CREDIT_NOTES_QUERY } from './graphql';

const RecentInvoicesList: React.FC<RecentCreditNotesListProps> = (props) => {
  const { pagination: defaultPaginator, filters } = props.state;

  const [{ pagination }] = useLocalStorage(
    'creditNotesList',
    { pagination:  defaultPaginator, filters }
  );

  const [fetchCreditNotes, { loading, error, data }] = useManualQuery(
    CREDIT_NOTES_QUERY
  );

  const onPageChanged = ({ currentPage }: any) => {
    props.setPage('page', currentPage);
  };
  useEffect(() => {
    async function fetchData() {
      const { filters, pagination } = props.state;
      await fetchCreditNotes({
        variables: {
          filters: Filters.collect(filters),
          pagination,
        },
      });
    }
    fetchData();
  }, [fetchCreditNotes, props.state]);

  if (loading) return <Loading />;

  if (error) return <Error data={error as any} />;

  return (
    <Card className='mb-0'>
      {/* START Table */}
      <div className='table-responsive-xl'>
        <Table className='mb-0 table-striped' hover>
          <thead>
            <tr>
              <th className='align-middle bt-0'>Creation Reason</th>
              <th className='align-middle bt-0'>Reference</th>
              <th className='align-middle bt-0'>Manuscript Custom ID</th>
              <th className='align-middle bt-0'>Issue Date</th>
              <th className='align-middle bt-0'>APC</th>
              <th className='align-middle bt-0'>Journal Title</th>
              <th className='align-middle bt-0'>Manuscript Title</th>
              <th className='align-middle bt-0'>Manuscript Acceptance Date</th>
            </tr>
          </thead>
          <tbody>
            <TrTableCreditNotesList creditNotes={data?.creditNotes?.creditNotes || []} />
          </tbody>
        </Table>
      </div>
      {/* END Table */}
      <CardFooter className='d-flex justify-content-center pb-0'>
        <ListPagination
          totalRecords={data?.creditNotes?.totalCount}
          pageNeighbours={1}
          onPageChanged={onPageChanged}
          pageLimit={pagination.limit}
          currentPage={pagination.page}
        />
      </CardFooter>
    </Card>
  );
};

interface RecentCreditNotesListProps {
  state: {
    pagination: {
      page: number;
      offset: number;
      limit: number;
    },
    filters: {
      invoiceStatus: string[];
      transactionStatus: string[];
      journalId: string[];
      referenceNumber: string;
      customId: string;
    }
};
  setPage(key: string, value: string | boolean | any[]): void;
}

export default RecentInvoicesList;
