const assert = require("node:assert/strict");
const test = require("node:test");

const CodeRedemption = require("../object/code-redemption.js");

const ACCOUNT = {
	uid: "700000001",
	region: "prod_official_eur"
};

test("Star Rail redemption uses the current risk endpoint and form body", () => {
	const request = CodeRedemption.buildRequestOptions(
		"starrail",
		ACCOUNT,
		"CODE123",
		"cookie_token_v2=token",
		{
			deviceUuid: "00000000-0000-4000-8000-000000000000",
			language: "en-us",
			timestamp: 1_700_000_000
		}
	);

	assert.equal(request.url, "https://public-operation-hkrpg.hoyoverse.com/common/apicdkey/api/webExchangeCdkeyRisk");
	assert.equal(request.method, "POST");
	assert.equal(request.searchParams, undefined);
	assert.deepEqual(request.form, {
		uid: ACCOUNT.uid,
		region: ACCOUNT.region,
		lang: "en",
		cdkey: "CODE123",
		game_biz: "hkrpg_global",
		device_uuid: "00000000-0000-4000-8000-000000000000",
		platform: "4",
		t: 1_700_000_000
	});
	assert.equal(request.headers.Origin, "https://hsr.hoyoverse.com");
});

test("Zenless redemption uses the current risk endpoint", () => {
	const request = CodeRedemption.buildRequestOptions("zenless", ACCOUNT, "CODE123", "cookie=value");
	assert.equal(request.url, "https://public-operation-nap.hoyoverse.com/common/apicdkey/api/webExchangeCdkeyRisk");
	assert.equal(request.method, "POST");
});

test("Genshin redemption remains a GET with query parameters", () => {
	const request = CodeRedemption.buildRequestOptions("genshin", ACCOUNT, "CODE123", "cookie=value");
	assert.equal(request.url, "https://public-operation-hk4e.hoyoverse.com/common/apicdkey/api/webExchangeCdkey");
	assert.equal(request.method, "GET");
	assert.equal(request.form, undefined);
	assert.equal(request.searchParams.cdkey, "CODE123");
});
