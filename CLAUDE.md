# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A daily habit grid. Users add habits they want to build, tick each one off daily, and see a weekly view of their progress.

**Core interactions:**
- Add a new habit (name, optional description)
- For each habit, tick a box for today
- Show a 7-day grid for each habit, with ticked days highlighted
- Remove a habit entirely
- State persists across reloads

## Stack

- Plain HTML, CSS, and JavaScript
- No frameworks (no React, no Next.js)
- No build tooling
- Data persisted in `localStorage`
- Deployed to GitHub Pages

## Constraints

Build the project as a small web app using only HTML, CSS, and JavaScript. All data should be saved in the browser — no server, no database, no frameworks, no build step. The site will be hosted on GitHub Pages.

## Development

Open `index.html` directly in a browser — no server or install step needed. All changes are immediately reflected on reload.
