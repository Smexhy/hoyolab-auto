const crypto = require("node:crypto");

const HoyoAuth = require("./hoyo-auth.js");

const GAME_CONFIG = {
	genshin: {
		gameBiz: "hk4e_global",
		method: "GET",
		origin: "https://genshin.hoyoverse.com",
		url: "https://public-operation-hk4e.hoyoverse.com/common/apicdkey/api/webExchangeCdkey"
	},
	starrail: {
		gameBiz: "hkrpg_global",
		method: "POST",
		origin: "https://hsr.hoyoverse.com",
		url: "https://public-operation-hkrpg.hoyoverse.com/common/apicdkey/api/webExchangeCdkeyRisk"
	},
	zenless: {
		gameBiz: "nap_global",
		method: "POST",
		origin: "https://zenless.hoyoverse.com",
		url: "https://public-operation-nap.hoyoverse.com/common/apicdkey/api/webExchangeCdkeyRisk"
	}
};

const buildRequestOptions = (game, accountData, code, cookie, options = {}) => {
	const gameConfig = GAME_CONFIG[game];
	if (!gameConfig) {
		throw new TypeError(`Unsupported code redemption game: ${game}`);
	}

	const language = String(options.language ?? "en-us").split("-")[0].toLowerCase();
	const requestData = {
		uid: accountData.uid,
		region: accountData.region,
		lang: language,
		cdkey: code,
		game_biz: gameConfig.gameBiz
	};
	const requestOptions = {
		url: gameConfig.url,
		method: gameConfig.method,
		responseType: "json",
		throwHttpErrors: false,
		headers: {
			Cookie: cookie,
			Origin: gameConfig.origin,
			Referer: `${gameConfig.origin}/`,
			"x-rpc-language": language
		}
	};

	if (gameConfig.method === "POST") {
		requestOptions.json = {
			...requestData,
			device_uuid: options.deviceUuid ?? crypto.randomUUID(),
			platform: "4",
			t: options.timestamp ?? Date.now()
		};
	}
	else {
		requestOptions.searchParams = requestData;
	}

	return requestOptions;
};

const redeem = async (game, accountData, code) => {
	const request = async () => {
		const cookie = app.HoyoLab.parseCookie(accountData.cookie, {
			whitelist: [
				"cookie_token_v2",
				"account_mid_v2",
				"account_id_v2",
				"cookie_token",
				"account_id"
			]
		});

		return await app.Got("HoYoLab", buildRequestOptions(
			game,
			accountData,
			code,
			cookie,
			{ language: app.Config.get("language") || "en-us" }
		));
	};

	const response = await HoyoAuth.requestWithRefresh(accountData, request);
	if (response.statusCode !== 200) {
		return {
			success: false,
			message: `Request failed with HTTP ${response.statusCode}`,
			statusCode: response.statusCode
		};
	}

	if (response.body?.retcode !== 0) {
		return {
			success: false,
			message: response.body?.message ?? "HoYoLAB rejected the code redemption request",
			retcode: response.body?.retcode
		};
	}

	return {
		success: true,
		message: "Code redeemed successfully!",
		retcode: 0
	};
};

module.exports = {
	buildRequestOptions,
	redeem
};
