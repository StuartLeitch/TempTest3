import React from 'react';
import {select} from '@storybook/addon-knobs';

import Textarea from './Textarea';

export const Default = () => (
  <Textarea
    status={select('Status', ['none', 'success', 'info', 'warning'], 'none')}
  />
);

export const ControlResizing = () => (
  <Textarea
    resize={select(
      'Resize',
      ['both', 'none', 'vertical', 'horizontal'],
      'both'
    )}
    status={select('Status', ['none', 'success', 'info', 'warning'], 'none')}
  />
);

export default {
  title: 'Form Elements|Textarea',
  component: Textarea
};
