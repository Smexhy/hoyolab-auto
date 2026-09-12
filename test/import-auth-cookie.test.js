const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

test("interactive import works when stdin is not a TTY", (context) => {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "hoyolab-auth-import-"));
	context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	const filePath = path.join(directory, "auth-state.json");
	const cookie = [
		"stoken=refresh-secret",
		"ltmid_v2=mid-123",
		"ltuid_v2=123",
		"account_id_v2=123"
	].join("; ");

	const result = spawnSync(process.execPath, [
		path.join(__dirname, "../scripts/import-auth-cookie.js"),
		"--interactive"
	], {
		encoding: "utf8",
		env: {
			...process.env,
			HOYOLAB_AUTH_STATE_PATH: filePath
		},
		input: `${cookie}\n`
	});

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Paste the complete cookie/);
	assert.match(result.stdout, /authentication saved/);
	assert.equal(result.stdout.includes("refresh-secret"), false);
	assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
});
