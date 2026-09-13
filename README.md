# Course Hub

A read-only course site: courses with their materials, coursework, announcements, and teaching
staff, searchable across the department and organised by semester, category, and tag. The interface
follows Discourse's visual language — a slim header, a quiet sidebar, and list-first pages.

Built with React 19, TypeScript, Vite, and React Router, and deployed as a static site to GitHub
Pages. There is no backend and no database, so there is nothing to sign in to and nothing to edit in
the browser: every course, material, and deadline comes from one file, `content/courses.yaml`, and
the files themselves sit in `public/courses/<course id>/`. Changing the site means changing that
file and pushing it.

## Running it

```bash
npm install
npm run files:pull      # fetch the course files (they are not in the clone)
npm run dev             # http://localhost:5173
npm run build           # type-check and emit to dist/
npm run preview         # serve the build at the deployed base path
npm run check:content   # cross-check the YAML against the files on disk
npm run lint
```

## Adding a course

Add an entry to `content/courses.yaml`, drop its files in
`public/courses/<course id>/`, and reference them by filename:

```yaml
courses:
  - id: operating-systems     # the URL and the folder name
    code: CE-341
    title: Operating Systems
    semester: fall-2025
    category: cs
    status: archived          # a course you have finished
    professors: [nasseri]
    tags: [core, systems]
    summary: Processes, scheduling, virtual memory, and concurrency.
    materials:
      - title: Lecture 1 — What an operating system actually does
        file: lec01-intro.pdf     # public/courses/operating-systems/lec01-intro.pdf
        week: 1
      - title: "Operating Systems: Three Easy Pieces"
        type: ebook
        url: https://pages.cs.wisc.edu/~remzi/OSTEP/
```

Then `npm run files:push` to publish the files and `git push` to publish the entry; the workflow
rebuilds the site.

File sizes and material icons are read from the files themselves, so they do not have to be
maintained by hand. `content/README.md` documents every field. If an entry is wrong — an unknown
semester id, a deadline before its release date — the site refuses to load and says which entry and
why, instead of rendering a blank page.

## Publishing to GitHub Pages

Pushing to `main` builds and deploys automatically. Set **Settings → Pages → Source** to
**GitHub Actions** once, and that is the whole setup.

The workflow (`.github/workflows/deploy.yml`) installs, downloads the course files, checks the
content against them, lints, builds, and publishes. Pull requests run the same build without
deploying, so a broken content file is caught before it reaches the site.

It asks the Pages API where the site is actually served from rather than guessing, so the base path
comes out right whether that is a custom domain (`/`), a user site (`/`), or a project site
(`/<repo>/`). This repository serves from <https://courses.kiarashs.ir>, so the base path is `/`.

## Course files

`public/courses/` is not in the repository. The files are big and nobody cloning the code needs
them, so they live as a release asset instead — the one place on GitHub a `git clone` never reaches.
Committing them, Git LFS included, would pull them down on every clone by default.

```bash
npm run files:push     # bundle public/courses and upload it to the release
npm run files:pull     # get the files onto a fresh clone
npm run files:status   # what is here, what is on GitHub
```

