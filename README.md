# Course Hub

A course management workspace for professors and teaching assistants. Courses carry their own
materials, assignments, modules, announcements, and staff; everything is searchable across the
department and organised by semester, category, and tag.

Built with React 19, TypeScript, Vite, and React Router. There is no backend: the whole dataset
lives in `localStorage` and ships with a populated demo department, so the app runs from `npm run
dev` with nothing else to set up.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and emit to dist/
npm run lint
```

## What is in it

**Courses.** Code, title, summary and full description, semester, category, tags, level, credits,
capacity and enrolment, language, room, accent colour, meeting times, prerequisites, learning
objectives, and a weighted grading scheme. A course is a draft, published, or archived. Professors
create, edit, archive, restore, duplicate into another semester, and delete; duplicating copies the
modules and materials and resets enrolment.

**Materials.** Slides, e-books, notes, videos, papers, datasets, code, and external links, each with
a URL, file size, week number, optional module, uploader, tags, a download counter, and a
student-visible flag. The library page searches across every course at once and filters by type,
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
src/
  components/
    assignments/   assignment row and form
    courses/       course card, table row, and form
    layout/        app shell, sidebar, top bar, command palette, toasts
    materials/     material row and form
    ui/            button, badge, avatar, modal, fields, menu, tag picker, icons
  data/seed.ts     the demo department, dated relative to today
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

## Data

Everything is stored under two `localStorage` keys, `acm.data.v1` and `acm.prefs.v1`, and nothing
leaves the browser. Loading merges the stored collections over the seed, so a workspace saved by an
older build still boots after new collections are added. Settings exports the whole dataset as JSON,
imports one back, and resets to the sample department.

The demo data is anchored to the day it first loads — the current term opens twelve weeks earlier —
so lecture material sits in the past, deadlines fall in the next few weeks, and the calendar is
never empty.
