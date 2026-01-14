import { useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import {
  AppLayout,
  SideNavigation,
  TopNavigation,
  BreadcrumbGroup,
  type SideNavigationProps,
  type TopNavigationProps,
} from '@cloudscape-design/components'
import { I18nProvider } from '@cloudscape-design/components/i18n'
import messages from '@cloudscape-design/components/i18n/messages/all.en'
import { UserProvider, useUser } from './context/UserContext'
import Dashboard from './pages/Dashboard'
import { generateMfeRoutes } from './components/MfeRoutes'
import { mfeList } from './mfe-registry'

function AppContent() {
  const [navigationOpen, setNavigationOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, login } = useUser()

  const handleLogin = () => {
    login({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    })
  }

  // Build navigation items from MFE registry
  const navItems: SideNavigationProps.Item[] = [
    { type: 'link', text: 'Dashboard', href: '/' },
    { type: 'divider' },
    { type: 'section-group', title: 'Microfrontends', items:
      mfeList.map(mfe => ({
        type: 'link' as const,
        text: mfe.displayName,
        href: mfe.routePath,
      }))
    },
  ]

  // Build breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const items = [{ text: 'Home', href: '/' }]

    if (location.pathname !== '/') {
      const mfe = mfeList.find(m => location.pathname.startsWith(m.routePath))
      if (mfe) {
        items.push({ text: mfe.displayName, href: mfe.routePath })

        // Add sub-paths if present
        const subPath = location.pathname.replace(mfe.routePath, '').replace(/^\//, '')
        if (subPath) {
          items.push({ text: subPath.charAt(0).toUpperCase() + subPath.slice(1), href: location.pathname })
        }
      }
    }

    return items
  }

  // User menu utilities
  const userMenuItems: TopNavigationProps.MenuDropdownUtility = isAuthenticated && user
    ? {
        type: 'menu-dropdown',
        text: user.name,
        description: user.email,
        iconName: 'user-profile',
        items: [
          { id: 'profile', text: 'Profile' },
          { id: 'preferences', text: 'Preferences' },
          { id: 'signout', text: 'Sign out' },
        ],
        onItemClick: ({ detail }) => {
          if (detail.id === 'signout') {
            logout()
          }
        },
      }
    : {
        type: 'menu-dropdown',
        text: 'Sign in',
        iconName: 'user-profile',
        items: [{ id: 'signin', text: 'Sign in' }],
        onItemClick: () => handleLogin(),
      }

  return (
    <>
      <TopNavigation
        identity={{
          href: '/',
          title: 'MicroFrontend Platform',
          onFollow: (e) => {
            e.preventDefault()
            navigate('/')
          },
        }}
        utilities={[
          {
            type: 'button',
            iconName: 'notification',
            ariaLabel: 'Notifications',
            badge: true,
            disableUtilityCollapse: false,
          },
          {
            type: 'button',
            iconName: 'settings',
            ariaLabel: 'Settings',
          },
          userMenuItems,
        ]}
      />
      <AppLayout
        navigation={
          <SideNavigation
            header={{ href: '/', text: 'Services' }}
            activeHref={location.pathname}
            items={navItems}
            onFollow={(e) => {
              e.preventDefault()
              navigate(e.detail.href)
            }}
          />
        }
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        breadcrumbs={
          <BreadcrumbGroup
            items={getBreadcrumbs()}
            onFollow={(e) => {
              e.preventDefault()
              navigate(e.detail.href)
            }}
          />
        }
        toolsHide={true}
        content={
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {generateMfeRoutes()}
          </Routes>
        }
      />
    </>
  )
}

function App() {
  return (
    <I18nProvider locale="en" messages={[messages]}>
      <BrowserRouter>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </BrowserRouter>
    </I18nProvider>
  )
}

export default App
