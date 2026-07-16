(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__0xsdvtq._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/auth.config.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// auth.config.ts
// ============= IMPORTS =============
__turbopack_context__.s([
    "authConfig",
    ()=>authConfig
]);
const authConfig = {
    session: {
        strategy: 'jwt',
        maxAge: Number(process.env.SESSION_MAX_AGE ?? 28800)
    },
    pages: {
        signIn: '/login'
    },
    providers: [],
    callbacks: {
        async jwt ({ token, user }) {
            if (user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.id = user.id;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.permissions = user.permissions;
            }
            return token;
        },
        async session ({ session, token }) {
            session.user.id = token.id;
            session.user.permissions = token.permissions ?? [];
            return session;
        }
    }
};
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
// middleware.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$31_next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$d_f35176488ced4dd951d80c2a65f97160$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next-auth@5.0.0-beta.31_next@16.2.6_@babel+core@7.29.0_@opentelemetry+api@1.9.0_react-d_f35176488ced4dd951d80c2a65f97160/node_modules/next-auth/index.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/auth.config.ts [middleware-edge] (ecmascript)");
;
;
const { auth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$2d$auth$40$5$2e$0$2e$0$2d$beta$2e$31_next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$d_f35176488ced4dd951d80c2a65f97160$2f$node_modules$2f$next$2d$auth$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])(__TURBOPACK__imported__module__$5b$project$5d2f$auth$2e$config$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["authConfig"]);
const __TURBOPACK__default__export__ = auth((req)=>{
    const isLoggedIn = !!req.auth;
    const isLoginPage = req.nextUrl.pathname.startsWith('/login');
    const isPublicAsset = req.nextUrl.pathname.startsWith('/api/auth') || req.nextUrl.pathname.startsWith('/api/health') || req.nextUrl.pathname.startsWith('/api/uploads') || req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname === '/favicon.ico';
    if (isPublicAsset) return;
    if (!isLoggedIn && !isLoginPage) {
        return Response.redirect(new URL('/login', req.nextUrl));
    }
    if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL('/home', req.nextUrl));
    }
});
const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__0xsdvtq._.js.map