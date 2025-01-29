import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Competition from './components/Competition';
import Tickets from './components/Tickets';
import TicketDetail from './components/TicketDetail';
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCompetitions } from './redux/competitionSlice';

const App = () => {
  const dispatch = useDispatch();
  const competitions = useSelector((state) => state.competitions.items);

  useEffect(() => {
    dispatch(fetchCompetitions());
  }, [dispatch]);

  return (
    <Router>
      <Navbar />
      <div className="container mx-auto p-4 pt-20">
        <Routes>
          <Route
            path="/"
            element={competitions.map((competition) => (
              <Competition key={`${competition.country}-${competition.name}`} competition={competition} />
            ))}
          />
          <Route path="/biletul-zilei" element={<Tickets />} />
          <Route path="/biletul-zilei/:ticketId" element={<TicketDetail />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
