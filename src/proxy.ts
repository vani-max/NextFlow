import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

// Next.js 16 uses "proxy" convention instead of "middleware"
export function proxy(request: Parameters<typeof clerkHandler>[0], event: Parameters<typeof clerkHandler>[1]) {
  return clerkHandler(request, event)
}

export const config = { matcher: ['/((?!_next|.*\\..*).*)'] }
