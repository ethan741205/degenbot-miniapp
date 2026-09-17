# DegenBot — Telegram Mini App

Game discovery, platform comparisons and player perspectives, packaged as a
Telegram Mini App. Static front end, no backend.

**Live:** https://ethan741205.github.io/degenbot-miniapp/

## Deploying an update

This repository is the published copy. The source of truth is the
`telegram-mini-app/` folder in the parent project; copy the changed files here,
then:

```sh
git add -A
git commit -m "Update Mini App"
git push
```

GitHub Pages redeploys automatically within about a minute.

## Local preview

```sh
npx serve .      # or: python -m http.server 5173
```

## Wiring it to Telegram

Registered with [@BotFather](https://t.me/botfather) — live at
**https://t.me/GetDegenBot/DegenBot**

- `/newapp` binds a Mini App to the bot. Its cover image must be exactly
  640x360 — `assets/miniapp-cover-640x360.png`.
- `/setmenubutton` puts the app behind the chat's menu button.
- `/myapps` → *Edit link* changes the published URL.

`assets/botfather-1024.png` is the square bot profile picture (a different
spec from the Mini App cover).

Content is a fictional showcase for an adult audience (18+).
