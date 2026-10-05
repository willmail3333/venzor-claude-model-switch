# Venzor Model Switch

One click to switch Claude Code to the model and effort Claude just recommended.

The plugin asks Claude to end each reply with a line like:

    Model for next step: Opus 5.5, high effort

This plugin reads that line and, if it differs from what you are on, shows a button above the prompt box: **Switch to Opus 5.5, high effort**. Click it, and the plugin opens the app's own model and effort menus and picks them for you. If you are already on the right settings, no button appears.

![Demo: click the button and the model and effort switch](media/demo.gif)

Made by [Venzor](https://venzor.ai). Free, MIT licensed, no support promised.

## Why this exists

The Claude desktop app keeps its own saved model and effort for each chat. Plugins and slash commands (`/model`, `/effort`) change the engine, but the app then puts its own saved choice back, so the switch does not stick. See, for example, anthropics/claude-code issues 40095, 87440 and 95638. This plugin works with the app instead: it drives the app's own menus with its keyboard shortcuts, so the choice sticks and the labels stay correct.

## Requirements

- macOS
- The Claude desktop app, Code tab (tested with Claude Code engine 2.1.286)
- A one-time macOS permission (below)

## Install

1. Add the marketplace and install the plugin. Run these two commands:

       claude plugin marketplace add willmail3333/venzor-claude-model-switch
       claude plugin install model-switch-band@venzor-tools

2. Give `osascript` permission to press keys. Open System Settings, Privacy & Security, Accessibility (it may be titled "Device Control and Data Access"), click **+**, press Cmd+Shift+G, type `/usr/bin/osascript`, press Enter, click **Open**, and make sure its switch is on.

3. In chats that are already open, type `/reload-plugins` once. New chats load it automatically.

## How it works

On every message you send, the plugin quietly adds a short note asking Claude to end its reply with the recommendation line, so there is nothing to configure. Claude may occasionally skip the line; then no button shows.


The plugin runs a short AppleScript through `osascript`. It presses the app's shortcuts: Cmd+Shift+I opens the model menu and a number picks the model (1 Opus, 2 Fable, 3 Sonnet, 4 Haiku). Cmd+Shift+E opens the effort slider, which the script moves with Home and the arrow keys, then closes. It runs only when you click the button. See `model-switch-band/hooks/register.tsx`; it is short enough to read.

## Limits and honesty

- It presses keys on your Mac, which needs the Accessibility permission above. That permission lets any script run through `osascript` press keys, not only this one. Do not grant it if you are not comfortable with that.
- Do not type while the menus flash (about 3 seconds). A stray key could land in your prompt box.
- It depends on the app's menu order and shortcuts. An app update can break it. If the button picks the wrong model, open an issue.
- Mac and desktop app only. Not the terminal CLI, web, or phone.
- Not affiliated with or endorsed by Anthropic. Provided as is, with no warranty.

## Remove

    claude plugin uninstall model-switch-band@venzor-tools
