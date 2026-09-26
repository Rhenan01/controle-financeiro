import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"

const loadDependency = createRequire(import.meta.url)
const testDirectory = path.dirname(fileURLToPath(import.meta.url))

// Usa as dependências já instaladas; não precisa de navegador ou banco remoto.
function loadModule(file, mocks = {}) {
  const filename = path.join(testDirectory, "..", file)
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
  }).outputText
  const loadedModule = { exports: {} }
  vm.runInNewContext(compiled, {
    module: loadedModule, exports: loadedModule.exports,
    require: (name) => name in mocks ? mocks[name] : loadDependency(name),
    setTimeout, clearTimeout, console
  }, { filename })
  return loadedModule.exports
}

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 5))
const session = (id) => ({ user: { id }, access_token: `token-${id}` })
const userResult = (id) => ({ data: { user: { id } }, error: null })

function authHarness(getUser, signOut = async () => ({ error: null })) {
  let callback
  let unsubscribed = false
  const states = []
  const { observeAuthSession } = loadModule("lib/auth-session.ts")
  const observer = observeAuthSession({
    getUser, signOut,
    onAuthStateChange(handler) {
      callback = handler
      return { data: { subscription: { unsubscribe() { unsubscribed = true } } } }
    }
  }, (state) => states.push(state))
  return {
    observer, states,
    emit: (event, value) => callback(event, value),
    latest: () => states.at(-1),
    unsubscribed: () => unsubscribed
  }
}

test("sessão inicial ausente permanece sem autenticação", () => {
  const h = authHarness(() => assert.fail("não deve validar sem token"))
  h.emit("INITIAL_SESSION", null)
  assert.equal(h.latest().status, "unauthenticated")
  h.observer.stop()
})

test("só libera a conta após validar o usuário no Supabase", async () => {
  const validation = deferred()
  const h = authHarness((token) => {
    assert.equal(token, "token-A")
    return validation.promise
  })
  h.emit("INITIAL_SESSION", session("A"))
  assert.equal(h.latest().status, "checking")
  await tick()
  validation.resolve(userResult("A"))
  await tick()
  assert.equal(h.latest().user.id, "A")
  h.emit("TOKEN_REFRESHED", session("A"))
  assert.equal(h.latest().status, "authenticated")
  h.observer.stop()
})

test("troca de conta ignora a validação atrasada da conta anterior", async () => {
  const first = deferred()
  const h = authHarness((token) => token === "token-A" ? first.promise : Promise.resolve(userResult("B")))
  h.emit("SIGNED_IN", session("A"))
  await tick()
  h.emit("SIGNED_IN", session("B"))
  assert.equal(h.latest().user, null)
  await tick()
  first.resolve(userResult("A"))
  await tick()
  assert.equal(h.latest().user.id, "B")
  h.observer.stop()
})

test("logout bloqueia imediatamente e invalida validações em andamento", async () => {
  const validation = deferred()
  const logout = deferred()
  const h = authHarness(() => validation.promise, () => logout.promise)
  h.emit("INITIAL_SESSION", session("A"))
  await tick()
  const pending = h.observer.signOut()
  assert.equal(h.latest().user, null)
  validation.resolve(userResult("A"))
  h.emit("TOKEN_REFRESHED", session("A"))
  await tick()
  assert.equal(h.latest().status, "checking")
  logout.resolve({ error: null })
  assert.equal(await pending, true)
  assert.equal(h.latest().status, "unauthenticated")
  h.observer.stop()
})

test("falha no logout mantém dados ocultos e permite tentar sair novamente", async () => {
  let attempts = 0
  const h = authHarness(async () => userResult("A"), async () => ({ error: ++attempts === 1 ? new Error("offline") : null }))
  assert.equal(await h.observer.signOut(), false)
  assert.equal(h.latest().status, "error")
  assert.equal(h.latest().user, null)
  assert.equal(await h.observer.signOut(), true)
  h.observer.stop()
})

test("sessão inválida não libera conteúdo e desmontagem cancela a validação", async () => {
  const h = authHarness(async () => ({ data: { user: null }, error: new Error("invalid") }))
  h.emit("INITIAL_SESSION", session("A"))
  await tick()
  assert.equal(h.latest().status, "unauthenticated")
  h.observer.stop()
  assert.equal(h.unsubscribed(), true)

  const validation = deferred()
  const late = authHarness(() => validation.promise)
  late.emit("INITIAL_SESSION", session("A"))
  await tick()
  late.observer.stop()
  validation.resolve(userResult("A"))
  await tick()
  assert.equal(late.latest().status, "checking")
})

