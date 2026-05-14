import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Search from './pages/Search'
import NavBar from './components/NavBar';
import ParkDetail from './pages/ParkDetail'
import Trips from './pages/Trips';
import Favorites from './pages/Favorites';

function App() {
  return (
    <>
    <NavBar />
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/search' element={<Search />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/parks/:parkCode" element={<ParkDetail />} />
      <Route path="/trips" element={<Trips />} />
    </Routes>
    </>
  );
}

export default App;
