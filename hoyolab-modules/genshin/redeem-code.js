const CodeRedemption = require("../../object/code-redemption.js");

module.exports = class RedeemCode {
	/** @type {import("../template")} */
	#instance;

	constructor (instance) {
		this.#instance = instance;
	}

	async redeemCode (accountData, code) {
		const result = await CodeRedemption.redeem("genshin", accountData, code);
		if (result.statusCode && result.statusCode !== 200) {
			app.Logger.log(`${this.#instance.fullName}:RedeemCode`, {
				message: "Request threw non-200 status code",
				args: {
					code,
					status: result.statusCode
				}
			});
		}
		if (!result.success) {
			app.Logger.log(`${this.#instance.fullName}:RedeemCode`, {
				message: "Failed to redeem code",
				args: {
					cause: result.retcode ? app.HoyoLab.errorMessage(this.#instance.name, result.retcode) : result.message,
					code,
					status: result.retcode ?? result.statusCode
				}
			});

			return {
				success: false,
				message: result.message
			};
		}

		app.Logger.info(`${this.#instance.fullName}:RedeemCode`, `(${accountData.uid}) ${accountData.nickname} redeemed code: ${code}`);

		return {
			success: true,
			message: result.message
		};
	}
};
