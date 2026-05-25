import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // Disable automatic browser scroll restoration
    window.history.scrollRestoration = 'manual'

    const resetScroll = () => {
      // 1. Reset window scroll
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })

      // 2. Reset custom scrollable container views (e.g. DashboardLayout container)
      const scrollableContainers = document.querySelectorAll(
        '.overflow-y-auto, .overflow-auto, [class*="overflow-y-auto"], [class*="overflow-auto"]'
      )
      scrollableContainers.forEach((container) => {
        container.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        })
      })
    }

    resetScroll()

    // Fallback/additional frame check to handle dynamic react re-renders
    const handle = requestAnimationFrame(resetScroll)
    return () => cancelAnimationFrame(handle)
  }, [pathname, search])

  return null
}
