import React, { useEffect, useCallback } from 'react';
import { useManualQuery } from 'graphql-hooks';
import LoadingOverlay from 'react-loading-overlay';
import { useQueryState } from 'react-router-use-location-state';

import { COUPONS_QUERY } from '../graphql';

import {
  Container,
  Row,
  Col,
  Spinner,
  Error,
  ListPagination,
  CardFooter,
  Card,
} from '../../../components';

import { HeaderMain } from '../../components/HeaderMain';

import List from './List';

const defaultPaginationSettings = { page: 1, offset: 0, limit: 5 };

const InvoicesContainer = () => {
  const [fetchCoupons, { loading, error, data }] = useManualQuery(
    COUPONS_QUERY
  );

  const [page, setPageInUrl] = useQueryState(
    'page',
    defaultPaginationSettings.page
  );

  const fetchData = useCallback(
    async (page) => {
      await fetchCoupons({
        variables: {
          pagination: { ...defaultPaginationSettings, page, offset: page - 1 },
        },
      });
    },
    [fetchCoupons]
  );

  const onPageChange = (paginationData) => {
    const { currentPage } = paginationData;

    fetchData(currentPage);
    setPageInUrl(currentPage);
  };

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page, fetchCoupons]);

  if (loading)
    return (
      <LoadingOverlay
        active={loading}
        spinner={
          <Spinner
            style={{ width: '12em', height: '12em' }}
            color='secondary'
          />
        }
      />
    );

  if (error) return <Error data={error} />;

  return (
    <React.Fragment>
      <Container fluid={true}>
        <HeaderMain title='Coupons' className='mb-5 mt-4' />
        <Row>
          <Col lg={12}>
            <Card className='mb-0'>
              {data && (
                <>
                  <List coupons={data.coupons.coupons} />
                  <CardFooter className='d-flex justify-content-center pb-0'>
                    <ListPagination
                      totalRecords={data.coupons.totalCount}
                      pageNeighbours={1}
                      onPageChanged={onPageChange}
                      pageLimit={defaultPaginationSettings.limit}
                      currentPage={page}
                    />
                  </CardFooter>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  );
};

export default InvoicesContainer;
