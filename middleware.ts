import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value);
                    });
                    res = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        res.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession();

    const pathname = req.nextUrl.pathname;

    // Define protected routes
    const protectedRoutes = ['/dashboard', '/admin'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    // If accessing protected route without session, redirect to login
    if (isProtectedRoute && !session) {
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    // Admin routes protection
    if (pathname.startsWith('/admin') && session) {
        const { data: profile } = await supabase
            .from('perfis')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return res;
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
    ],
};
