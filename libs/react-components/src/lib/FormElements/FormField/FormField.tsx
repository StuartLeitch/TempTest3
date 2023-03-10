import React from 'react';
import { get } from 'lodash';
import { Field, FieldProps } from 'formik';
import { FlexboxProps, LayoutProps, SpaceProps } from 'styled-system';

import Input from '../Input';
import { Flex } from '../../Flex';
import { Label, Text } from '../../Typography';
import { FormFieldProps } from '../CommonTypes';

export interface Props extends FlexboxProps, LayoutProps, SpaceProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  component?: React.ComponentType<FormFieldProps>;
}

const hasError = (form, name) => {
  return form.submitCount > 0 || get(form.touched, name);
};

const FormField: React.FunctionComponent<Props> = ({
  name,
  label,
  placeholder,
  required,
  component: Component,
  error: givenError,
  ...rest
}) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps) => {
        const error =
          (hasError(form, name) && get(form.errors, name)) || givenError;
        return (
          <Flex vertical {...rest}>
            <Label required={required} htmlFor={field.name}>
              {label}
            </Label>
            <Component
              name={field.name}
              status={error ? 'warning' : 'none'}
              placeholder={placeholder}
              {...field}
            />
            <Flex minHeight={6} justifyContent='flex-start'>
              {error && <Text type='warning'>{error}</Text>}
            </Flex>
          </Flex>
        );
      }}
    </Field>
  );
};

FormField.defaultProps = {
  component: Input
};

export default FormField;
