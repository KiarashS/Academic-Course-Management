# Editing the content

`courses.yaml` is the whole site. Change it, rebuild, redeploy — nothing else
holds course data. What you edit in the browser is a local draft that only you
can see; Settings turns that draft back into this file.

## Adding a course you took

1. Pick an id. It becomes the URL (`/courses/<id>`) **and** the folder your
   files go in, so use a readable slug:

   ```yaml
   courses:
     - id: operating-systems
       code: CE-341
       title: Operating Systems
       semester: fall-2025      # must match an id under `semesters:`
       category: cs             # must match an id under `categories:`
       status: archived         # a course you have finished
       professors: [nasseri]    # ids from `people:`
       tags: [core, systems]    # ids from `tags:`
       summary: One or two sentences for the course card.
   ```

2. Put its files in `public/courses/operating-systems/`.

3. Reference them by filename — the path, the size, and the icon are worked out
   for you:

   ```yaml
       materials:
         - title: Lecture 1 — What an operating system actually does
           file: lec01-intro.pdf
           week: 1
         - title: "Operating Systems: Three Easy Pieces"
           type: ebook
           url: https://pages.cs.wisc.edu/~remzi/OSTEP/   # external, no file
   ```

4. `npm run check:content` to see whether every referenced file is actually
   there, then `npm run files:push` and `git push` — the workflow rebuilds and
   publishes the site.

A course with `status: archived` lands on the Archive page and keeps its
materials searchable from the library. Leave `status` off for a course that is
running now; use `draft` for one that is not ready to show.

## Files

Everything under `public/courses/<course id>/` is published at
`<site>/courses/<course id>/<filename>`.

That folder is **not in the repository**. Course material is large and nobody
cloning the code needs it, so it lives as a GitHub release asset instead — the
one place on GitHub a `git clone` never reaches. Anything committed, Git LFS
included, comes down on a clone by default.

```bash
npm run files:push     # bundle public/courses and upload it to the release
npm run files:pull     # get the files onto a fresh clone
npm run files:status   # what is here, what is on GitHub
```

So adding material is two pushes:

```bash
npm run files:push     # the files
git push               # the YAML entry describing them
```

The deploy workflow downloads the bundle before building, so the published site
serves every file while the repository stays small. If a file is referenced in
the YAML but missing, the build still succeeds and warns — `npm run
check:content` lists exactly which ones, and so does the Settings page.

To commit the files instead, drop these lines from `.gitignore`; the workflow
then just uses what is already on disk and `files:push` becomes unnecessary:

```
public/courses/*
!public/courses/.gitkeep
```

## Field reference

Anything not listed is optional. Ids referenced across sections must exist, or
the site refuses to load and names the offending entry.

### `semesters`

| Field | Notes |
| --- | --- |
| `id` | Referenced by each course's `semester`. |
| `term` | `Fall`, `Spring`, `Summer`, or `Winter`. |
| `year` | Number. |
| `start`, `end` | `YYYY-MM-DD`. The calendar only draws a course's classes between these. |
| `current` | Exactly one semester should have it. The first is used if none does. |

### `categories`, `tags`

`id`, `name`, `color` (hex), and for categories an optional `description`. A
course has one category and any number of tags; tags also apply to materials and
assignments.

### `people`

`id`, `name`, `email`, and `role` — one of `professor`, `ta`, `student`.
Professors own the courses they lead; teaching assistants can manage content in
courses they are listed under but cannot edit the course record. Optional:
`title`, `department`, `office`, `officeHours`, `phone`, `website`, `bio`,
`color`.

### `courses`

| Field | Notes |
| --- | --- |
| `id` | URL and folder name. Required, unique. |
| `code`, `title` | Shown everywhere. |
| `semester`, `category` | Ids from the sections above. |
| `status` | `published` (default), `draft`, or `archived`. |
| `archived` | Date, for archived courses. |
| `level` | `undergraduate` (default) or `graduate`. |
| `credits`, `capacity`, `enrolled` | Numbers. |
| `color` | Hex; tints the card, hero, and calendar entries. |
| `location`, `language` | Free text. |
| `folder` | Only if the file folder should differ from `id`. |
| `professors`, `assistants` | Lists of person ids. |
| `tags` | List of tag ids. |
| `summary`, `description` | Card text and the overview tab. |
| `prerequisites`, `objectives` | Lists of strings. |
| `schedule` | `{ day, start, end, room }`. `day` is `Mon`…`Sun` or 0–6. |
| `grading` | `{ label, weight }`. |
| `modules` | `{ id, title, summary }` — groups materials on the course page. |

### `materials`

| Field | Notes |
| --- | --- |
| `title` | Required. |
| `file` **or** `url` | One of the two. `file` is relative to the course folder. |
| `type` | `slides`, `ebook`, `note`, `video`, `paper`, `dataset`, `code`, `link`. Guessed from the extension when omitted. |
| `module` | A module id from the same course. |
| `week` | Number, shown as a badge. |
| `author` | Person id. Defaults to the first professor. |
| `tags` | Tag ids. |
| `description` | One or two lines. |
| `added` | `YYYY-MM-DD`. Defaults to the semester start. |
| `visible` | `false` hides it from students. |
| `downloads` | Starting count. |
| `size` | Only to override what is read from disk, e.g. `4.2 MB`. |

### `assignments`

`title` and `due` are required; `due` must come after `released`. Also:
`type` (`homework`, `lab`, `quiz`, `project`, `exam`), `points`, `weight`,
`author`, `tags`, `description`, `attachment` (a filename in the course folder or
a URL), `allowLate`, `published`, `submissions`, `graded`.

### `announcements`

`title`, `body`, and optionally `author`, `date`, `pinned`.

## Dates

Written as `YYYY-MM-DD` or `YYYY-MM-DD HH:mm` and read in the reader's own time
zone, so a deadline of `23:59` means 23:59 locally rather than in UTC.

## Going the other way

Settings → Publishing → **Download YAML** writes the current workspace, local
edits included, back out in this format. That is the way to use the in-app forms
as an editor: add the course in the browser, export, replace this file, redeploy.
