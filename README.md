# Fueling Curiosity v2 — Partner Review Release

Version: 2.0.0-rc.2

This is a portable static website and game package for partner and school review.

## Start locally

From this directory:

```bash
npm start
```

Then open `http://localhost:4173/`.

## Development checks and deployment

```bash
npm ci
npm run verify
npm test
npm run build
```

Upload the contents of `dist/` to your review host. There are no runtime package dependencies to install on the host. Keep the full source package for maintenance.

`docs/VALIDATION.md` records completed checks and limitations. `docs/DEPLOYMENT.md` covers hosting, saves, browser testing and rollback. `docs/CHANGE-REGISTER.md` explains the reasons and curriculum effects of the changes. The included browser tests require a separate QA run; mobile and visual sign-off are still outstanding.

## Main pages

- `index.html` — public website
- `game.html` — The Great Refinery Run
- `educators.html` — classroom setup and resources
- `teacher-guide.html` — printable field guide
- `book.html` — book page
- `certificate.html` — local printable certificate
- `release-notes.html` — v2 change record
- `privacy.html` — progress and data behavior
- `report-bug.html` — email-based feedback draft

## Partner review order

1. Read `release-notes.html` and `docs/Fueling-Curiosity-Review-and-Change-Plan.md`.
2. Run one complete route on the devices used by the school.
3. Verify pause/resume, browser-local progress, export/restore, and certificate printing.
4. Review the teacher guide and compare the unit list with the curriculum partner’s approved version.
5. Keep the current approved build available until v2 review is complete.

The current lesson engine and 16-unit completion list are retained from the supplied game. V2 adds a new shell, progress passport, device-local v2 persistence, educator pages, and support controls. This release is a partner-review candidate, not a claim of state curriculum approval or industrial operating qualification.
