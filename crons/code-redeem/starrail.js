let version;
const CodeRedemption = require("../../object/code-redemption.js");

const fetchData = async () => {
	if (typeof version === "undefined") {
		try {
			const { execSync } = require("child_process");
			const hash = execSync("git rev-parse --short HEAD").toString().trim();

			version = `HoyoLabAuto@${hash}`;
		}
		catch {
			version = "HoyoLabAuto";
		}
	}

	const res = await app.Got("API", {
		url: "https://api.ennead.cc/mihoyo/starrail/codes",
		responseType: "json",
		throwHttpErrors: false,
		headers: {
			"User-Agent": version
		}
	});

	if (res.statusCode !== 200) {
		app.Logger.debug("StarRailAPI", {
			statusCode: res.statusCode
		});

		return [];
	}

	const codes = res.body.active;
	if (!Array.isArray(codes)) {
		app.Logger.debug("StarRailAPI", {
			message: "API returned malformed data",
			body: res.body
		});

		return [];
	}

	return codes.map((i) => ({
		code: i.code,
		rewards: i.rewards,
		source: "starrail-api"
	}));
};

const redeemCodes = async (accountData, code) => {
	const result = await CodeRedemption.redeem("starrail", accountData, code.code);
	const retcode = result.retcode;
	if (retcode === -2001 || retcode === -2003) {
		app.Logger.log(`CodeRedeem:StarRail:${accountData.uid}`, {
			code: code.code,
			message: "Expired or invalid code"
		});

		return {
			success: false,
			reason: "Expired or invalid code"
		};
	}

	if (!result.success) {
		app.Logger.info(`CodeRedeem:StarRail:${accountData.uid}`, `${code.code} - ${result.message}`);
		return {
			success: false,
			reason: result.message
		};
	}

	app.Logger.info(`CodeRedeem:StarRail:${accountData.uid}`, `${code.code} - Redeemed`);
	return {
		success: true
	};
};

module.exports = {
	fetchData,
	redeemCodes
};
