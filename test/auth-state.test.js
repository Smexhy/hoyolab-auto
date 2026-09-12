const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const Cookie = require("../object/cookie.js");
const AuthState = require("../singleton/auth-state.js");

const SOURCE_COOKIE = [
	"ltoken_v2=login-old",
	"ltuid_v2=123",
	"ltmid_v2=mid-123",
	"cookie_token_v2=redeem-old",
	"account_mid_v2=mid-123",
	"account_id_v2=123",
	"stoken=refresh-long"
].join("; ");

test("persistent auth state hides stoken and survives restart", (context) => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hoyolab-auth-state-"));
	context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const filePath = path.join(directory, "auth-state.json");

	const first = new AuthState({ filePath });
	const prepared = Cookie.parse(first.prepareCookie(SOURCE_COOKIE));
	assert.equal(prepared.stoken, undefined);
	assert.equal(first.canRefresh(SOURCE_COOKIE), true);
	assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);

	first.updateCookie(SOURCE_COOKIE, {
		ltoken_v2: "login-new",
		cookie_token_v2: "redeem-new"
	});

	const restarted = new AuthState({ filePath });
	const retained = Cookie.parse(restarted.prepareCookie(SOURCE_COOKIE));
	assert.equal(retained.ltoken_v2, "login-new");
	assert.equal(retained.cookie_token_v2, "redeem-new");

	const staleConfigCookie = SOURCE_COOKIE.replace("; stoken=refresh-long", "");
	const restored = Cookie.parse(restarted.prepareCookie(staleConfigCookie));
	assert.equal(restored.ltoken_v2, "login-new");
	assert.equal(restored.cookie_token_v2, "redeem-new");
	assert.equal(restored.stoken, undefined);
	assert.equal(restarted.getRefreshCookie(staleConfigCookie), "stoken=refresh-long; mid=mid-123");
});

test("auth state stays disabled when no stoken was supplied", (context) => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hoyolab-auth-state-"));
	context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const filePath = path.join(directory, "auth-state.json");
	const state = new AuthState({ filePath });

	assert.equal(state.canRefresh(SOURCE_COOKIE.replace("; stoken=refresh-long", "")), false);
	assert.equal(fs.existsSync(filePath), false);
});

test("persistent auth state keeps accounts isolated", (context) => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hoyolab-auth-state-"));
	context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const filePath = path.join(directory, "auth-state.json");
	const state = new AuthState({ filePath });
	const secondCookie = SOURCE_COOKIE
		.replaceAll("123", "456")
		.replaceAll("old", "second")
		.replace("refresh-long", "refresh-second");

	assert.equal(state.importCookie(SOURCE_COOKIE), true);
	assert.equal(state.importCookie(secondCookie), true);
	state.updateCookie(SOURCE_COOKIE, { cookie_token_v2: "redeem-first-new" });

	const restarted = new AuthState({ filePath });
	const first = Cookie.parse(restarted.prepareCookie(SOURCE_COOKIE));
	const second = Cookie.parse(restarted.prepareCookie(secondCookie));
	assert.equal(first.cookie_token_v2, "redeem-first-new");
	assert.equal(second.cookie_token_v2, "redeem-second");
	assert.equal(restarted.getRefreshCookie(SOURCE_COOKIE), "stoken=refresh-long; mid=mid-123");
	assert.equal(restarted.getRefreshCookie(secondCookie), "stoken=refresh-second; mid=mid-456");
});
