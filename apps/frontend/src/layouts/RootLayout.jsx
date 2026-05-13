import { BrowserRouter as Router } from 'react-router-dom'
import '../global.css'

const RootLayout = ({ children }) => {
  return (
    // <Router>
    <div className="antialiased">
      {children}
    </div>
    /* </Router> */
  )
}

export default RootLayout
