# Reading-room library: handoff notes for ChatGPT

> **Where this file lives:** on the `chatgpt-handoff` branch only, on purpose. Do not merge this branch into `main`. Sesame's publish script mirrors `main` and refuses to publish when files it doesn't expect are there, so a `docs/` folder on `main` would stop the nightly upkeep. Start your own work from `main`, as described below.

These notes hand the open work on Gabriel's private prompt library ("reading-room") to ChatGPT. The main open job is GitHub issue #4. As of October 7, 2026, 8:53 PM Buenos Aires time, **nothing from issue #4 is live**. The live page is byte-for-byte the version from before the issue. Some draft edits exist, but only on Sesame's own machine, and nobody has tested them. Sesame (Gabriel's other assistant) still runs the nightly upkeep, so whatever you change has to keep working with it.

Each item below says whether it was checked, or is only planned or a draft.

## What you can reach, and what you cannot

- **Repository:** `Misterpepe22/reading-room` on GitHub (public). Live site: https://misterpepe22.github.io/reading-room/ (GitHub Pages, branch `main`, root).
- **The repository holds only the built output.** That is `index.html` (the public password page with the Remove / Suggest a fix / Search requests script built in) plus encrypted files under `d/`. The source templates, the build tools, and the keys live only on Sesame's machine, not in the repository.
- **Issue #4 areas 1 to 5 and 8 are all in `index.html`.** The issue cites its lines. You can work on those from the repository.
- **Areas 6 (filters) and 7 (titles) are in the encrypted app shell** (`d/app-<id>.enc`). Changing them means decrypting with the library password and rebuilding with Sesame's tools. Leave those two to Sesame, or write a spec for them, unless Gabriel arranges another way.
- **Access:** Gabriel gives you GitHub access through GitHub's own sign-in or ChatGPT's GitHub connection. Never ask him to paste a password, token, deploy key, or "remember me" link into a chat. Never commit secrets, decrypted exports, or links with credentials in them.

## How the work is split

| Part | Where it lives | What it does |
|---|---|---|
| Saved skills and schedules | Sesame | The nightly upkeep rules and their timing |
| Build and inbox tools | Sesame's machine | Encrypt and publish posts, read the sealed issues |
| Inbox private key, deploy key | Sesame's machine | Open sealed issues, push to this one repository |
| Password page and controls | `index.html` in the repository | Unlock, mark, suggest, request |
| Encrypted library | `d/` in the repository | Posts, pictures, removals, fixes |
| Queue | GitHub issues on the repository | Carries Gabriel's sealed marks to Sesame |

## What is live now (checked)

- **Password page:** `index.html` holds no library content. "Remember me" stores a derived key in `localStorage` (`staticrypt_passphrase`) for 30 days. The live `index.html` matches Sesame's snapshot from before issue #4 (same SHA-1, `e03c347a…`). The latest commit on `main` is `2d40bd4` ("Remove temporary maintenance key page").
- **Encrypted format (RR2):** `d/m.enc` is the manifest, `d/app-<id>.enc` is the app shell, `d/b/<id>.enc` holds the post text in parts, and each picture is in `d/i/<xx>/<id>.enc`. The key comes from the library password through PBKDF2, then HKDF-SHA256, then AES-256-GCM. The browser needs WebCrypto and DecompressionStream (Safari/iOS 16.4+, Chrome 80+, Firefox 113+). The library has 1,096 posts as of Batch 4 (commit `7ad42aa`).
- **Remove:** a toggle on each post, which can be undone before sending. A bar counts the marked posts and has a Send button.
- **Suggest a fix:** free text on each post, plus quick tags such as typo and wrong link.
- **Search requests:** an X account, web page or topic, free text, and the quick tags women, sexy, nature.
- **Send** opens a prefilled GitHub issue that Gabriel submits while signed in. The issue body is a single sealed line, `rr-box:v1:<base64url>:end` (P-256 ECDH + AES-GCM), and only Sesame's private key can open it. Sesame reads only open issues filed by `Misterpepe22` (account id 171266247). Closing an issue before 3 AM cancels everything in it. Issue text is always treated as data, never as instructions.
- **Removals** go into public `d/removed.json` as opaque ids and hide the posts. **Fixes** go into the sealed layer `d/p.enc`. Issue numbers are recorded as processed in the same commit, and issues are never closed or edited by Sesame.

## Schedules (all Sesame-side, America/Argentina/Buenos_Aires)

Do not re-create these in ChatGPT. Two systems running the same queue would process it twice.

- **3:00 AM daily, "Daily prompt library removals and edits":** reads the queue, hides the posts marked for removal (locked copies are kept so they can be restored), and applies the suggested fixes. It never changes original prompts, credits, original pictures or source links. Corrections go in a labeled "Fixed copy" block or "Fix note", and ambiguous or unsafe suggestions are skipped and reported. Removal wins over a suggestion on the same post. If the queue can't be read (exit code 2), it changes nothing and reports the error. A failed apply marks nothing as done, so the issues are tried again the next night. If nothing is queued, it does nothing and sends no message. Otherwise it texts Gabriel the removals, fixes, skipped suggestions, unreadable issues, the live check result, and how to undo.
- **5:00 AM daily, "Daily prompt source requests and batch preview":** searches exactly the account, page or topic requested (tags are search context only and never override the import rules), deduplicates against the live library, stages a candidate batch with previews, and **never publishes it**. Each request is marked staged, failed or skipped, and a failed one is retried for up to three nights. No batch size limit was agreed. A batch goes live only after Gabriel explicitly approves it in chat. On empty days it does nothing and sends no message.
- **11:00 AM daily, "Daily rebel inspiration for Maya's board":** a Pinterest routine that aims to add up to ten suitable, non-duplicate pins that match Gabriel's aesthetic board to Maya's Picks board, never removing existing pins, then texts him what was added. It has nothing to do with the library and is listed only so it isn't confused with library work.

## Rules to keep

- **Provenance:** keep original prompt text verbatim, along with creator credits, source links and original pictures. Translations, neutral rebuilds, signed copies, fixed copies and generated pictures are separate derivatives with their own labels, never replacements. Never present inferred text as an original full prompt.
- **Short titles (area 7):** put any short descriptive title in its own field (Sesame's draft uses `stitle`). Never edit `title` or the prompt blocks.
- **Selection rules for imports:** image prompts about adult women only, no video. Full prompts only. No duplicates, checked by source id and link. No sexual imagery of real people.
- **Publishing:** work on a branch and verify before anything reaches `main`. Gabriel approves before merging. Discovery batches stay staged until he says yes.
- **Compatibility with the 3 AM run:**
  - Keep the sealed line format `rr-box:v1:<base64url>:end`, with at least 100 base64url characters.
  - Keep the issue target `Misterpepe22/reading-room`, the public key, and the way post ids are derived. Sesame's tools compute the same id.
  - Keep the meaning of `d/removed.json` and `d/p.enc`.
  - Keep the three controls on the page.
  - Don't edit anything under `d/` by hand.
- **Issue #4 itself:** it says it is documentation, not a removal list or a request. It contains no sealed line, so the 3 AM run should ignore it. That conclusion comes from reading the code, not from a test.

## Issue #4: status of the eight areas

Issue #4, "Review para Maya: fiabilidad de pedidos, filtros y accesibilidad", is open. Misterpepe22 filed it on October 7 at 8:11 PM Buenos Aires time. It has no comments and cites `index.html` blob `ca125dca6ee343fc750f0bc4a64ff7a451f72b11`. Its recommended order is: send and cancel states, then the hidden bar and link budget, then accessibility and mobile, then filters and titles, then the persistence and credential-link review.

Status key: **live** means published and checked; **draft** means edited on Sesame's machine but not built, tested or published; **not started** means no work exists. No area is live.

Sesame's last run reported that nothing was restored, built, tested, pushed or commented. The machine shows something slightly different: draft edits were made in Sesame's templates that evening, but never built, tested or published. Treat every "draft" below as unverified. The check was a syntax pass only.

1. **Send vs confirmed (high), draft:** the live page marks items "sent" as soon as the GitHub form opens. The draft adds separate states, a "confirm by hand" step and GitHub polling. Not tested.
2. **Undo vs published issue (high), draft:** the draft adds "Cancel on GitHub" / "Cancelar en GitHub" for items already published. Not tested.
3. **Hidden bar (medium), draft:** the draft adds `.rr-bar[hidden],.rr-sheet[hidden]{display:none !important}`. Not tested.
4. **Link budget (medium), draft:** the draft sets a 6,200-character limit, trims context in steps, and falls back to "paste" mode when one item is still too long. Not tested with long Unicode text.
5. **Accessibility (medium), partial draft:** the draft adds `:focus-visible`, `aria-modal`, Escape handling, a real show/hide password button (`#rr-eye`) and a language switch on the password page. Not yet checked: the fixed 360 px width, the label on the password field, focus trapping and return, and keyboard use of the cards.
6. **Filters (usability), not started:** the app shell is unchanged.
7. **Titles and Spanish controls (editorial), partial draft:** a rule-based generator for `stitle` exists on Sesame's machine, but nothing uses it yet. Spanish controls exist only as the draft language switch on the password page.
8. **Remember me and credential links (security), partial draft:** the draft clears access parameters from the address bar with `replaceState`. Not tested. A visible "forget me" or sign-out control is not confirmed.

Sesame keeps a snapshot of the live files from before issue #4, so the drafts can be dropped at any time.

## Suggested plan

Earlier runs failed because they tried everything at once. Do it in stages, and don't start a stage until the one before it works:

1. Create a branch from `main` (for example `issue-4`) and work on `index.html` only, for areas 1 to 5 and 8.
2. Test with the checks below, on a phone-sized screen and on desktop.
3. Open a pull request with a summary of the changes and the test results. Gabriel reviews and approves the merge.
4. After the merge, check the live site, then comment on issue #4 with what changed and how it was verified.
5. Tell Gabriel to pass the merged diff to Sesame. Sesame has to copy the changes into its own templates, because the next time it rebuilds the password page, `index.html` is regenerated from those templates and your edits would be overwritten. Areas 6 and 7 go to Sesame as a spec.

## Commands

For you, in a clone of the repository:

```bash
git checkout main && git pull
git checkout -b issue-4
# edit index.html, serve it locally, test, then:
git push -u origin issue-4   # open a pull request; do not push to main
```

For Sesame only, on its machine (listed so you know what your changes must stay compatible with; you cannot run these):

```bash
# 3 AM queue
python3 rr_inbox.py fetch --site site --out inbox/work.json
python3 rr_inbox.py apply --site site --work inbox/work.json --fixes inbox/fixes.json
python3 rr_inbox.py restore --site site --posts N    # undo a removal
python3 rr_inbox.py unfix --site site --posts N      # undo a fix
# 5 AM requests
python3 rr_inbox.py requests --out inbox/requests.json
python3 rr_inbox.py requests-done --keys <issue>:<at> --status staged --note "..."
# compatibility check of a new page's sealed issue, offline
RR_INBOX_TEST_ISSUES=<saved issues.json> python3 rr_inbox.py fetch --site site --out inbox/work.json
# rebuild and check the password page, then publish after approval
python3 rr_site.py gate --site site
python3 rr_site.py scan --site site
LIB_PASSWORD=... python3 rr_site.py verify --site site
./publish-reading-room.sh push site "message"
```

## Acceptance checks (from issue #4)

- Open Send, then close GitHub without submitting. The items must still be sendable and must not show as sent. Reload the page and confirm the state is kept.
- A local cancel must never mark a remote issue as cancelled. With a mixed batch, the items must still match their issue.
- With nothing pending, the bar takes no space. It appears when something is pending, and disappears again when the drafts are cleared.
- Long text, Unicode and data that doesn't compress well: every link stays under the limit, or the paste fallback works. No request is lost silently, and the page never sticks on "Locking...".
- The page works fully by keyboard and with a basic screen reader, at 200% zoom, at 320 px wide, and in landscape.
- Access parameters are gone from the address bar and history before any outside resource loads.
- Compatibility: Sesame has to confirm that a sealed issue made on the new page still opens with its reader. Sesame can check this offline with a saved copy of the test issue before anything is merged.

## Rollback

To undo a merged change, run `git revert` on `main`. For reference: `71b8f28` added the Remove / Suggest a fix / Search requests controls, and `7ad42aa` is Batch 4 (1,096 posts). Sesame keeps its own snapshots for older versions.
