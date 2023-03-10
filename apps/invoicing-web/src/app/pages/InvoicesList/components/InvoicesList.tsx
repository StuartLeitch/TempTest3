import Axios from "axios";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReactPaginate from "react-paginate";
import styled, { StyledFunction } from "styled-components";
import { Loader } from "@hindawi/react-components";

import { config } from "../../../../config";

interface OffsetProps {
  offset: number;
}

export const InvoicesList = ({
  invoices,
  invoicesLoading,
  totalCount,
  getInvoices,
}) => {
  const [offset, setOffset] = useState(0);

  let pageCount = Math.ceil(totalCount / config.invoicesPerPage);

  const handlePageClick = (data: any) => {
    let selected = data.selected;

    setOffset(Math.ceil(selected * config.invoicesPerPage));
  };

  useEffect(() => {
    let limit = config.invoicesPerPage;
    getInvoices({ offset, limit });
  }, [offset]);

  let maybeRenderContent = (
    <StyledInvoicesList offset={offset}>
      {invoices.map((invoice: any) => (
        <StyledInvoiceItem key={invoice.id}>
          <div style={{ width: "100%" }}>
            <StyledInvoiceLink to={"/payment-details/" + invoice.id}>
              Invoice #{invoice.id}
            </StyledInvoiceLink>
            <StyledInvoiceSubtitle>
              <dt>STATUS:</dt>
              <dd className={invoice.status.toLowerCase()}>{invoice.status}</dd>
              <dt>Manuscript Custom ID:</dt>
              <dd>{invoice.customId}</dd>
              <dt>Manuscript Title:</dt>
              <dd>{invoice.manuscriptTitle}</dd>
              <dt>Type:</dt>
              <dd>{invoice.type}</dd>
              <dt>Amount:</dt>
              <dd>{invoice.price} 💲</dd>
              {invoice.status === "DRAFT" && (
                <dd>
                  <button
                    onClick={() => {
                      Axios.post(`${config.apiRoot}/acceptManuscript`, {
                        invoiceId: invoice.id,
                      });
                    }}
                  >
                    Accept manuscript
                  </button>
                </dd>
              )}
            </StyledInvoiceSubtitle>
          </div>
        </StyledInvoiceItem>
      ))}
    </StyledInvoicesList>
  );

  if (invoicesLoading) {
    maybeRenderContent = (
      <Centered>
        <Loader size={40} />
      </Centered>
    );
  }

  return (
    <>
      {maybeRenderContent}
      <ReactPaginate
        previousLabel={"<"}
        nextLabel={">"}
        breakLabel={"..."}
        breakClassName={"break-me"}
        pageCount={pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePageClick}
        containerClassName={"pagination"}
        subContainerClassName={"pages pagination"}
        activeClassName={"active"}
      />
    </>
  );
};

const StyledInvoicesList = styled.ul<{ offset: number }>`
  counter-reset: ${(props: any) => `index ${props.offset}`};
  padding: 0;
  max-width: 100%;
`;

const StyledInvoiceItem = styled.li`
  counter-increment: index;
  display: flex;
  align-items: center;
  padding: 12px 0;
  box-sizing: border-box;

  &::before {
    content: counters(index, ".", decimal-leading-zero);
    font-size: 1.5rem;
    text-align: right;
    font-weight: bold;
    min-width: 50px;
    padding-right: 12px;
    font-variant-numeric: tabular-nums;
    align-self: flex-start;
    background-image: linear-gradient(to bottom, #00718f, #6db33f);
    background-attachment: fixed;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  & + li {
    border-top: 1px solid rgba(204, 204, 204, 0.55);
  }
`;

const StyledInvoiceLink = styled(Link)`
  font-size: 1.4rem;
  display: block;

  &:hover {
    color: #00718f;
  }
`;

const StyledInvoiceSubtitle = styled.dl`
  display: flex;
  flex-flow: row wrap;
  font-size: 1.1rem;
  max-height: 3em;

  dt {
    padding: 2px 7px;
    max-width: 200px;
    text-align: right;
  }

  dt:first-of-type {
    padding-left: 0;
  }

  dd {
    margin: 0;
    padding: 2px 7px;
    min-height: 1em;
    font-weight: bold;
    border-right: 1px solid rgba(120, 120, 120, 0.5);
  }

  dd.draft {
    color: #a8a8a8;
  }

  dd.active {
    color: #10aae2;
  }

  dd.final {
    color: #088a3c;
  }

  dd:last-of-type {
    border-right: none;
  }
`;

const Centered = styled.div`
  height: 100%;
  display: grid;
  align-items: center;
  justify-content: center;
`;
