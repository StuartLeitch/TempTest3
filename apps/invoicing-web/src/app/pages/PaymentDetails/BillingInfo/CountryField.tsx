import React, { Fragment, useState } from "react";
import countryList from "country-list";
import { space, layout } from "styled-system";
import styled, { css } from "styled-components";

import { Icon, Text, th, lighten } from "@hindawi/react-components";

const filterCountry = (inputCountry: string) => (c: string) =>
  c.toLowerCase().startsWith(inputCountry.toLowerCase());

const CountryField = ({ value, onChange, name, status }) => {
  const countries = countryList.getNames();
  const [expanded, setExpanded] = useState(false);
  const [countryInput, setCountryInput] = useState(() =>
    !value ? "" : countryList.getName(value),
  );

  const toggleMenu = () => {
    setExpanded(s => !s);
  };

  const selectCountry = (country: string) => () => {
    onChange(name)(countryList.getCode(country));
    setCountryInput(country);
  };

  const setCountry = e => {
    setCountryInput(e.target.value);
  };

  return (
    <Relative>
      <Root status={status}>
        <CountryInput
          value={countryInput}
          onBlur={toggleMenu}
          onFocus={toggleMenu}
          onChange={setCountry}
        />
        <Icon
          name={expanded ? "caretUp" : "caretDown"}
          color={"colors.textPrimary"}
        />
      </Root>
      {expanded && (
        <DropdownList>
          {countries
            .filter(filterCountry(countryInput))
            .map((country: string) => (
              <DropdownItem key={country} onMouseDown={selectCountry(country)}>
                <Text>{country}</Text>
              </DropdownItem>
            ))}
        </DropdownList>
      )}
    </Relative>
  );
};

export default CountryField;

// #region styles
const statusColor = ({ status }: { status: any }) => {
  switch (status) {
    case "warning":
      return css`
        border-color: ${lighten("colors.warning", 30)};

        &:hover {
          border-color: ${lighten("colors.warning", 10)};
        }

        &:focus,
        &:active {
          border-color: ${th("colors.warning")};
        }
      `;
    case "info":
      return css`
        border-color: ${lighten("colors.info", 30)};

        &:hover {
          border-color: ${lighten("colors.info", 10)};
        }

        &:focus,
        &:active {
          border-color: ${th("colors.info")};
        }
      `;
    case "success":
      return css`
        border-color: ${lighten("colors.actionPrimary", 30)};

        &:hover {
          border-color: ${lighten("colors.actionPrimary", 10)};
        }

        &:focus,
        &:active {
          border-color: ${th("colors.actionPrimary")};
          border-color: red;
        }
      `;
    case "none":
    default:
      return css`
        border-color: ${th("colors.disabled")};

        &:hover {
          border-color: ${lighten("colors.textPrimary", 60)};
        }

        &:focus,
        &:active {
          border-color: ${th("colors.textPrimary")};
        }
      `;
  }
};

const CountryInput = styled.input`
  border: none;
  outline: none;
  width: 100%;

  &:focus,
  &:active {
    outline: none;
  }
`;

const CustomText = styled(Text)`
  width: 100%;
`;

const Relative = styled.div`
  position: relative;
  width: 100%;
`;

const Root = styled.div`
  align-items: center;
  border: 1px solid ${th("colors.disabled")};
  border-radius: ${th("gridUnit")};
  color: ${th("colors.textPrimary")};
  box-sizing: border-box;
  display: flex;
  height: calc(${th("gridUnit")} * 8);
  outline: none;
  padding: 0 calc(${th("gridUnit")} * 2);
  width: 100%;

  ${statusColor};
  ${space};
  ${layout};
`;

const DropdownItem = styled.div`
  align-items: center;
  cursor: pointer;
  color: ${th("colors.textPrimary")};
  display: flex;
  height: calc(${th("gridUnit")} * 8);
  padding: 0 calc(${th("gridUnit")} * 2);

  &:hover {
    background-color: ${th("colors.background")};
  }
`;

const DropdownList = styled.div`
  background-color: ${th("colors.white")};
  border-radius: ${th("gridUnit")};
  box-shadow: 0px 2px 6px ${th("colors.disabled")};
  margin-top: ${th("gridUnit")};
  position: absolute;
  overflow: scroll;

  max-height: calc(${th("gridUnit")} * 8 * 4);
  width: 100%;
  z-index: 10;
`;
// #endregion
