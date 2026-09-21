# Slow Letters

Write a letter, seal it with wax, and send a link. When someone opens the link they break the seal, and the letter writes itself out one word at a time.

- The whole letter is plain, editable text. Nothing is added around what you write.
- No server, no database, no build step. It is a static site (`index.html`, `css/`, `js/`).
- Each letter lives **inside its link** (compressed, in the part after `#`). Nothing is uploaded, and the part after `#` is never sent to the host.
- Any number of letters, of any length. Sealed letters are kept in the sender's own browser ("Letterbox").

## Files

```
index.html        the page
css/styles.css    styling
js/app.js         everything the site does
vercel.json       optional Vercel settings
.nojekyll         tells GitHub Pages to serve files as they are
```

## Put it on GitHub

1. Create a new repository on github.com (for example `slow-letters`).
2. Unzip this folder and upload everything in it (drag the files into the repo page, or use git):

   ```bash
   cd slow-letters
   git init
   git add .
   git commit -m "Slow Letters"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/slow-letters.git
   git push -u origin main
   ```

3. Optional, free hosting on GitHub Pages: repository **Settings > Pages**, set the source to **Deploy from a branch**, choose `main` and `/ (root)`, then save. Your site will be at `https://YOUR-NAME.github.io/slow-letters/`.

## Put it on Vercel

1. Sign in at vercel.com and choose **Add New > Project**.
2. Import the GitHub repository from the step above.
3. Leave every setting as it is (Framework Preset: **Other**, no build command, no output directory) and press **Deploy**.

Or from a terminal, inside this folder: `npx vercel --prod`.

Vercel gives you an address like `https://slow-letters.vercel.app`. Every link the site creates is built from the address it is running on, so links work for anyone as soon as the site is deployed. Add a custom domain in the Vercel project settings if you want one.

## How links work

A link looks like `https://your-site/#l=zJclB...`. The code after `#l=` is the letter, compressed and encoded. Opening the link shows the sealed envelope, and the letter is decoded in the recipient's browser.

- Anyone who has a link can read that letter. Send it only to the person it is for.
- Long letters make long links. Email and most chat apps handle them, but some apps (SMS in particular) can cut a very long link short. Each sealed letter also has a shorter "letter code" that the recipient can paste under **Open a letter**.
- Compression uses the browser's built-in `CompressionStream`, which every current browser has (Chrome 103+, Safari 16.4+, Firefox 113+).
- If a link ever fails, the recipient sees a message and can paste the link or code under **Open a letter**.

## Changing things

Everything is in `js/app.js` (papers, inks, fonts, wax colours, seal marks are the lists at the top) and `css/styles.css`. Fonts load from Google Fonts. Edit, commit, and Vercel or GitHub Pages will redeploy on its own.
