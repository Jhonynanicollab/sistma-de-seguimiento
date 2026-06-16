import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout__main">
        <Navbar />
        <div className="layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
