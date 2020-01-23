import React from 'react';
import PropTypes from 'prop-types';
import { GraphQLClient, ClientContext } from 'graphql-hooks';

import {
  Layout,
  ThemeSelector,
  ThemeProvider,
  PageConfigConsumer
} from '../components';

import '../styles/bootstrap.scss';
import '../styles/main.scss';
import '../styles/plugins/plugins.scss';
import './../styles/plugins/plugins.css';

import { RoutedNavbars, RoutedSidebars } from './../routes';

const favIcons = [
  {
    rel: 'icon',
    type: 'image/x-icon',
    href: '/assets/images/favicons/favicon.ico'
  },

  {
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/assets/images/favicons/apple-touch-icon.png'
  },

  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/assets/images/favicons/favicon-32x32.png'
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/assets/images/favicons/favicon-16x16.png'
  }
];

const client = new GraphQLClient({
  url: 'https://demo-gql.invoicing.hindawi.com/graphql'
});

class AppLayout extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };

  render() {
    const { children } = this.props;

    return (
      <ThemeProvider initialStyle='dark' initialColor='primary'>
        <Layout sidebarSlim favIcons={favIcons}>
          {/* --------- Navbar ----------- */}
          <Layout.Navbar>
            <RoutedNavbars />
          </Layout.Navbar>
          {/* -------- Sidebar ------------*/}
          <Layout.Sidebar>
            <RoutedSidebars />
          </Layout.Sidebar>

          {/* -------- Content ------------*/}
          <Layout.Content>
            <ClientContext.Provider value={client}>
              {children}
            </ClientContext.Provider>
          </Layout.Content>

          {/* -- Theme Selector (DEMO) ----*/}
          <PageConfigConsumer>
            {({ sidebarHidden, navbarHidden }) => (
              <ThemeSelector styleDisabled={sidebarHidden && navbarHidden} />
            )}
          </PageConfigConsumer>
        </Layout>
      </ThemeProvider>
    );
  }
}

export default AppLayout;
