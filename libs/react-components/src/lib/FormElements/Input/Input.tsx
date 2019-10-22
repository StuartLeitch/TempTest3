import React from 'react';
import {SpaceProps, LayoutProps} from 'styled-system';

import Icon from '../../Icon';
import {FormFieldProps} from '../CommonTypes';
import {Input as Root, Container} from '../CommonStyles';

export type InputTypes = 'text' | 'password';

export interface Props extends FormFieldProps, SpaceProps, LayoutProps {
  type?: InputTypes;
  placeholder?: string;
}

const Input: React.FunctionComponent<Props> = ({
  type,
  status,
  placeholder,
  // input props
  name,
  value,
  onBlur,
  onFocus,
  onChange,
  ...rest
}) => {
  return (
    <Container status={status} {...rest}>
      <Root
        name={name}
        type={type}
        value={value}
        onBlur={onBlur}
        onFocus={onFocus}
        onChange={onChange}
        placeholder={placeholder}
      />
      {(status === 'warning' || status === 'info') && (
        <Icon
          ml={1}
          mr={2}
          name={status === 'warning' ? 'warningFilled' : 'infoFilled'}
          color={status === 'warning' ? 'colors.warning' : 'colors.info'}
        />
      )}
    </Container>
  );
};

Input.defaultProps = {
  type: 'text',
  status: 'none'
};

export default Input;
