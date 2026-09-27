import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const source = readFileSync(fileURLToPath(new URL("../src/app/api/admin/virtual-pet/route.ts", import.meta.url)), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ failAliasRead = false } = {}) {
  const data = {
    virtual_pets: {
      own: { id: "own", schoolId: "school_a", studentId: "nisn_a", level: 1 },
      ownAlias: { id: "ownAlias", schoolId: "school_a", studentId: "nisn_a", level: 2 },
      foreign: { id: "foreign", schoolId: "school_b", studentId: "nisn_b", level: 3 },
      foreignAlias: { id: "foreignAlias", schoolId: "school_b", studentId: "nisn_a", level: 4 },
      unscoped: { id: "unscoped", studentId: "nisn_a", level: 5 },
    },
    gas: { schools: {
      school_a: { students: { nisn_a: { nisn: "nisn_a", name: "Demo A" } } },
      school_b: { students: { nisn_b: { nisn: "nisn_b", name: "Demo B" } } },
    } },
    platform_events: {},
  };
  const reads = [];
  const writes = [];
  const valueAt = (path) => path ? path.split("/").reduce((value, part) => value?.[part], data) : data;
  const setAt = (path, value) => {
    const parts = path.split("/");
    const parent = parts.slice(0, -1).reduce((value, part) => value[part] ??= {}, data);
    parent[parts.at(-1)] = value;
  };
  const snapshot = (value) => ({
    exists: () => value != null && (typeof value !== "object" || Object.keys(value).length > 0),
    val: () => structuredClone(value),
  });
  const ref = (path = "") => ({
    get: async () => {
      reads.push(path);
      if (failAliasRead && path === "virtual_pets") throw new Error("Alias read failed");
      return snapshot(valueAt(path));
    },
    once: async () => { reads.push(path); return snapshot(valueAt(path)); },
    orderByChild: (field) => ({
      equalTo: (expected) => ({
        once: async () => {
          reads.push(path);
          return snapshot(Object.fromEntries(
            Object.entries(valueAt(path) ?? {}).filter(([, value]) => value?.[field] === expected)
          ));
        },
      }),
    }),
    update: async (changes) => {
      writes.push({ path, changes });
      for (const [key, value] of Object.entries(changes)) {
        setAt(path ? `${path}/${key}` : key, value);
      }
    },
    push: () => ({
      key: "event1",
      set: async (value) => { writes.push({ path: "platform_events/event1", value }); setAt("platform_events/event1", value); },
    }),
  });
  const routeModule = { exports: {} };
  const fakeRequire = (name) => {
    if (name === "next/server") return { NextResponse: {
      json: (body, options) => ({ status: options?.status ?? 200, body }),
    } };
    if (name === "@/lib/firebase-admin") return {
      adminAuth: { verifyIdToken: async (token) => token === "super"
        ? { role: "super_admin", schoolId: "", email: "super@example.test" }
        : { role: "admin", schoolId: token === "no-school" ? "" : "school_a", email: "admin@example.test" } },
      adminDb: { ref },
    };
    if (name === "@/lib/gas/schoolId") return { normalizeSchoolId: (value) => String(value ?? "").trim().toLowerCase() };
    throw new Error(`Unexpected route dependency: ${name}`);
  };
  new Function("require", "module", "exports", compiled)(fakeRequire, routeModule, routeModule.exports);
  const request = (token, body) => ({
    headers: new Headers({ authorization: `Bearer ${token}` }),
    url: `https://localhost/api/admin/virtual-pet?schoolId=${body?.schoolId ?? "school_a"}`,
    json: async () => body,
  });
  return { ...routeModule.exports, request, data, reads, writes };
}

