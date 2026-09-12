module.exports = {
	name: "update-cookie",
	expression: "0 */2 * * *",
	description: "Update cookie for all accounts",
	code: (async function updateCookie () {
		// eslint-disable-next-line object-curly-spacing
		const accounts = app.HoyoLab.getActiveAccounts({ blacklist: ["honkai", "tot"] });
		const refreshableAccounts = new Map();
		for (const account of accounts) {
			const accountId = app.AuthState.getAccountId(account.cookie);
			if (accountId && app.AuthState.canRefresh(account.cookie)) {
				refreshableAccounts.set(accountId, account);
			}
		}

		if (refreshableAccounts.size === 0) {
			return;
		}

		let updated = 0;
		for (const account of refreshableAccounts.values()) {
			try {
				const result = await app.HoyoLab.refreshCookie(account);
				if (result.success) {
					updated++;
				}
				else {
					app.Logger.warn("Cron:UpdateCookie", `Could not renew credentials for ${account.platform} account ${account.uid}: ${result.reason}`);
				}
			}
			catch (e) {
				app.Logger.error("Cron:UpdateCookie", `Could not renew credentials for ${account.platform} account ${account.uid}: ${e.message}`);
			}
		}

		app.Logger.debug("Cron:UpdateCookie", `Renewed credentials for ${updated}/${refreshableAccounts.size} HoYoLAB accounts`);
	})
};
