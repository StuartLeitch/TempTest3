import React from "react";
import styled from "styled-components";
import { useField } from "formik";
import { SpaceProps } from "styled-system";
import type { IconNames } from "@hindawi/react-components";
import { Icon, Flex, Text, th } from "@hindawi/react-components";

interface Props extends SpaceProps {
  icon: IconNames;
  label: string;
  onClick: any;
  isSelected?: boolean;
}

const IconRadioButton: React.FunctionComponent<Props> = ({
  icon,
  label,
  ...rest
}) => {
  return (
    <Root {...rest}>
      <Icon size={6} name={icon} color="#667080" mr={3} />
      <Text size="normal">{label}</Text>
    </Root>
  );
};

export default IconRadioButton;

// #region styles
const Root = styled(Flex)`
  align-items: center;
  border-radius: ${th("gridUnit")};
  border: 1px solid
    ${({ isSelected }) =>
      isSelected ? th("colors.statusApproved") : th("colors.furniture")};
  background-color: ${({ isSelected }) =>
    isSelected ? th("colors.background") : "transparent"};
  cursor: pointer;
  display: flex;
  flex: 1;
  justify-content: center;
  height: calc(${th("gridUnit")} * 16);
`;
// #endregion
