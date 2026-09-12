const assert = require("node:assert/strict");
const test = require("node:test");

const HoyoAuth = require("../object/hoyo-auth.js");

test("dynamic secret uses the app-login signing format", () => {
	assert.equal(
		HoyoAuth.generateDynamicSecret({ timestamp: 1_700_000_000, random: "abcdef" }),
		"1700000000,abcdef,cf3c708b9ef327787e406c0e7b30277c"
	);
});

test("login expiry recognizes retcode and message variants", () => {
	assert.equal(HoyoAuth.isExpiredLogin({ retcode: -1071, message: "" }), true);
	assert.equal(HoyoAuth.isExpiredLogin({ retcode: 1, message: "Please log in to your account first." }), true);
	assert.equal(HoyoAuth.isExpiredLogin({ retcode: -2001, message: "Invalid code" }), false);
});

test("expired login refreshes and retries exactly once", async (context) => {
	const previousApp = globalThis.app;
	context.after(() => {
		globalThis.app = previousApp;
	});

	let requestCount = 0;
	let refreshCount = 0;
	globalThis.app = {
		AuthState: {
			canRefresh: () => true
		},
		HoyoLab: {
			refreshCookie: async () => {
				refreshCount++;
				return { success: true };
			}
		},
		Logger: {
			info: () => {}
		}
	};

	const response = await HoyoAuth.requestWithRefresh({
		cookie: "account_id_v2=123",
		platform: "starrail",
		uid: "700000001"
	}, async () => {
		requestCount++;
		return requestCount === 1
			? { body: { retcode: -1071, message: "Please log in" } }
			: { body: { retcode: 0 } };
	});

	assert.equal(response.body.retcode, 0);
	assert.equal(requestCount, 2);
	assert.equal(refreshCount, 1);
});
