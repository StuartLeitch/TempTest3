import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { v4 as uuidv4 } from 'uuid';

import { MenuContext } from './MenuContext';

/**
 * Renders a collapse trigger or a ReactRouter Link
 */
const SidebarMenuItemLink = (props) =>
  props.to || props.href ? (
    props.to ? (
      <Link to={props.to} className={`${props.classBase}__entry__link`}>
        {props.children}
      </Link>
    ) : (
      <a
        href={props.href}
        target='_blank'
        rel='noopener noreferrer'
        className={`${props.classBase}__entry__link`}
      >
        {props.children}
      </a>
    )
  ) : (
    <a
      href='javascript:;'
      className={`${props.classBase}__entry__link`}
      onClick={() => props.onToggle()}
    >
      {props.children}
    </a>
  );
SidebarMenuItemLink.propTypes = {
  to: PropTypes.string,
  href: PropTypes.string,
  active: PropTypes.bool,
  onToggle: PropTypes.func,
  children: PropTypes.node,
  classBase: PropTypes.string,
};

/**
 * The main menu entry component
 */
export class SidebarMenuItem extends React.Component<SidebarMenuItemProps> {
  static propTypes = {
    // MenuContext props
    addEntry: PropTypes.func,
    updateEntry: PropTypes.func,
    removeEntry: PropTypes.func,
    entries: PropTypes.object,
    // Provided props
    parentId: PropTypes.string,
    children: PropTypes.node,
    isSubNode: PropTypes.bool,
    currentUrl: PropTypes.string,
    slim: PropTypes.bool,
    // User props
    icon: PropTypes.node,
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    to: PropTypes.string,
    href: PropTypes.string,
    exact: PropTypes.bool,
    noCaret: PropTypes.bool,
  };

  static defaultProps = {
    exact: true,
  };
  id: string;

  constructor(props: SidebarMenuItemProps) {
    super(props);

    this.id = uuidv4();
  }

  componentDidMount() {
    const entry = {
      id: this.id,
      parentId: this.props.parentId,
      exact: !!this.props.exact,
      url: '',
    };

    if (this.props.to) {
      entry.url = this.props.to;
    }
  }

  render() {
    const classBase = this.props.isSubNode ? 'sidebar-submenu' : 'sidebar-menu';
    const itemClass = classNames(`${classBase}__entry`, {
      [`${classBase}__entry--nested`]: !!this.props.children,
    });

    return (
      <li
        className={classNames(itemClass, {
          'sidebar-menu__entry--no-caret': this.props.noCaret,
        })}
      >
        <SidebarMenuItemLink
          to={this.props.to || null}
          href={this.props.href || null}
          classBase={classBase}
        >
          {this.props.icon &&
            React.cloneElement(this.props.icon, {
              className: classNames(
                this.props.icon.props.className,
                `${classBase}__entry__icon`
              ),
            })}
          {typeof this.props.title === 'string' ? (
            <span>{this.props.title}</span>
          ) : (
            this.props.title
          )}
        </SidebarMenuItemLink>
        {this.props.children && (
          <ul className='sidebar-submenu'>
            {React.Children.map(this.props.children, (child) => (
              <MenuContext.Consumer>
                {(ctx) =>
                  React.cloneElement(child as any, {
                    isSubNode: true,
                    parentId: this.id,
                    currentUrl: this.props.currentUrl,
                    slim: this.props.slim,
                    ...ctx,
                  })
                }
              </MenuContext.Consumer>
            ))}
          </ul>
        )}
      </li>
    );
  }
}

interface SidebarMenuItemProps {
  [key: string]: any;
}
