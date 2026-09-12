const fs = require("node:fs");
const path = require("node:path");

const Cookie = require("../object/cookie.js");

const STATE_VERSION = 1;
const STORED_FIELDS = [
	"stoken",
	"stuid",
	"ltoken_v2",
	"ltuid_v2",
	"ltmid_v2",
	"cookie_token_v2",
	"account_mid_v2",
	"account_id_v2"
];

const selectFields = (source) => Object.fromEntries(
	STORED_FIELDS
		.filter(key => source[key])
		.map(key => [key, source[key]])
);

module.exports = class AuthState {
	#filePath;
	#accounts = {};

	constructor (options = {}) {
		this.#filePath = options.filePath
			?? process.env.HOYOLAB_AUTH_STATE_PATH
			?? "./data/auth-state.json";
		this.#load();
	}

	getAccountId (cookie) {
		const parsed = Cookie.parse(cookie);
		return parsed.account_id_v2 ?? parsed.ltuid_v2 ?? null;
	}

	canRefresh (cookie) {
		const accountId = this.getAccountId(cookie);
		return Boolean(accountId && this.#accounts[accountId]?.stoken && this.#accounts[accountId]?.ltmid_v2);
	}

	prepareCookie (cookie) {
		const parsed = Cookie.parse(cookie);
		const accountId = this.getAccountId(cookie);
		const stored = accountId ? this.#accounts[accountId] ?? {} : {};

		if (accountId && parsed.stoken && parsed.stoken !== stored.stoken) {
			this.#updateEntry(accountId, parsed);
		}

		const current = accountId ? this.#accounts[accountId] ?? {} : {};
		return Cookie.serialize({
			...parsed,
			...current
		}, {
			blacklist: ["stoken", "stuid"]
		});
	}

	importCookie (cookie) {
		const parsed = Cookie.parse(cookie);
		const accountId = this.getAccountId(cookie);
		if (!accountId || !parsed.stoken) {
			return false;
		}

		this.#updateEntry(accountId, parsed);
		return this.canRefresh(cookie);
	}

	getRefreshCookie (cookie) {
		const accountId = this.getAccountId(cookie);
		const stored = accountId ? this.#accounts[accountId] : null;
		if (!stored?.stoken || !stored?.ltmid_v2) {
			return null;
		}

		return Cookie.serialize({
			stoken: stored.stoken,
			mid: stored.ltmid_v2
		});
	}

	updateCookie (cookie, values) {
		const accountId = this.getAccountId(cookie);
		if (!accountId || !this.#accounts[accountId]?.stoken) {
			return false;
		}

		this.#updateEntry(accountId, {
			...Cookie.parse(cookie),
			...values
		});
		return true;
	}

	#updateEntry (accountId, values) {
		const nextEntry = {
			...this.#accounts[accountId],
			...selectFields(values)
		};

		if (JSON.stringify(nextEntry) === JSON.stringify(this.#accounts[accountId])) {
			return;
		}

		this.#accounts[accountId] = nextEntry;
		this.#persist();
	}

	#load () {
		if (!fs.existsSync(this.#filePath)) {
			return;
		}

		const state = JSON.parse(fs.readFileSync(this.#filePath, "utf8"));
		if (state.version !== STATE_VERSION || typeof state.accounts !== "object" || state.accounts === null) {
			throw new Error("Unsupported HoYoLAB authentication state file");
		}

		this.#accounts = state.accounts;
		fs.chmodSync(this.#filePath, 0o600);
	}

	#persist () {
		const directory = path.dirname(this.#filePath);
		const temporaryPath = `${this.#filePath}.${process.pid}.tmp`;
		fs.mkdirSync(directory, { recursive: true });
		fs.writeFileSync(temporaryPath, JSON.stringify({
			version: STATE_VERSION,
			accounts: this.#accounts
		}, null, 2), {
			encoding: "utf8",
			mode: 0o600
		});
		fs.renameSync(temporaryPath, this.#filePath);
		fs.chmodSync(this.#filePath, 0o600);
	}
};
