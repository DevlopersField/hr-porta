module.exports = [
"[project]/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// instrumentation.ts
__turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time truthy", 1) {
        const { seedIfEmpty } = await __turbopack_context__.A("[project]/lib/db/seed.ts [instrumentation] (ecmascript, async loader)");
        await seedIfEmpty();
    }
}
}),
];

//# sourceMappingURL=instrumentation_ts_0zq9-xz._.js.map