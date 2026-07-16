module.exports = [
"[externals]/node:fs/promises [external] (node:fs/promises, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs/promises", () => require("node:fs/promises"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/constants [external] (constants, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("constants", () => require("constants"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/process [external] (process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}),
"[project]/lib/db/core.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteKey",
    ()=>deleteKey,
    "getDataDir",
    ()=>getDataDir,
    "readBinary",
    ()=>readBinary,
    "readJson",
    ()=>readJson,
    "storageIsBlobs",
    ()=>storageIsBlobs,
    "updateJson",
    ()=>updateJson,
    "withLock",
    ()=>withLock,
    "withLocks",
    ()=>withLocks,
    "writeBinary",
    ()=>writeBinary,
    "writeJson",
    ()=>writeJson
]);
// lib/db/core.ts
// ============= IMPORTS =============
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$proper$2d$lockfile$40$4$2e$1$2e$2$2f$node_modules$2f$proper$2d$lockfile$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/proper-lockfile@4.1.2/node_modules/proper-lockfile/index.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@netlify+blobs@10.7.9/node_modules/@netlify/blobs/dist/main.js [instrumentation] (ecmascript) <locals>");
;
;
;
;
;
function storageIsBlobs() {
    return process.env.STORAGE_BACKEND === 'blobs' || process.env.NETLIFY === 'true';
}
// Internal alias so the branches below read naturally.
function useBlobs() {
    return storageIsBlobs();
}
// Lazily obtain the Netlify Blobs store. Called ONLY inside blobs branches so
// local/test runs never touch Netlify context. getStore auto-configures on a
// deployed Netlify site — no siteID/token passed.
function blobStore() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$netlify$2b$blobs$40$10$2e$7$2e$9$2f$node_modules$2f40$netlify$2f$blobs$2f$dist$2f$main$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getStore"])({
        name: 'hr-portal',
        consistency: 'strong'
    });
}
function getDataDir() {
    if (process.env.DATA_DIR) {
        return process.env.DATA_DIR;
    }
    if (process.env.NETLIFY === 'true') {
        return '/tmp/data';
    }
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), 'data');
}
const LOCK_OPTIONS = {
    retries: {
        retries: 100,
        minTimeout: 20,
        maxTimeout: 250,
        factor: 1.5,
        randomize: true
    },
    stale: Number(process.env.LOCK_STALE_MS ?? 10000),
    update: Number(process.env.LOCK_HEARTBEAT_MS ?? 5000)
};
// ============= PATH RESOLUTION =============
function resolve(relPath) {
    const dataDir = getDataDir();
    const full = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].resolve(dataDir, relPath);
    if (!full.startsWith(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].resolve(dataDir))) {
        throw new Error(`Path traversal blocked: ${relPath}`);
    }
    return full;
}
async function readJson(relPath, schema, fallback) {
    if (useBlobs()) {
        const store = blobStore();
        const data = await store.get(relPath, {
            type: 'json'
        });
        if (data == null) {
            if (fallback !== undefined) return fallback;
            // Mirror the fs ENOENT-with-no-fallback behavior (throw).
            throw new Error(`readJson: key not found and no fallback: ${relPath}`);
        }
        return schema.parse(data);
    }
    const full = resolve(relPath);
    try {
        const raw = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].readFile(full, 'utf8');
        return schema.parse(JSON.parse(raw));
    } catch (err) {
        if (err.code === 'ENOENT' && fallback !== undefined) {
            return fallback;
        }
        throw err;
    }
}
// ============= ATOMIC WRITE =============
async function atomicWrite(full, data) {
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(full), {
        recursive: true
    });
    const tmp = `${full}.${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomBytes(6).toString('hex')}.tmp`;
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(tmp, data, 'utf8');
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].rename(tmp, full);
}
async function withLock(relPath, mutator) {
    if (useBlobs()) {
        // Blobs has no file-lock primitive. Single-file write safety is provided by
        // updateJson's etag CAS loop; here we just run the mutator directly.
        return await mutator();
    }
    const full = resolve(relPath);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(full), {
        recursive: true
    });
    const release = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$proper$2d$lockfile$40$4$2e$1$2e$2$2f$node_modules$2f$proper$2d$lockfile$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"].lock(full, {
        ...LOCK_OPTIONS,
        realpath: false
    });
    try {
        return await mutator();
    } finally{
        await release();
    }
}
async function updateJson(relPath, schema, fallback, mutator) {
    if (useBlobs()) {
        // Optimistic read-modify-write with etag compare-and-set. Preserves the
        // concurrency safety withLock gave on fs, since Blobs has no lock.
        const store = blobStore();
        const MAX_ATTEMPTS = 25;
        for(let attempt = 0; attempt < MAX_ATTEMPTS; attempt++){
            const res = await store.getWithMetadata(relPath, {
                type: 'json'
            });
            const current = res ? schema.parse(res.data) : fallback;
            const next = await mutator(current);
            schema.parse(next);
            const w = await store.set(relPath, JSON.stringify(next), res ? {
                onlyIfMatch: res.etag
            } : {
                onlyIfNew: true
            });
            if (w.modified) return next;
            // Conditional write lost a race — back off (jittered) and retry.
            const backoff = 20 + Math.floor(Math.random() * 40);
            await new Promise((r)=>setTimeout(r, backoff));
        }
        throw new Error(`updateJson: too many write conflicts on ${relPath}`);
    }
    return withLock(relPath, async ()=>{
        const current = await readJson(relPath, schema, fallback);
        const next = await mutator(current);
        schema.parse(next);
        await atomicWrite(resolve(relPath), JSON.stringify(next, null, 2));
        return next;
    });
}
async function withLocks(paths, mutator) {
    if (useBlobs()) {
        // No lock primitive on Blobs; cross-file writes are last-write-wins.
        return await mutator();
    }
    const sorted = [
        ...new Set(paths)
    ].sort();
    const releases = [];
    try {
        for (const p of sorted){
            const full = resolve(p);
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(full), {
                recursive: true
            });
            releases.push(await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$proper$2d$lockfile$40$4$2e$1$2e$2$2f$node_modules$2f$proper$2d$lockfile$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"].lock(full, {
                ...LOCK_OPTIONS,
                realpath: false
            }));
        }
        return await mutator();
    } finally{
        for (const release of releases.reverse()){
            try {
                await release();
            } catch  {}
        }
    }
}
async function readBinary(key) {
    if (useBlobs()) {
        const store = blobStore();
        const ab = await store.get(key, {
            type: 'arrayBuffer'
        });
        return ab == null ? null : Buffer.from(ab);
    }
    const full = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(getDataDir(), key);
    try {
        return await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].readFile(full);
    } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
    }
}
async function writeBinary(key, buf) {
    if (useBlobs()) {
        const store = blobStore();
        // Copy into a fresh Uint8Array so its backing ArrayBuffer is exactly the
        // bytes we want (no shared-buffer / offset surprises).
        await store.set(key, new Uint8Array(buf).buffer);
        return;
    }
    const full = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(getDataDir(), key);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(full), {
        recursive: true
    });
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].writeFile(full, buf);
}
async function deleteKey(key) {
    if (useBlobs()) {
        const store = blobStore();
        await store.delete(key);
        return;
    }
    const full = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(getDataDir(), key);
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].rm(full);
    } catch (err) {
        if (err.code === 'ENOENT') return;
        throw err;
    }
}
async function writeJson(key, value) {
    if (useBlobs()) {
        const store = blobStore();
        await store.setJSON(key, value);
        return;
    }
    const full = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(getDataDir(), key);
    await atomicWrite(full, JSON.stringify(value, null, 2));
}
}),
"[project]/lib/db/users.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserSchema",
    ()=>UserSchema,
    "UsersFileSchema",
    ()=>UsersFileSchema,
    "createUser",
    ()=>createUser,
    "deactivateUser",
    ()=>deactivateUser,
    "getUserByEmail",
    ()=>getUserByEmail,
    "getUserById",
    ()=>getUserById,
    "listUsers",
    ()=>listUsers,
    "setPasswordHash",
    ()=>setPasswordHash,
    "setPasswordResetToken",
    ()=>setPasswordResetToken,
    "touchLastLogin",
    ()=>touchLastLogin,
    "updateUserPermissions",
    ()=>updateUserPermissions,
    "updateUserProfile",
    ()=>updateUserProfile
]);
// lib/db/users.ts
// ============= IMPORTS =============
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/external.js [instrumentation] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/core.ts [instrumentation] (ecmascript)");
;
;
;
const UserSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email(),
    passwordHash: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    displayName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    avatarPath: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    department: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default(''),
    jobTitle: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default(''),
    managerId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    permissions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).default([]),
    active: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(true),
    createdAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    lastLoginAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    passwordResetToken: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    mustChangePassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false)
});
const UsersFileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    users: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(UserSchema)
});
const EMPTY = {
    users: []
};
const PATH = 'users.json';
async function listUsers() {
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["readJson"])(PATH, UsersFileSchema, EMPTY);
    return data.users;
}
async function getUserById(id) {
    const users = await listUsers();
    return users.find((u)=>u.id === id) ?? null;
}
async function getUserByEmail(email) {
    const users = await listUsers();
    return users.find((u)=>u.email.toLowerCase() === email.toLowerCase()) ?? null;
}
async function createUser(input) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, UsersFileSchema, EMPTY, (current)=>{
        if (current.users.some((u)=>u.email.toLowerCase() === input.email.toLowerCase())) {
            throw new Error(`User with email ${input.email} already exists`);
        }
        const newUser = {
            id: `u_${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomBytes(8).toString('hex')}`,
            email: input.email,
            passwordHash: input.passwordHash,
            displayName: input.displayName,
            avatarPath: null,
            department: input.department ?? '',
            jobTitle: input.jobTitle ?? '',
            managerId: input.managerId ?? null,
            permissions: input.permissions ?? [],
            active: true,
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
            passwordResetToken: null,
            mustChangePassword: input.mustChangePassword ?? false
        };
        return {
            users: [
                ...current.users,
                newUser
            ]
        };
    }).then((result)=>result.users[result.users.length - 1]);
}
async function updateUserPermissions(id, permissions) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, UsersFileSchema, EMPTY, (current)=>({
            users: current.users.map((u)=>u.id === id ? {
                    ...u,
                    permissions
                } : u)
        }));
}
async function updateUserProfile(id, patch) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, UsersFileSchema, EMPTY, (current)=>({
            users: current.users.map((u)=>u.id === id ? {
                    ...u,
                    ...patch
                } : u)
        }));
}
async function deactivateUser(id) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, UsersFileSchema, EMPTY, (current)=>({
            users: current.users.map((u)=>u.id === id ? {
                    ...u,
                    active: false
                } : u)
        }));
}
async function setPasswordHash(id, passwordHash, mustChange = false) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, UsersFileSchema, EMPTY, (current)=>({
            users: current.users.map((u)=>u.id === id ? {
                    ...u,
                    passwordHash,
                    mustChangePassword: mustChange,
                    passwordResetToken: null
                } : u)
        }));
}
async function setPasswordResetToken(id, token) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, UsersFileSchema, EMPTY, (current)=>({
            users: current.users.map((u)=>u.id === id ? {
                    ...u,
                    passwordResetToken: token
                } : u)
        }));
}
async function touchLastLogin(id) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, UsersFileSchema, EMPTY, (current)=>({
            users: current.users.map((u)=>u.id === id ? {
                    ...u,
                    lastLoginAt: new Date().toISOString()
                } : u)
        }));
}
}),
"[project]/lib/permissions.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/permissions.ts
// ============= PERMISSION ENUM =============
__turbopack_context__.s([
    "ALL_PERMISSIONS",
    ()=>ALL_PERMISSIONS,
    "ForbiddenError",
    ()=>ForbiddenError,
    "PERMISSIONS",
    ()=>PERMISSIONS,
    "canViewPeople",
    ()=>canViewPeople,
    "hasAnyPermission",
    ()=>hasAnyPermission,
    "hasPermission",
    ()=>hasPermission,
    "mergeSubmittedPermissions",
    ()=>mergeSubmittedPermissions,
    "requirePermission",
    ()=>requirePermission
]);
const PERMISSIONS = {
    // People & users
    VIEW_ALL_PEOPLE: 'view_all_people',
    EDIT_USER_PROFILES: 'edit_user_profiles',
    MANAGE_PERMISSIONS: 'manage_permissions',
    CREATE_USERS: 'create_users',
    DEACTIVATE_USERS: 'deactivate_users',
    // Leave
    APPROVE_LEAVE: 'approve_leave',
    VIEW_TEAM_LEAVE: 'view_team_leave',
    VIEW_ALL_LEAVE: 'view_all_leave',
    // Attendance & timesheet
    VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
    VIEW_ALL_ATTENDANCE: 'view_all_attendance',
    EDIT_ATTENDANCE_RECORDS: 'edit_attendance_records',
    MANAGE_PROJECTS: 'manage_projects',
    // Salary
    VIEW_ALL_SALARY: 'view_all_salary',
    EDIT_SALARY: 'edit_salary',
    GENERATE_PAYSLIPS: 'generate_payslips',
    // Requests
    APPROVE_REQUESTS: 'approve_requests',
    VIEW_ALL_REQUESTS: 'view_all_requests',
    // Content
    EDIT_DOCUMENTS: 'edit_documents',
    EDIT_HELPDESK: 'edit_helpdesk',
    PUBLISH_ENGAGE: 'publish_engage',
    // Workflow
    MANAGE_DELEGATES: 'manage_delegates',
    // Settings
    MANAGE_SETTINGS: 'manage_settings'
};
const ALL_PERMISSIONS = Object.values(PERMISSIONS);
class ForbiddenError extends Error {
    constructor(message = 'Forbidden'){
        super(message);
        this.name = 'ForbiddenError';
    }
}
function hasPermission(user, perm) {
    return user.permissions.includes('*') || user.permissions.includes(perm);
}
function hasAnyPermission(user, perms) {
    return perms.some((p)=>hasPermission(user, p));
}
function requirePermission(user, perm) {
    if (!hasPermission(user, perm)) {
        throw new ForbiddenError(`Missing permission: ${perm}`);
    }
}
// ============= COMPOSITE GATES =============
const PEOPLE_VIEW_PERMS = [
    PERMISSIONS.VIEW_ALL_PEOPLE,
    PERMISSIONS.EDIT_USER_PROFILES,
    PERMISSIONS.MANAGE_PERMISSIONS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.DEACTIVATE_USERS
];
function canViewPeople(user) {
    return hasAnyPermission(user, PEOPLE_VIEW_PERMS);
}
function mergeSubmittedPermissions(current, submitted) {
    const allow = new Set(ALL_PERMISSIONS);
    const validated = submitted.filter((p)=>allow.has(p));
    if (current.includes('*')) {
        return [
            '*',
            ...validated
        ];
    }
    return validated;
}
}),
"[project]/lib/db/leaves.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LEAVE_QUOTAS",
    ()=>LEAVE_QUOTAS,
    "LEAVE_TYPES",
    ()=>LEAVE_TYPES,
    "LeaveFileSchema",
    ()=>LeaveFileSchema,
    "LeaveRequestSchema",
    ()=>LeaveRequestSchema,
    "LeaveStatus",
    ()=>LeaveStatus,
    "countLeaveDays",
    ()=>countLeaveDays,
    "createLeaveRequest",
    ()=>createLeaveRequest,
    "decideLeaveRequest",
    ()=>decideLeaveRequest,
    "getLeaveBalance",
    ()=>getLeaveBalance,
    "getLeaveRequest",
    ()=>getLeaveRequest,
    "listPendingForAll",
    ()=>listPendingForAll,
    "listUserLeaves",
    ()=>listUserLeaves,
    "withdrawLeaveRequest",
    ()=>withdrawLeaveRequest
]);
// lib/db/leaves.ts
// ============= IMPORTS =============
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/external.js [instrumentation] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/core.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$users$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/users.ts [instrumentation] (ecmascript)");
;
;
;
;
const LEAVE_TYPES = [
    'annual',
    'sick',
    'casual',
    'unpaid'
];
const LEAVE_QUOTAS = {
    annual: 20,
    sick: 10,
    casual: 7,
    unpaid: null
};
const LeaveStatus = [
    'pending',
    'approved',
    'rejected'
];
const LeaveRequestSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    userId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(LEAVE_TYPES),
    startDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{4}-\d{2}-\d{2}$/),
    days: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive(),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(LeaveStatus),
    createdAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    decidedBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    decidedAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    decisionNote: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null)
});
const LeaveFileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    requests: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(LeaveRequestSchema)
});
const EMPTY = {
    requests: []
};
function pathFor(userId) {
    return `leaves/${userId}.json`;
}
async function listUserLeaves(userId) {
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["readJson"])(pathFor(userId), LeaveFileSchema, EMPTY);
    return data.requests;
}
async function getLeaveRequest(userId, id) {
    const reqs = await listUserLeaves(userId);
    return reqs.find((r)=>r.id === id) ?? null;
}
async function listPendingForAll() {
    const users = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$users$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["listUsers"])();
    const out = [];
    for (const u of users){
        const reqs = await listUserLeaves(u.id);
        out.push(...reqs.filter((r)=>r.status === 'pending'));
    }
    return out.sort((a, b)=>a.createdAt.localeCompare(b.createdAt));
}
async function createLeaveRequest(input) {
    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(pathFor(input.userId), LeaveFileSchema, EMPTY, (current)=>{
        const newReq = {
            id: `lv_${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomBytes(6).toString('hex')}`,
            userId: input.userId,
            type: input.type,
            startDate: input.startDate,
            endDate: input.endDate,
            days: input.days,
            reason: input.reason,
            status: 'pending',
            createdAt: new Date().toISOString(),
            decidedBy: null,
            decidedAt: null,
            decisionNote: null
        };
        return {
            requests: [
                ...current.requests,
                newReq
            ]
        };
    });
    return result.requests[result.requests.length - 1];
}
async function decideLeaveRequest(userId, id, decision, decidedBy, decisionNote) {
    if (userId === decidedBy) {
        throw new Error('Cannot decide your own leave request');
    }
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(pathFor(userId), LeaveFileSchema, EMPTY, (current)=>{
        const target = current.requests.find((r)=>r.id === id);
        if (!target) throw new Error('Leave request not found');
        if (target.status !== 'pending') {
            throw new Error(`Leave request already ${target.status}`);
        }
        return {
            requests: current.requests.map((r)=>r.id === id ? {
                    ...r,
                    status: decision,
                    decidedBy,
                    decidedAt: new Date().toISOString(),
                    decisionNote: decisionNote ?? null
                } : r)
        };
    });
}
async function withdrawLeaveRequest(userId, id) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(pathFor(userId), LeaveFileSchema, EMPTY, (current)=>({
            requests: current.requests.filter((r)=>!(r.id === id && r.status === 'pending'))
        }));
}
async function getLeaveBalance(userId, year = new Date().getFullYear()) {
    const reqs = await listUserLeaves(userId);
    const inYear = reqs.filter((r)=>r.status === 'approved' && r.startDate.startsWith(String(year)));
    const used = {
        annual: 0,
        sick: 0,
        casual: 0,
        unpaid: 0
    };
    for (const r of inYear)used[r.type] += r.days;
    const balance = {};
    for (const t of LEAVE_TYPES){
        const quota = LEAVE_QUOTAS[t];
        balance[t] = {
            quota,
            used: used[t],
            remaining: quota === null ? null : quota - used[t]
        };
    }
    return balance;
}
function countLeaveDays(startDate, endDate) {
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    if (end < start) throw new Error('endDate must be >= startDate');
    // Inclusive day count; weekend exclusion is left as a v2 improvement
    const ms = end.getTime() - start.getTime();
    return Math.round(ms / 86400000) + 1;
}
}),
"[project]/lib/project-status.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/project-status.ts
// Shared project/task lifecycle status vocabulary. Pure constants with no
// I/O — safe to import from client components (unlike lib/db/projects.ts,
// which pulls in node:fs transitively via lib/db/core.ts and would break a
// client bundle).
__turbopack_context__.s([
    "PROJECT_STATUSES",
    ()=>PROJECT_STATUSES
]);
const PROJECT_STATUSES = [
    'discuss',
    'design',
    'development',
    'qa',
    'uat',
    'completed'
];
}),
"[project]/lib/db/projects.ts [instrumentation] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProjectSchema",
    ()=>ProjectSchema,
    "ProjectTaskSchema",
    ()=>ProjectTaskSchema,
    "ProjectsFileSchema",
    ()=>ProjectsFileSchema,
    "addProjectTask",
    ()=>addProjectTask,
    "createProject",
    ()=>createProject,
    "deleteProject",
    ()=>deleteProject,
    "getProject",
    ()=>getProject,
    "listProjects",
    ()=>listProjects,
    "setProjectDescription",
    ()=>setProjectDescription,
    "setProjectDueDate",
    ()=>setProjectDueDate,
    "updateProjectTask",
    ()=>updateProjectTask
]);
// lib/db/projects.ts
// Project registry backing the timesheet: employees log hours against a
// project. Low-write lookup data, so a single monolithic file.
// ============= IMPORTS =============
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/external.js [instrumentation] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/core.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$project$2d$status$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/project-status.ts [instrumentation] (ecmascript)");
;
;
;
;
;
const ProjectTaskSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default(''),
    dueDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    // Same 6-stage lifecycle as projects; independent of the parent project's status.
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$project$2d$status$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PROJECT_STATUSES"]).default('discuss')
});
const ProjectSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().default(''),
    dueDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().default(null),
    // Tasks scope time entries within a project; entries without a task fall
    // under the implicit "Other" bucket (taskId null).
    tasks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ProjectTaskSchema).default([]),
    createdAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()
});
const ProjectsFileSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    projects: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$4$2e$3$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(ProjectSchema)
});
const EMPTY = {
    projects: []
};
const PATH = 'projects.json';
async function listProjects() {
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["readJson"])(PATH, ProjectsFileSchema, EMPTY);
    return [
        ...data.projects
    ].sort((a, b)=>a.name.localeCompare(b.name));
}
async function getProject(id) {
    const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["readJson"])(PATH, ProjectsFileSchema, EMPTY);
    return data.projects.find((p)=>p.id === id) ?? null;
}
async function createProject(input) {
    const name = input.name.trim();
    if (!name) throw new Error('Project name is required');
    const seen = new Set();
    const tasks = [];
    for (const raw of input.tasks ?? []){
        const taskName = raw.trim();
        if (!taskName || seen.has(taskName.toLowerCase())) continue;
        seen.add(taskName.toLowerCase());
        tasks.push({
            id: `ptk_${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomBytes(6).toString('hex')}`,
            name: taskName,
            description: '',
            dueDate: null,
            status: 'discuss'
        });
    }
    const project = {
        id: `prj_${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomBytes(6).toString('hex')}`,
        name,
        code: input.code?.trim() || null,
        description: input.description?.trim() ?? '',
        dueDate: null,
        tasks,
        createdAt: new Date().toISOString()
    };
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, ProjectsFileSchema, EMPTY, (current)=>{
        if (current.projects.some((p)=>p.name.toLowerCase() === name.toLowerCase())) {
            throw new Error(`Project "${name}" already exists`);
        }
        return {
            projects: [
                ...current.projects,
                project
            ]
        };
    });
    return project;
}
async function addProjectTask(projectId, taskName, input = {}) {
    const name = taskName.trim();
    if (!name) throw new Error('Task name is required');
    const task = {
        id: `ptk_${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomBytes(6).toString('hex')}`,
        name,
        description: input.description?.trim() ?? '',
        dueDate: input.dueDate ?? null,
        status: input.status ?? 'discuss'
    };
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, ProjectsFileSchema, EMPTY, (current)=>{
        const target = current.projects.find((p)=>p.id === projectId);
        if (!target) throw new Error('Project not found');
        if (target.tasks.some((t)=>t.name.toLowerCase() === name.toLowerCase())) {
            throw new Error(`Task "${name}" already exists in this project`);
        }
        return {
            projects: current.projects.map((p)=>p.id === projectId ? {
                    ...p,
                    tasks: [
                        ...p.tasks,
                        task
                    ]
                } : p)
        };
    });
    return task;
}
async function updateProjectTask(projectId, taskId, patch) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, ProjectsFileSchema, EMPTY, (current)=>{
        const target = current.projects.find((p)=>p.id === projectId);
        if (!target) throw new Error('Project not found');
        if (!target.tasks.some((t)=>t.id === taskId)) throw new Error('Task not found');
        return {
            projects: current.projects.map((p)=>p.id === projectId ? {
                    ...p,
                    tasks: p.tasks.map((t)=>t.id === taskId ? {
                            ...t,
                            ...patch
                        } : t)
                } : p)
        };
    });
}
async function setProjectDescription(id, description) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, ProjectsFileSchema, EMPTY, (current)=>{
        if (!current.projects.some((p)=>p.id === id)) {
            throw new Error('Project not found');
        }
        return {
            projects: current.projects.map((p)=>p.id === id ? {
                    ...p,
                    description
                } : p)
        };
    });
}
async function setProjectDueDate(id, dueDate) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, ProjectsFileSchema, EMPTY, (current)=>{
        if (!current.projects.some((p)=>p.id === id)) {
            throw new Error('Project not found');
        }
        return {
            projects: current.projects.map((p)=>p.id === id ? {
                    ...p,
                    dueDate
                } : p)
        };
    });
}
async function deleteProject(id) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["updateJson"])(PATH, ProjectsFileSchema, EMPTY, (current)=>{
        if (!current.projects.some((p)=>p.id === id)) {
            throw new Error('Project not found');
        }
        return {
            projects: current.projects.filter((p)=>p.id !== id)
        };
    });
}
}),
"[project]/lib/logger.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logger",
    ()=>logger
]);
// ============= IMPORTS =============
var __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pino$40$10$2e$3$2e$1$2f$node_modules$2f$pino$29$__ = __turbopack_context__.i("[externals]/pino [external] (pino, cjs, [project]/node_modules/.pnpm/pino@10.3.1/node_modules/pino)");
;
const logger = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pino$40$10$2e$3$2e$1$2f$node_modules$2f$pino$29$__["default"])({
    level: process.env.LOG_LEVEL ?? 'info',
    base: undefined,
    timestamp: __TURBOPACK__imported__module__$5b$externals$5d2f$pino__$5b$external$5d$__$28$pino$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pino$40$10$2e$3$2e$1$2f$node_modules$2f$pino$29$__["default"].stdTimeFunctions.isoTime
});
}),
"[project]/lib/db/seed.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "seedDemoOrg",
    ()=>seedDemoOrg,
    "seedIfEmpty",
    ()=>seedIfEmpty
]);
// lib/db/seed.ts
// ============= IMPORTS =============
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs/index.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$users$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/users.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/permissions.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$leaves$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/leaves.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/lib/db/projects.ts [instrumentation] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/logger.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/db/core.ts [instrumentation] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
async function seedIfEmpty() {
    // The fs mkdir + data-seed defaults copy are an fs-only convenience. On the
    // blobs backend there is no local dir; settings fall back to schema defaults
    // (which parse fine) and the admin/demo users go through createUser (blobs-backed).
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["storageIsBlobs"])()) {
        const dataDir = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$core$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getDataDir"])();
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].mkdir(dataDir, {
            recursive: true
        });
        // Copy data-seed defaults if files don't exist yet
        const seedDir = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), 'data-seed');
        for (const file of [
            'users.json',
            'settings.json'
        ]){
            const target = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(dataDir, file);
            try {
                await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].access(target);
            } catch  {
                const src = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(seedDir, file);
                try {
                    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["default"].copyFile(src, target);
                } catch  {}
            }
        }
    }
    // Create bootstrap admin if no users exist
    const users = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$users$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["listUsers"])();
    if (users.length === 0) {
        const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? 'admin@local.test';
        // A fixed password (env) makes login stable across deploys/instances; when
        // unset we generate a temp one and force a change on first login.
        const fixed = process.env.BOOTSTRAP_ADMIN_PASSWORD;
        const password = fixed ?? __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["default"].randomBytes(12).toString('base64url');
        const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"].hash(password, 12);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$users$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["createUser"])({
            email,
            passwordHash,
            displayName: 'Bootstrap Admin',
            permissions: [
                '*'
            ],
            department: 'HR',
            jobTitle: 'Administrator',
            mustChangePassword: fixed ? false : true
        });
        if (!fixed) {
            __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["logger"].warn({
                email,
                tempPassword: password
            }, 'BOOTSTRAP ADMIN CREATED — save this password, you must change it on first login');
        }
    }
    // Optionally seed a realistic demo company for multi-user/team testing.
    if (process.env.SEED_DEMO === 'true') {
        await seedDemoOrg();
    }
}
// ============= DEMO ORG =============
// Idempotent: keyed off a sentinel demo email. All demo users share one password
// (env DEMO_PASSWORD or 'Password123!') and can log in directly (no forced change),
// so you can exercise team-vs-admin views immediately.
const MANAGER_PERMS = [
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].APPROVE_LEAVE,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].APPROVE_REQUESTS,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].VIEW_TEAM_LEAVE,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].VIEW_TEAM_ATTENDANCE
];
const HR_PERMS = [
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].VIEW_ALL_PEOPLE,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].EDIT_USER_PROFILES,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].CREATE_USERS,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].VIEW_ALL_LEAVE,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].APPROVE_LEAVE,
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$permissions$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["PERMISSIONS"].APPROVE_REQUESTS
];
async function seedDemoOrg() {
    const SENTINEL = 'sara.chen@acme.test';
    if (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$users$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getUserByEmail"])(SENTINEL)) return; // already seeded
    const password = process.env.DEMO_PASSWORD ?? 'Password123!';
    const passwordHash = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$bcryptjs$40$2$2e$4$2e$3$2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"].hash(password, 12);
    const mk = (email, displayName, department, jobTitle, managerId, permissions = [])=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$users$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["createUser"])({
            email,
            passwordHash,
            displayName,
            department,
            jobTitle,
            managerId,
            permissions,
            mustChangePassword: false
        });
    // Managers / leads first (reports reference their ids).
    const sara = await mk(SENTINEL, 'Sara Chen', 'Engineering', 'Engineering Manager', null, MANAGER_PERMS);
    const tom = await mk('tom.becker@acme.test', 'Tom Becker', 'Sales', 'Sales Manager', null, MANAGER_PERMS);
    const grace = await mk('grace.kim@acme.test', 'Grace Kim', 'HR', 'HR Generalist', null, HR_PERMS);
    // Individual contributors.
    const eng = [
        [
            'alex.rivera@acme.test',
            'Alex Rivera',
            'Software Engineer'
        ],
        [
            'priya.patel@acme.test',
            'Priya Patel',
            'Senior Software Engineer'
        ],
        [
            'diego.santos@acme.test',
            'Diego Santos',
            'Frontend Engineer'
        ],
        [
            'mei.lin@acme.test',
            'Mei Lin',
            'QA Engineer'
        ]
    ];
    const sales = [
        [
            'jordan.blake@acme.test',
            'Jordan Blake',
            'Account Executive'
        ],
        [
            'nina.rossi@acme.test',
            'Nina Rossi',
            'Sales Development Rep'
        ],
        [
            'omar.haddad@acme.test',
            'Omar Haddad',
            'Account Executive'
        ]
    ];
    const engUsers = [];
    for (const [email, name, title] of eng)engUsers.push(await mk(email, name, 'Engineering', title, sara.id));
    for (const [email, name, title] of sales)await mk(email, name, 'Sales', title, tom.id);
    await mk('liam.wong@acme.test', 'Liam Wong', 'HR', 'Recruiter', grace.id);
    // Starter projects (with tasks) so the timesheet is usable out of the box.
    if ((await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["listProjects"])()).length === 0) {
        const web = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createProject"])({
            name: 'Website Redesign',
            code: 'WEB'
        });
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addProjectTask"])(web.id, 'Design');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addProjectTask"])(web.id, 'Development');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addProjectTask"])(web.id, 'QA');
        const app = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createProject"])({
            name: 'Mobile App',
            code: 'APP'
        });
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addProjectTask"])(app.id, 'Development');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["addProjectTask"])(app.id, 'Testing');
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createProject"])({
            name: 'Internal Tools',
            code: 'INT'
        });
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$projects$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createProject"])({
            name: 'Customer Onboarding',
            code: 'ONB'
        });
    }
    // A little sample leave so the approvals inbox isn't empty.
    const year = new Date().getUTCFullYear();
    if (engUsers[0]) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$leaves$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["createLeaveRequest"])({
            userId: engUsers[0].id,
            type: 'annual',
            startDate: `${year}-08-10`,
            endDate: `${year}-08-14`,
            days: 5,
            reason: 'Family holiday'
        });
    }
    if (engUsers[1]) {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$db$2f$leaves$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["createLeaveRequest"])({
            userId: engUsers[1].id,
            type: 'sick',
            startDate: `${year}-07-21`,
            endDate: `${year}-07-22`,
            days: 2,
            reason: 'Medical appointment'
        });
    }
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$logger$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["logger"].warn({
        password,
        users: 11
    }, 'DEMO ORG SEEDED — log in as any *@acme.test with this password');
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0au-t28._.js.map