test("evento de saída de outra aba remove a autorização", async () => {
  const h = authHarness(async () => userResult("A"))
  h.emit("INITIAL_SESSION", session("A"))
  await tick()
  h.emit("SIGNED_OUT", null)
  assert.equal(h.latest().status, "unauthenticated")
  assert.equal(h.latest().user, null)
  h.observer.stop()
})

function storeHarness() {
  const responses = []
  const queries = []
  const supabase = {
    from(table) {
      const response = responses.shift()
      assert.ok(response, "consulta inesperada")
      const calls = []
      queries.push({ table, calls })
      const query = { then: response.promise.then.bind(response.promise) }
      for (const name of ["select", "eq", "order", "range", "insert", "update", "delete"]) {
        query[name] = (...args) => { calls.push([name, ...args]); return query }
      }
      return query
    }
  }
  const { useFinanceStore: store } = loadModule("store/financeStore.ts", { "@/lib/supabase": { supabase } })
  return { store, queries, enqueue() { const response = deferred(); responses.push(response); return response } }
}

const transaction = { id: "tx-1", date: "2026-01-01", type: "ENTRADA", description: "Salário", value: 100, status: "PAGO", payment: "PIX" }

test("limpa lançamentos, categoria e ano ao trocar a conta ou sair", () => {
  const { store } = storeHarness()
  store.getState().setSessionUser("A")
  store.setState({ transactions: [transaction], selectedCategory: "Casa", selectedFinancialYear: 2020 })
  store.getState().setSessionUser("A")
  assert.equal(store.getState().transactions.length, 1)
  store.getState().setSessionUser("B")
  assert.equal(store.getState().transactions.length, 0)
  assert.equal(store.getState().selectedCategory, null)
  assert.equal(store.getState().selectedFinancialYear, new Date().getFullYear())
  store.getState().setSessionUser(null)
  assert.equal(store.getState().sessionUserId, null)
})

test("consulta antiga não repopula dados mesmo após reentrar na mesma conta", async () => {
  const h = storeHarness()
  h.store.getState().setSessionUser("A")
  const response = h.enqueue()
  const pending = h.store.getState().loadTransactions("A")
  h.store.getState().setSessionUser(null)
  h.store.getState().setSessionUser("A")
  response.resolve({ data: [transaction], error: null })
  await pending
  assert.equal(h.store.getState().transactions.length, 0)
})

test("consulta da conta atual carrega; ID de outra conta não consulta o banco", async () => {
  const h = storeHarness()
  h.store.getState().setSessionUser("A")
  await h.store.getState().loadTransactions("B")
  await h.store.getState().addTransaction(transaction, "B")
  assert.equal(h.queries.length, 0)
  const response = h.enqueue()
  response.resolve({ data: [transaction], error: null })
  await h.store.getState().loadTransactions("A")
  assert.equal(h.store.getState().transactions.length, 1)
})

for (const operation of ["add", "update", "delete"]) {
  test(`resposta atrasada de ${operation} não modifica a nova sessão`, async () => {
    const h = storeHarness()
    h.store.getState().setSessionUser("A")
    h.store.setState({ transactions: [transaction] })
    const response = h.enqueue()
    const pending = operation === "add"
      ? h.store.getState().addTransaction(transaction, "A")
      : operation === "update"
        ? h.store.getState().updateTransaction(transaction.id, { ...transaction, value: 999 })
        : h.store.getState().deleteTransaction(transaction.id)
    h.store.getState().setSessionUser("B")
    h.store.setState({ transactions: [{ ...transaction, value: 200 }] })
    response.resolve({ data: [transaction], error: null })
    await pending
    assert.equal(h.store.getState().transactions.length, 1)
    assert.equal(h.store.getState().transactions[0].value, 200)
    if (operation !== "add") {
      assert.ok(h.queries[0].calls.some(([name, key, value]) => name === "eq" && key === "user_id" && value === "A"))
    }
  })
}

test("proteção não renderiza conteúdo privado antes da autenticação, inclusive no HTML inicial", () => {
  for (const status of ["checking", "unauthenticated", "error", "authenticated"]) {
    const { RequireAuth } = loadModule("components/auth/RequireAuth.tsx", {
      "next/navigation": { useRouter: () => ({ replace() {} }) },
      "./AuthProvider": { useAuth: () => ({ state: { status, user: status === "authenticated" ? { id: "A" } : null, message: "Erro" }, signOut: async () => true }) }
    })
    const html = renderToStaticMarkup(React.createElement(RequireAuth, null, "DADO PRIVADO"))
    assert.equal(html.includes("DADO PRIVADO"), status === "authenticated")
  }
})
