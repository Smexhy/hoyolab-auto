const { spawnSync } = require("node:child_process");
const readline = require("node:readline/promises");

const Cookie = require("../object/cookie.js");
const AuthState = require("../singleton/auth-state.js");

const readFromPipe = async () => {
	const chunks = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString("utf8").trim();
};

const readHidden = async () => {
	const interface_ = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	process.stdout.write("Paste the complete cookie containing stoken, then press Enter: ");
	spawnSync("stty", ["-echo"], { stdio: "inherit" });

	try {
		return (await interface_.question("")).trim();
	}
	finally {
		spawnSync("stty", ["echo"], { stdio: "inherit" });
		process.stdout.write("\n");
		interface_.close();
	}
};

(async () => {
	const cookie = process.stdin.isTTY ? await readHidden() : await readFromPipe();
	const parsed = Cookie.parse(cookie);
	if (!parsed.stoken || !parsed.ltmid_v2 || !(parsed.account_id_v2 || parsed.ltuid_v2)) {
		throw new Error("The cookie must include stoken, ltmid_v2, and account_id_v2 or ltuid_v2");
	}

	const state = new AuthState();
	state.prepareCookie(cookie);
	if (!state.canRefresh(cookie)) {
		throw new Error("The persistent authentication cookie could not be saved");
	}

	console.log("Persistent HoYoLAB authentication saved. Restart the application after importing every account.");
})().catch((e) => {
	console.error(`Authentication import failed: ${e.message}`);
	process.exitCode = 1;
});
