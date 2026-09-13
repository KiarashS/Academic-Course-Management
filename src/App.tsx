import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Courses } from './pages/Courses'
import { CourseDetail } from './pages/CourseDetail'
import { Materials } from './pages/Materials'
import { Assignments } from './pages/Assignments'
import { Calendar } from './pages/Calendar'
import { People } from './pages/People'
import { PersonDetail } from './pages/PersonDetail'
import { Semesters } from './pages/Semesters'
import { Taxonomy } from './pages/Taxonomy'
import { Archive } from './pages/Archive'
import { Search } from './pages/Search'
import { Settings } from './pages/Settings'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="materials" element={<Materials />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="people" element={<People />} />
        <Route path="people/:personId" element={<PersonDetail />} />
        <Route path="semesters" element={<Semesters />} />
        <Route path="taxonomy" element={<Taxonomy />} />
        <Route path="tags" element={<Navigate to="/taxonomy" replace />} />
        <Route path="archive" element={<Archive />} />
        <Route path="search" element={<Search />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
