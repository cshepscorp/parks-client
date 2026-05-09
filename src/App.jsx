import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Search from './pages/Search'
import NavBar from './components/NavBar';
import ParkDetail from './pages/ParkDetail'

function App() {
  return (
    <>
    <NavBar />
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/search' element={<Search />} />
      <Route path="/parks/:parkCode" element={<ParkDetail />} />
    </Routes>
    </>
  );
}

export default App;
