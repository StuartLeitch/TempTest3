/* eslint-disable prefer-const */

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

import { TrTableInvoicesList } from './components/TrTableList';
import { Loading } from '../../components';

import { INVOICES_QUERY, } from './graphql';

const RecentInvoicesList = (props) => {
  const { pagination: defaultPaginator } = props;

  const [pagination] = useLocalStorage(
    'invoicesListPagination',
    defaultPaginator
  );

  const [fetchInvoices, { loading, error, data }] = useManualQuery(
    INVOICES_QUERY
  );

  const onPageChanged = ({ currentPage }: any) => {
    props.setPage('page', currentPage);
  };

  useEffect(() => {
    async function fetchData() {
      const vars = {
        filters: Filters.collect(props.filters),
        pagination,
      };
      await fetchInvoices({
        variables: vars,
      });
    }
    fetchData();
  }, [props.filters, pagination, fetchInvoices]);

  if (loading)
    return (
      <Loading />
    );

  if (error) return <Error data={error} />;

  // const offset = pagination.offset * pagination.limit;
  // if (data?.length > 0 && offset >= data?.length) {
  //   pagination = Object.assign({}, paginator);
  // }

  return (
    <Card className='mb-0'>
      {/* START Table */}
      <div className='table-responsive-xl'>
        <Table className='mb-0 table-striped' hover>
          <thead>
            <tr>
              {/* <th className='align-middle bt-0'>#</th> */}
              <th className='align-middle bt-0'>Status</th>
              <th className='align-middle bt-0'>Reference</th>
              <th className='align-middle bt-0'>Manuscript Custom ID</th>
              <th className='align-middle bt-0'>Issue Date</th>
              <th className='align-middle bt-0'>APC</th>
              <th className='align-middle bt-0'>Journal Title</th>
              <th className='align-middle bt-0'>Manuscript Title</th>
              <th className='align-middle bt-0'>Manuscript Acceptance Date</th>
              {/* <th className='align-middle bt-0 text-right'>Actions</th> */}
            </tr>
          </thead>
          <tbody>
            <TrTableInvoicesList invoices={data?.invoices?.invoices || []} />
          </tbody>
        </Table>
      </div>
      {/* END Table */}
      <CardFooter className='d-flex justify-content-center pb-0'>
        <ListPagination
          totalRecords={data?.invoices?.totalCount}
          pageNeighbours={1}
          onPageChanged={onPageChanged}
          pageLimit={pagination.limit}
          currentPage={pagination.page}
        />
      </CardFooter>
    </Card>
  );
};

export default RecentInvoicesList;