`files:push` tars `public/courses/`, creates the `course-files` release if it is missing, and
uploads `course-files.tar.gz` to it, replacing what was there. The deploy workflow downloads that
asset before building, so the published site has every file while the repository stays at a few
hundred kilobytes. Both need the [GitHub CLI](https://cli.github.com) and `gh auth login`.

Add or change a file, then:

```bash
npm run files:push     # publish the files
git push               # publish the content file; the workflow rebuilds
```

If the release does not exist yet the build still succeeds — it logs a warning and the download
links 404 until you push the files. Missing files are listed by `npm run check:content`, in the
workflow's job summary, and in the app's Settings page.

To commit the files instead, drop these lines from `.gitignore` and skip `files:push` entirely; the
workflow uses whatever is already on disk:

```
public/courses/*
!public/courses/.gitkeep
```

### Deploying by hand

`npm run deploy` still builds locally and pushes `dist/` to a `gh-pages` branch, for when you would
rather not use Actions. It needs **Pages → Source** set to the `gh-pages` branch instead, so pick
one method or the other — with the source set to GitHub Actions, a `gh-pages` push publishes
nothing.

A manual build defaults to a base path of `/`, which is what this repository's custom domain needs.
Pass `BASE_PATH=/Academic-Course-Management/ npm run build` to produce a build for the plain
`github.io` project URL instead. The Actions build never needs this — it reads the real value from
the Pages API.

## Why there is nothing to edit here

GitHub Pages serves static files and runs no code of its own, so a form that creates a course or
uploads a file has nowhere to write to. Rather than ship buttons that cannot work, the site has
none: no sign-in, no account switching, no create, edit, or delete. Content is authored in
`content/courses.yaml`, which means it has a full history, can be reviewed in a pull request, and is
identical for everyone who visits.

A course marked `status: draft` is withheld from the site entirely, along with its materials and
coursework, rather than shown behind a label — there is no login to hide it behind. That makes
`draft` a way to stage content that is not ready yet.

## What is in it

**Courses.** Code, title, summary and full description, semester, category, tags, level, credits,
capacity and enrolment, language, room, accent colour, meeting times, prerequisites, learning
objectives, and a weighted grading scheme. A course page reads like a Discourse topic: the
description, objectives, and syllabus as a post stream, with the timetable and grading alongside.
Courses you have finished go in with `status: archived`, which keeps their materials searchable
while moving the course itself to the Archive page.

**Materials.** Slides, e-books, notes, videos, papers, datasets, code, and external links, each with
a file or URL, size, week number, optional module, uploader, tags, a download counter, and a
student-visible flag. A `file:` is served from the course's own folder; a `url:` points anywhere. The library page searches across every course at once and filters by type,
course, tag, and uploader; a course's own tab groups them by module.

**Assignments.** Homework, labs, quizzes, projects, and exams with release and due timestamps,
points, grade weight, an attachment, a late-submission policy, and submission and grading counts.
The assignments page slices them by upcoming, next seven days, closed, drafts, and everything.

**Semesters.** Terms with start and end dates, one marked current. New courses default to it, and
the calendar only draws a course's sessions inside its own term.

**Tags and categories.** Categories place a course in a subject area; tags cut across courses,
materials, and assignments. The taxonomy page shows usage counts and deleting a tag strips it from
every record that carried it.

**Archive.** Archived courses keep their materials, assignments, and enrolment figures, searchable
and restorable, on a page of their own.

**People.** Professors, teaching assistants, and students with office hours, contact details, and a
profile page listing their courses, uploads, and teaching load.

**Calendar.** A month grid combining class sessions from each timetable with every assignment
deadline, plus a day agenda.

**Search.** One ranked index over courses, materials, assignments, and people, reachable from the
search page or the ⌘K quick switcher.

**Categories and tags.** Categories get Discourse-style boxes with a colour stripe and their recent
courses; tags get a cloud with usage counts, and each has a page listing everything under it.

Also: light, dark, and system themes that follow the operating system by default, a collapsible
sidebar, and `/` or ⌘K anywhere for search.

## Layout

```
\.github/workflows/
  deploy.yml       build on every push and PR, deploy main to Pages
content/
  courses.yaml     the site's content — courses, materials, assignments, people
  README.md        every field, documented
public/courses/    course files — not in git, kept in a release asset
scripts/
  check-content.mjs  YAML ↔ files on disk
  course-files.mjs   push/pull the files to and from the release
src/
  components/
    assignments/   assignment row and form
    courses/       course card, table row, and form
    layout/        app shell, header, sidebar, search menu, toasts
    materials/     material row and form
    ui/            button, badge, avatar, modal, fields, menu, tag picker, icons
  content/         YAML → app data, with validation
  lib/             formatting, selectors, search, id generation, storage
  pages/           one file per route
  store/           theme preference and toasts — the only browser state there is
  styles/          Discourse-derived tokens, base, layout, components, views
  types/           the domain model
```

`src/store/DataProvider.tsx` holds every record and exposes the mutations; `src/lib/selectors.ts`
holds the read side (filtering, stats, ranked search) as plain functions over the dataset. Deleting
a record cleans up what referenced it: removing a course takes its materials, assignments, modules,
and announcements with it, and removing a person unassigns them from every course.

## How the data flows

`content/courses.yaml` is parsed at build time by a small Vite plugin, expanded into the app's data
model by `src/content/loadContent.ts`, and validated there: unknown ids, bad weekdays, impossible
dates, and missing required fields all fail with a message naming the entry. It also catches the
one YAML mistake that otherwise fails silently — a `{ … }` line whose value contains a comma, where
everything after the comma is quietly dropped. A second virtual module
reports the real size of everything under `public/courses`, so sizes are read from the files rather
than typed into the YAML.

`localStorage` holds one thing: the visitor's theme and sidebar preference, under
`coursehub.prefs.v1`. Nothing else is stored and nothing leaves the browser.

The repository ships with a sample department in `courses.yaml`. Replace those entries with your
own; it is one file.