let count = 0;
{
  const ctx = setup();
  const response = await ctx.GET(ctx.request("admin", { schoolId: "school_b" }));
  assert.equal(response.status, 403, "admin A cannot read school B");
  assert.equal(ctx.reads.length, 0, "reject foreign school before reading data");
  count++;
}
{
  const ctx = setup();
  const response = await ctx.GET(ctx.request("no-school", { schoolId: "school_a" }));
  assert.equal(response.status, 403, "admin without school claim cannot choose one via query");
  assert.equal(ctx.reads.length, 0);
  count++;
}
{
  const ctx = setup();
  const response = await ctx.GET(ctx.request("admin", { schoolId: "school_a" }));
  assert.equal(response.status, 200);
  assert(response.body.pets.every((pet) => pet.schoolId === "school_a"), "no foreign pet through alias fallback");
  count++;
}
for (const body of [
  { action: "revive", petId: "foreign" },
  { action: "reset-level", petId: "foreign" },
  { action: "reset-level", petId: "unscoped" },
  { action: "give-reward", petIds: ["own", "foreign"], rewardType: "coins", amount: 10 },
]) {
  const ctx = setup();
  const response = await ctx.POST(ctx.request("admin", body));
  assert.equal(response.status, 403, `foreign target must be rejected: ${body.action}`);
  assert.equal(ctx.writes.length, 0, `no partial write: ${body.action}`);
  count++;
}
{
  const ctx = setup();
  const response = await ctx.POST(ctx.request("admin", {
    action: "give-reward", petIds: ["own", "missing"], rewardType: "coins", amount: 10,
  }));
  assert.equal(response.status, 404, "missing batch target rejects the whole request");
  assert.equal(ctx.writes.length, 0);
  count++;
}
for (const body of [
  { action: "revive", petId: "own/status" },
  { action: "reset-level", petId: "own/status" },
  { action: "give-reward", petIds: ["own", "foreign/status"], rewardType: "coins", amount: 10 },
]) {
  const ctx = setup();
  const response = await ctx.POST(ctx.request("admin", body));
  assert.equal(response.status, 400, "petId must be a single Firebase key");
  assert.equal(ctx.writes.length, 0);
  count++;
}
{
  const ctx = setup();
  const response = await ctx.POST(ctx.request("admin", { action: "revive", petId: "own" }));
  assert.equal(response.status, 200);
  assert.equal(ctx.writes.length, 1, "revive, aliases, and audit event use one atomic update");
  assert.equal(ctx.writes[0].path, "");
  assert.equal(ctx.data.virtual_pets.own.status, "HAPPY");
  assert.equal(ctx.data.virtual_pets.ownAlias.status, "HAPPY", "own-school alias stays supported");
  assert.equal(ctx.data.virtual_pets.foreignAlias.status, undefined, "foreign alias is untouched");
  assert.equal(ctx.data.platform_events.event1.schoolId, "school_a");
  count++;
}
{
  const ctx = setup({ failAliasRead: true });
  const originalError = console.error;
  console.error = () => {};
  let response;
  try {
    response = await ctx.POST(ctx.request("admin", { action: "revive", petId: "own" }));
  } finally {
    console.error = originalError;
  }
  assert.equal(response.status, 500, "alias lookup failure stops revive");
  assert.equal(ctx.writes.length, 0, "main pet and audit remain unchanged");
  count++;
}
{
  const ctx = setup();
  const response = await ctx.POST(ctx.request("admin", { action: "reset-level", petId: "ownAlias" }));
  assert.equal(response.status, 200, "own-school reset still works");
  assert.equal(ctx.data.virtual_pets.ownAlias.level, 1);
  count++;
}
{
  const ctx = setup();
  const response = await ctx.POST(ctx.request("admin", {
    action: "give-reward", petIds: ["own", "ownAlias"], rewardType: "coins", amount: 10,
  }));
  assert.equal(response.status, 200, "own-school reward still works");
  assert.equal(ctx.data.virtual_pets.own.coins, 10);
  assert.equal(ctx.data.virtual_pets.ownAlias.coins, 10);
  count++;
}
{
  const ctx = setup();
  const response = await ctx.POST(ctx.request("super", { action: "revive", petId: "foreign" }));
  assert.equal(response.status, 200, "super admin keeps cross-school authority");
  assert.equal(ctx.data.platform_events.event1.schoolId, "school_b", "audit event belongs to target school");
  count++;
}
console.log(`PET admin tenant authorization: ${count} route scenarios passed (no production data).`);
