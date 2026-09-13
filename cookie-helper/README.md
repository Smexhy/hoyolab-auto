# HoYoLAB cookie helper

This small script gets the complete HoYoLAB cookie needed for automatic cookie
refresh in tools such as [HoyoLab Auto](https://github.com/torikushiii/hoyolab-auto).
It includes `stoken`, which is normally missing when you copy cookies from a
browser.

The script runs on your own computer. Your password is hidden while you type and
is not saved. A random device ID is saved locally so later logins appear to come
from the same device; this can reduce repeated email checks, but HoYo may still
ask for one.

## Download

1. Click the green **Code** button above, then **Download ZIP**.
2. Extract the ZIP and open its `cookie-helper` folder.
3. Open a terminal in that folder:
   - **Windows:** open the folder, click the address bar, type `powershell`, and
     press Enter.
   - **macOS:** open Terminal, type `cd ` (including the space), drag the folder
     onto the Terminal window, and press Enter.
   - **Linux:** right-click the folder and choose **Open in Terminal**.

Python 3.9 or newer is required. If neither command below can find Python,
install it from [python.org](https://www.python.org/downloads/) and try again.
On Windows, enable **Add python.exe to PATH** during installation.

## Run it

On Windows, paste these commands into PowerShell one at a time:

```powershell
py -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python get_cookie.py
```

On macOS or Linux:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python get_cookie.py
```

Enter your HoYo account email or username, then your password. The password will
not appear while you type. A browser window may open for a captcha, and HoYo may
send an email verification code.

When login succeeds, the complete cookie is copied to your clipboard. Paste it
into HoyoLab Auto's cookie importer or a game entry in `config.json5`, then
return to the script and press Enter to clear it from the clipboard. One game
entry per HoYoLAB account is enough even when that account has several games.
Keep the cookie private: it grants access to your HoYoLAB account.

Run this on your desktop, not inside Docker or Portainer. The login may need to
open a browser on the same computer.

## HoyoLab Auto

After installing the version with persistent cookie refresh, run this in the
HoyoLab Auto application directory:

```bash
npm run auth:import
```

Paste the complete cookie and press Enter. Repeat it for each HoYoLAB account,
then restart HoyoLab Auto. See its
[persistent refresh guide](https://github.com/torikushiii/hoyolab-auto/blob/main/docs/PERSISTENT_COOKIE_REFRESH.md)
for Docker and Portainer details.

## What is saved?

The helper saves only a random 16-character device ID in your user configuration
folder. It does not save your email, username, password, or cookie. Delete the
`hoyolab-cookie-helper` configuration folder if you want a new device ID; HoYo
will probably ask for email verification again on the next login.

The script passes the account and password to the open-source
[`genshin.py`](https://github.com/seriaati/genshin.py) library, which performs
the HoYo app login. Version 1.7.30 is pinned in `requirements.txt` so an
unreviewed update is not installed automatically.
