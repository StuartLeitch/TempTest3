import React from 'react';

import { FormFieldProps } from '../CommonTypes';

type ResizeOptions = 'both' | 'none' | 'vertical' | 'horizontal';

export interface Props extends FormFieldProps {
  id?: string;
  placeholder?: string;
  resize?: ResizeOptions;
}

import { Textarea as Input } from './Textarea.styles';

const Textarea: React.FunctionComponent<Props> = ({
  status,
  resize,
  ...rest
}) => {
  return <Input status={status} resize={resize} {...rest} />;
};

Textarea.defaultProps = {
  resize: 'both'
};

export default Textarea;
