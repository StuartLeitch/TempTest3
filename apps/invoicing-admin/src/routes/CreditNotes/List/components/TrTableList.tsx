import React from 'react';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import format from 'date-fns/format';
import numeral from 'numeral';

import { Badge } from '../../../../components';

/*eslint-disable */
const CREATION_REASON = {
  'withdrawn-manuscript' : 'Withdrawn Manuscript',
  'reduction-applied' : 'Reduction Applied',
  'waived-manuscript' : 'Waived Manuscript',
  'changed-payer-details' : 'Changed Payer Details',
  'bad-debt' : 'Bad Debt',
  'other' : 'Other',
};

const TrTableCreditNotesList = ({creditNotes}) => (
  <React.Fragment>
    {creditNotes.creditNotes.map(
      ({
        id,
        creationReason,
        persistentReferenceNumber,
        price,
        vat,
        dateIssued,
        dateCreated
      }) => (
        <tr key={id}>
          <td className='align-middle'>
            <div>{CREATION_REASON[creationReason]}</div>
          </td>

          <td className='align-middle'>
            <Link
              to={`/credit-notes/details/${id}`}
              className='text-decoration-none'
            >
              <span className={ 'text-secondary'}>
                <strong>
                    {persistentReferenceNumber}
                </strong>
              </span>
            </Link>
          </td>

          <td className='align-middle'>
            <strong
              className={price < 0 ? 'text-danger' : 'text-success'}
            >
              {numeral(price).format('$0.00')}
            </strong>
          </td>

          <td className='align-middle'>
            <Link to={`/credit-notes/details/${id}`}
              className='text-decoration-none'
            >
              <span className='text-secondary'>
              {vat}%
              </span>
            </Link>
          </td>

          <td className='align-middle text-nowrap'>
            {dateIssued && format(new Date(dateIssued), 'dd MMM yyyy')}
          </td>

          <td className='align-middle text-nowrap'>
            {dateCreated && format(new Date(dateCreated), 'dd MMM yyyy')}
          </td>

        </tr>
      )
    )}
  </React.Fragment>
);

export { TrTableCreditNotesList };
