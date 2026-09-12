const assert = require("node:assert/strict");
const test = require("node:test");

const Cookie = require("../object/cookie.js");

test("cookie parser trims pairs and preserves equals signs in values", () => {
	assert.deepEqual(
		Cookie.parse(" first=one; token=abc==;empty= ; malformed"),
		{
			first: "one",
			token: "abc==",
			empty: ""
		}
	);
});

test("cookie serializer filters keys without exposing other values", () => {
	const cookie = "ltoken_v2=login; cookie_token_v2=redeem; stoken=refresh";
	assert.equal(
		Cookie.serialize(cookie, { whitelist: ["cookie_token_v2"]}),
		"cookie_token_v2=redeem"
	);
	assert.equal(
		Cookie.serialize(cookie, { blacklist: ["stoken"]}),
		"ltoken_v2=login; cookie_token_v2=redeem"
	);
});
