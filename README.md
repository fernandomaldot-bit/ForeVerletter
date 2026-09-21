# Slow Letters (ForeVerletter)

Write a letter, seal it with wax, and send a link. When someone opens the link they break the seal, and the letter writes itself out one word at a time.

The whole site is **one file, `index.html`**. Two small extra files switch on accounts (optional): `firebase-config.js` and `firestore.rules`.

There are two ways to run it:

| | Without Firebase (default) | With Firebase (Google sign-in) |
|---|---|---|
| Letters | travel inside the link (long links) | stored online, short link `#c=...` |
| Audio | only a tiny clip (up to 60 KB) inside the link, or a link to a file | up to 5 MB stored online, never in the link |
| Inbox / Sent | per person, on that device only | follow the Google account to every device |
| Setup | none | about 15 minutes, free |

---

## Part 1: Put the site on GitHub Pages (about 5 minutes, no terminal)

1. Go to https://github.com/fernandomaldot-bit/ForeVerletter and sign in.
2. Delete any old files (open each file, click the three dots, **Delete file**, **Commit changes**). The old `css` and `js` folders are no longer used.
3. **Add file > Upload files**, drag in **`index.html`** (and `firebase-config.js`, `firestore.rules`, `README.md`, `vercel.json`, `.nojekyll`), then **Commit changes**. `index.html` must be at the top of the repo, not inside a folder.
4. **Settings > Pages**: Source **Deploy from a branch**, Branch **main**, folder **/ (root)**, **Save**.
5. Wait 1 to 2 minutes and open **https://fernandomaldot-bit.github.io/ForeVerletter/** (hard refresh with Ctrl+Shift+R or Cmd+Shift+R if you see the old page).

The repository must be **Public** for free GitHub Pages.

---

## Part 2: Turn on Google accounts, synced boxes and online audio (Firebase)

Firebase is Google's free backend. You need a Google account. The free "Spark" plan is enough; no card is needed.

### 2.1 Create the project
1. Go to https://console.firebase.google.com and click **Create a project** (or **Add project**).
2. Name it (for example `slow-letters`), click Continue. You can turn Google Analytics **off**. Click **Create project**.

### 2.2 Turn on Google sign-in
1. In the left menu: **Build > Authentication**, then **Get started**.
2. **Sign-in method** tab > **Google** > switch **Enable** on > pick your email as the "support email" > **Save**.
3. Open **Authentication > Settings > Authorized domains** > **Add domain** and type exactly:
   `fernandomaldot-bit.github.io`
   (no `https://`, no path). Add your Vercel or custom domain here too if you use one.

### 2.3 Create the database
1. **Build > Firestore Database > Create database**.
2. Pick the location closest to you (it cannot be changed later) and click Next.
3. Choose **Start in production mode** and click **Create** (the next step replaces the rules).

### 2.4 Paste the security rules
1. In Firestore, open the **Rules** tab.
2. Delete everything in the editor and paste the whole contents of **`firestore.rules`** from this folder.
3. Click **Publish**.

These rules say: anyone with a letter's link can read that letter (its id is random and can't be guessed) but nobody can list letters; only the sender can create or delete a letter; and each person's Sent and Inbox boxes can only be read or changed by that signed-in person.

### 2.5 Connect the site
1. Click the gear icon next to **Project Overview** > **Project settings**.
2. Scroll to **Your apps** and click the web icon **</>**. Give it a nickname, leave "Firebase Hosting" **unchecked**, click **Register app**.
3. Firebase shows a block of code with `firebaseConfig = { apiKey: "...", authDomain: "...", ... }`. Copy those values.
4. On GitHub, open **`firebase-config.js`**, click the pencil icon, paste each value between the quotes, and **Commit changes**.
5. Wait a minute, open your site, and hard refresh. The top-right button now says **Sign in**. Press it, choose **Sign in with Google**.

The values in `firebase-config.js` are not secrets; it is safe for them to be public. The rules in step 2.4 are what protect your data.

### If something doesn't work
- **"This site's address isn't allowed yet"**: add `fernandomaldot-bit.github.io` under Authentication > Settings > Authorized domains.
- **"Google sign-in isn't turned on yet"**: do step 2.2.
- **"The Firebase rules blocked that"** or **"permission-denied"**: publish the rules (step 2.4).
- **The sign-in window doesn't appear**: allow pop-ups for the site.
- **The button never changes to "Sign in"**: `firebase-config.js` is empty or has a typo (an extra space or missing quote). Check the values against Project settings.
- Press F12 and open **Console** to see the exact error, and send it to me if you're stuck.

---

## How it works with an account

- **Sealing** while signed in stores the letter online and gives a short link like `https://your-site/#c=AbC123...`. Anyone can open it without signing in.
- **Sent** lists the letters you sealed. **Delete** in Sent asks "Delete and unsend?": it removes the letter and its audio, and the link stops working.
- **Inbox** lists letters you opened while signed in (or pressed **Save for later** on). Open a letter link while signed in and it is kept in your Inbox on every device. Opening your own letter is just a preview.
- Sign in with the same Google account on another phone or computer and Sent and Inbox are there.
- **Copy to Google** (button next to a device profile in the top-right menu, shown while signed in) copies the letters kept on that device into your Google account.
- Old letters made before accounts, with the letter inside the link (`#l=...`), still open.

## Audio

- Signed in: attach an audio file of up to **5 MB** (mp3, m4a, wav, ogg). It is stored online next to the letter and plays when the reader breaks the seal. It never goes in the link.
- Bigger files (a whole song): put the file online and paste its address into "Or link a longer file", or upload it to your GitHub repo next to `index.html` and type its file name (for example `song.mp3`).
- Not signed in (and Firebase on): audio is not available, because the link can't carry it.

The 5 MB limit exists because audio is stored in the database in pieces so the free plan is enough. Firebase's file storage would allow bigger files but requires upgrading to the pay-as-you-go plan and adding a card.

## Free plan limits (Spark)

About 1 GB stored, 50,000 reads and 20,000 writes a day. A letter with 5 MB of audio uses about 11 writes to save and 11 reads each time someone plays it. Firebase stops (it doesn't charge) if you go over.

## Good to know

- Anyone with a letter's link can read that letter; send it only to the person it's for. Deleting it in Sent makes the link stop working.
- The letter must be under about 800,000 characters to be stored online. Without an account there's no limit, but the link gets long.
- Letters aren't delivered to someone by their email; you send the link yourself, and it lands in their Inbox when they open it while signed in.

## Files

```
index.html         the whole site
firebase-config.js your Firebase settings (empty = no accounts)
firestore.rules    security rules to paste into Firebase
vercel.json        optional Vercel settings
.nojekyll          tells GitHub Pages to serve files as they are
README.md          this file
```
