# Persistent cookie refresh

Code redemption uses `cookie_token_v2`, which can expire while the regular
HoYoLAB check-in cookie still works. HoyoLab Auto can renew both tokens when a
cookie also contains the longer-lived `stoken` credential.

## Setup

1. Obtain a complete overseas HoYoLAB cookie through an interactive account
   login. The cookie must contain `stoken`, `ltmid_v2`, and `account_id_v2` (or
   `ltuid_v2`). A normal cookie copied from a HoYoLAB page often does not include
   `stoken`.
2. Run `npm run auth:import` in the application directory and paste the
   complete cookie at the hidden prompt. Repeat this once for every HoYoLAB
   account.
3. Start or restart HoyoLab Auto and confirm that `data/auth-state.json` was
   created.

Portainer and some other web consoles do not expose their input as a regular
terminal. Leave the container running, connect to it with `/bin/sh`, and run
`node scripts/import-auth-cookie.js --interactive` directly instead of the npm
command. This forces the importer to read one hidden line and finish when Enter
is pressed. Restart the container after all accounts are imported.

As an alternative, add the complete cookie to one configured game entry and
start HoyoLab Auto once. You may then remove `stoken` from `config.json5`; the
persisted copy is used after restarts.

Only one game entry needs the complete cookie when Genshin, Star Rail, and ZZZ
share the same HoYoLAB account. The persisted account state is applied to every
matching game entry.

The refresh job runs every two hours. A redemption response that says the login
expired also triggers one immediate refresh and one retry.

## Security

`stoken` grants access to your HoYoLAB account. Never paste it into an issue,
pull request, log, or chat. The state file is created with mode `0600`; keep the
mounted `data` directory private and include it only in encrypted backups.

If the long-lived credential is revoked, perform the interactive login again
and repeat the setup. The application does not store the account password.
