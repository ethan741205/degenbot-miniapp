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

The published URL is entered in [@BotFather](https://t.me/botfather):

- `/newapp` creates a Mini App bound to your bot, reachable at
  `https://t.me/<yourbot>/<appname>`.
- `/setmenubutton` puts the app behind the chat's menu button.

Content is a fictional showcase for an adult audience (18+).
