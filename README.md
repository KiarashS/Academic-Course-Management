# Course Hub

A course management workspace for professors and teaching assistants. Courses carry their own
materials, assignments, modules, announcements, and staff; everything is searchable across the
department and organised by semester, category, and tag.

Built with React 19, TypeScript, Vite, and React Router, and deployed as a static site to GitHub
Pages. There is no backend and no database: every course, material, and deadline comes from one
file, `content/courses.yaml`, and the files themselves sit in `public/courses/<course id>/`.

## Running it

```bash
npm install
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

File sizes and material icons are read from the files themselves, so they do not have to be
maintained by hand. `content/README.md` documents every field. If an entry is wrong — an unknown
semester id, a deadline before its release date — the site refuses to load and says which entry and
why, instead of rendering a blank page.

## Publishing to GitHub Pages

```bash
npm run deploy     # checks content, builds, pushes dist/ to the gh-pages branch
```

Then set Pages to serve from the `gh-pages` branch. The build writes `404.html` alongside
`index.html` so deep links work, and `.nojekyll` so Jekyll leaves the output alone. The base path
is `/Academic-Course-Management/`; override it with `BASE_PATH=/ npm run build` for a user site or
custom domain.

**Deploy from a machine that has the course files.** `public/courses/` is git-ignored, so the files
never enter the repository — which also means a GitHub Actions workflow would check out a repo
without them and publish dead links. `npm run deploy` builds locally, where the files are, and
pushes only the built output. To commit the files instead, drop the `public/courses/*` lines from
`.gitignore`.

## Editing in the browser

The forms still work, and they are the easiest way to draft a course. On a static site nothing the
browser does can publish, so edits are kept as a local draft: a banner says so, and Settings →
Publishing exports the whole workspace back out as `courses.yaml` to replace the file with. A draft
is discarded automatically when the content file changes underneath it, so a published update is
never silently shadowed by a stale local edit.

## What is in it

**Courses.** Code, title, summary and full description, semester, category, tags, level, credits,
capacity and enrolment, language, room, accent colour, meeting times, prerequisites, learning
objectives, and a weighted grading scheme. A course is a draft, published, or archived. Professors
create, edit, archive, restore, duplicate into another semester, and delete; duplicating copies the
modules and materials and resets enrolment. Courses you have finished go in with `status: archived`,
which keeps their materials searchable while moving the course itself to the Archive page.

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

**Roles.** Switch the signed-in account from the top bar. Professors own the courses they lead;
teaching assistants manage materials, assignments, and announcements in the courses they are
assigned to but cannot edit the course record itself. The interface hides what the current account
cannot do.

Also: light, dark, and system themes, a compact density mode, a collapsible sidebar, keyboard
shortcuts (⌘K, `/`, Esc), toast notifications, and JSON export and import from Settings.

## Layout

```
content/
  courses.yaml     the site's content — courses, materials, assignments, people
  README.md        every field, documented
public/courses/    course files, git-ignored, published with the site
scripts/
  check-content.mjs  YAML ↔ files on disk
src/
  components/
    assignments/   assignment row and form
    courses/       course card, table row, and form
    layout/        app shell, sidebar, top bar, command palette, toasts, draft banner
    materials/     material row and form
    ui/            button, badge, avatar, modal, fields, menu, tag picker, icons
  content/         YAML → app data, with validation, and the export back out
  lib/             formatting, selectors, search, id generation, storage
  pages/           one file per route
  store/           data, preferences, toasts, session and permissions
  styles/          tokens, base, layout, components, views
  types/           the domain model
```

`src/store/DataProvider.tsx` holds every record and exposes the mutations; `src/lib/selectors.ts`
holds the read side (filtering, stats, ranked search) as plain functions over the dataset. Deleting
a record cleans up what referenced it: removing a course takes its materials, assignments, modules,
and announcements with it, and removing a person unassigns them from every course.

## How the data flows

`content/courses.yaml` is parsed at build time by a small Vite plugin, expanded into the app's data
model by `src/content/loadContent.ts`, and validated there: unknown ids, bad weekdays, impossible
dates, and missing required fields all fail with a message naming the entry. A second virtual module
reports the real size of everything under `public/courses`, so sizes are read from the files rather
than typed into the YAML.

`localStorage` holds two things: preferences under `acm.prefs.v1`, and — only once you edit
something — a draft under `acm.draft.v2`, stamped with a hash of the content file it branched from.
When the hash stops matching, the draft is dropped and the published content loads instead. Nothing
leaves the browser.

The repository ships with a sample department in `courses.yaml`. Replace those entries with your
own; it is one file.
