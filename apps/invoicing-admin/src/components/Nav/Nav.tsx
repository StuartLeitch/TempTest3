import React from 'react';
import classNames from 'classnames';

import { Nav as BsNav } from 'reactstrap';

const Nav: React.FC<NavProps> = ({ accent, className, ...otherProps }) => (
  <BsNav
    className={classNames(className, 'nav', { 'nav-accent': accent })}
    {...otherProps}
  />
);

Nav.defaultProps = {
  accent: false,
};

interface NavProps {
  accent?: boolean;
  className?: string;
  children: Element | Element[] | JSX.Element | JSX.Element[];
  [propName: string]: any;
}

export { Nav };
