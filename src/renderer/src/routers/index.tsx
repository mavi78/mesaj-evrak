import { lazy, Suspense } from 'react'
import { createHashRouter, Outlet } from 'react-router-dom'
import { LoadingSpinner } from '@renderer/components/LoadingSpinner'

const LayoutPage = lazy(() => import('@renderer/components/layout-page'))
const AnaSayfa = lazy(() => import('@renderer/pages/ana-sayfa'))

export const router = createHashRouter([
  {
    path: '/',
    element: (
      <LayoutPage>
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen">
              <LoadingSpinner />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </LayoutPage>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-screen">
                <LoadingSpinner />
              </div>
            }
          >
            <AnaSayfa />
          </Suspense>
        )
      }
    ]
  }
])
