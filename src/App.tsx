import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Courses } from './pages/Courses'
import { CourseDetail } from './pages/CourseDetail'
import { Materials } from './pages/Materials'
import { Assignments } from './pages/Assignments'
import { Calendar } from './pages/Calendar'
import { Categories, CategoryDetail } from './pages/Categories'
import { Tags, TagDetail } from './pages/Tags'
import { Semesters } from './pages/Semesters'
import { Archive } from './pages/Archive'
import { People } from './pages/People'
import { PersonDetail } from './pages/PersonDetail'
import { Search } from './pages/Search'
import { About } from './pages/About'
import { NotFound } from './pages/NotFound'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Courses />} />
        <Route path="courses" element={<Navigate to="/" replace />} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="materials" element={<Materials />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="categories" element={<Categories />} />
        <Route path="categories/:categoryId" element={<CategoryDetail />} />
        <Route path="tags" element={<Tags />} />
        <Route path="tags/:tagId" element={<TagDetail />} />
        <Route path="semesters" element={<Semesters />} />
        <Route path="archive" element={<Archive />} />
        <Route path="people" element={<People />} />
        <Route path="people/:personId" element={<PersonDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="about" element={<About />} />
        <Route path="taxonomy" element={<Navigate to="/tags" replace />} />
        <Route path="settings" element={<Navigate to="/about" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
