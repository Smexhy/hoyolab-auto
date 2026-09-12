const crypto = require("node:crypto");

const APP_LOGIN_SALT = "IZPgfb0dRPtBeLuFkdDznSZ6f4wWt6y2";
const APP_ID = "c9oqaq3s3gu8";

const generateDynamicSecret = (options = {}) => {
	const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
	const random = options.random ?? crypto.randomBytes(6).toString("base64url").slice(0, 6);
	const hash = crypto.createHash("md5")
		.update(`salt=${APP_LOGIN_SALT}&t=${timestamp}&r=${random}`)
		.digest("hex");

	return `${timestamp},${random},${hash}`;
};

const getRefreshHeaders = (options = {}) => ({
	ds: generateDynamicSecret(options),
	"x-rpc-app_id": APP_ID
});

const isExpiredLogin = (body) => {
	if (body?.retcode === -1071) {
		return true;
	}

	return /(?:please\s+)?log\s*in|login/i.test(String(body?.message ?? ""));
};

const requestWithRefresh = async (accountData, request) => {
	const initialResponse = await request();
	if (!isExpiredLogin(initialResponse.body) || !app.AuthState.canRefresh(accountData.cookie)) {
		return initialResponse;
	}

	const refresh = await app.HoyoLab.refreshCookie(accountData);
	if (!refresh.success) {
		return initialResponse;
	}

	app.Logger.info("HoyoAuth", `Renewed redemption credentials for ${accountData.platform} account ${accountData.uid}; retrying once`);
	return await request();
};

module.exports = {
	generateDynamicSecret,
	getRefreshHeaders,
	isExpiredLogin,
	requestWithRefresh
};
