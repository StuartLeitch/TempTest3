import styled, {AnyStyledComponent, css} from 'styled-components';
import {layout, space, flex} from 'styled-system';

import {th} from '../Theme';

import {SeparatorDirection} from './SeparatorTypes';

const separatorDirection = ({direction}: {direction: SeparatorDirection}) => {
  switch (direction) {
    case 'vertical':
      return css`
        border-right-width: 1px;
        height: 100%;
      `;
    case 'horizontal':
      return css`
        border-bottom-width: 1px;
        width: 100%;
      `;
    default:
      return css``;
  }
};

export const Separator: AnyStyledComponent = styled.div`
  border-color: ${th('colors.furniture')};
  box-sizing: border-box;
  border-style: solid;
  border-width: 0;

  ${separatorDirection}
  ${layout};
  ${space};
  ${flex};
`;
