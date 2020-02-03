import React from 'react';
import faker from 'faker/locale/en_US';
import MaskedInput from 'react-text-mask';

import { CustomInput, Input, Nav, NavItem, NavLink } from '../../../components';
import { JournalsSelections } from '../Invoices/JournalsSelections';

const InvoicesLeftNav = props => {
  const onFilterHandler = (filterName, value = null) => e => {
    props.setFilter(filterName, value, e.target);
  };
  return (
    <React.Fragment>
      {/* START Invoice Status */}
      <Nav vertical className='mb-3'>
        <NavItem className='mb-2'>
          <NavLink href='#' className='small d-flex px-1'>
            <span>Invoice Status</span>
            <i className='fas fa-angle-down align-self-center ml-auto'></i>
          </NavLink>
        </NavItem>
        <NavItem className='d-flex px-2 mb-2'>
          <CustomInput
            onChange={onFilterHandler('invoiceStatus', 'DRAFT')}
            className='text-warning'
            type='checkbox'
            id='invoice-status-draft'
            label='Draft'
            inline
          />
          {/* <span className='small ml-auto align-self-center'>
            ({faker.finance.mask()})
          </span> */}
        </NavItem>
        <NavItem className='d-flex px-2 mb-2'>
          <CustomInput
            onChange={onFilterHandler('invoiceStatus', 'ACTIVE')}
            className='text-primary'
            type='checkbox'
            id='invoice-status-active'
            label='Active'
            inline
          />
          {/* <span className='small ml-auto align-self-center'>
            ({faker.finance.mask()})
          </span> */}
        </NavItem>
        <NavItem className='d-flex px-2 mb-2'>
          <CustomInput
            onChange={onFilterHandler('invoiceStatus', 'FINAL')}
            className='text-success'
            type='checkbox'
            id='invoice-status-final'
            label='Final'
            inline
          />
          {/* <span className='small ml-auto align-self-center'>
            ({faker.finance.mask()})
          </span> */}
        </NavItem>
      </Nav>
      {/* END Invoice Status */}
      {/* START Transaction Status */}
      <Nav vertical className='mb-3'>
        <NavItem className='mb-2'>
          <NavLink href='#' className='small d-flex px-1'>
            <span>Transaction Status</span>
            <i className='fas fa-angle-down align-self-center ml-auto'></i>
          </NavLink>
        </NavItem>
        <NavItem className='d-flex px-2 mb-2'>
          <CustomInput
            className='text-warning'
            type='checkbox'
            id='checkbox1'
            label='Draft'
            inline
          />
          {/* <span className='small ml-auto align-self-center'>
            ({faker.finance.mask()})
          </span> */}
        </NavItem>
        <NavItem className='d-flex px-2 mb-2'>
          <CustomInput
            className='text-primary'
            type='checkbox'
            id='checkbox2'
            label='Active'
            inline
          />
          {/* <span className='small ml-auto align-self-center'>
            ({faker.finance.mask()})
          </span> */}
        </NavItem>
        <NavItem className='d-flex px-2 mb-2'>
          <CustomInput
            className='text-success'
            type='checkbox'
            id='checkbox3'
            label='Final'
            inline
          />
          {/* <span className='small ml-auto align-self-center'>
            ({faker.finance.mask()})
          </span> */}
        </NavItem>
      </Nav>
      {/* END Transaction Status */}
      {/* START Journal Title */}
      <Nav vertical className='mb-3'>
        <NavItem className='mb-2'>
          <NavLink href='#' className='small d-flex px-1'>
            <span>Journal Title</span>
            <i className='fas fa-angle-down align-self-center ml-auto'></i>
          </NavLink>
        </NavItem>
        <JournalsSelections />
        {/* <NavItem className='d-flex p-0 form-control'>
      </NavItem> */}
      </Nav>
      {/* END Journal Title */}
      {/* START Reference Number */}
      <Nav vertical className='mb-3'>
        <NavItem className='mb-2'>
          <NavLink href='#' className='small d-flex px-1'>
            <span>Reference Number</span>
            <i className='fas fa-angle-down align-self-center ml-auto'></i>
          </NavLink>
        </NavItem>
        <NavItem className='d-flex p-0'>
          <Input
            mask={[
              /[0-9]/,
              /\d/,
              /\d/,
              /\d/,
              /\d/,
              '/',
              /1|2/,
              /0|9/,
              /\d/,
              /\d/
            ]}
            className='form-control'
            placeholder='Enter a reference number'
            onChange={onFilterHandler('referenceNumber')}
            tag={MaskedInput}
            id='refNumber'
          />
        </NavItem>
      </Nav>
      {/* END Reference Number */}
      {/* START Custom ID */}
      <Nav vertical className='mb-3'>
        <NavItem className='mb-2'>
          <NavLink href='#' className='small d-flex px-1'>
            <span>Custom ID</span>
            <i className='fas fa-angle-down align-self-center ml-auto'></i>
          </NavLink>
        </NavItem>
        <NavItem className='d-flex p-0'>
          <Input
            className='form-control'
            placeholder='Enter a custom ID'
            // tag={MaskedInput}
            id='customId'
          />
        </NavItem>
      </Nav>
      {/* END Reference Number */}
    </React.Fragment>
  );
};

export { InvoicesLeftNav };
