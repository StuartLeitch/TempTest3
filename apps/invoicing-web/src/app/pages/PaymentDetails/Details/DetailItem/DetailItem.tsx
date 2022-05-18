import React from "react";
import { Flex, Label, Text, ActionLink } from "@hindawi/react-components";

import { DetailItem as Root } from "./DetailItem.styles";

interface Props {
  text: string;
  label: string;
  link?: boolean;
}

const DetailItem: React.FC<Props> = ({ label, link, text }) => {
  return (
    <Root>
      <Flex flex={1} justifyContent="flex-start">
        <Label>{label}</Label>
      </Flex>
      <Flex flex={2} justifyContent="flex-start">
        {link ? (
          <ActionLink type="action">
            <a href={text}>{text}</a>
          </ActionLink>
        ) : (
          <Text>{text}</Text>
        )}
      </Flex>
    </Root>
  );
};

export default DetailItem;
