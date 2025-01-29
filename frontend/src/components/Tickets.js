import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Tickets = () => {
  const [bilete, setBilete] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Apelează endpoint-ul API pentru biletele zilei de astăzi
    fetch(`${process.env.REACT_APP_API_URL}/api/biletul-zilei`)
      .then(response => response.json())
      .then(data => {
        // Sort tickets on the frontend in case backend ordering isn't applied
        const sortedTickets = data.sort((a, b) => new Date(b.ticket_date) - new Date(a.ticket_date));
        setBilete(sortedTickets);
      })
      .catch(error => console.error('Error fetching tickets:', error));
  }, []);

  const handleClick = (ticketId) => {
    navigate(`/biletul-zilei/${ticketId}`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Biletul Zilei din Tenis și Fotbal</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {bilete.length > 0 ? (
          bilete.map((bilet, index) => (
            <div
              key={index}
              onClick={() => handleClick(bilet.id)}
              className="cursor-pointer border rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="h-48 overflow-hidden rounded-t-lg">
                <img
                  src={`${process.env.REACT_APP_API_URL}${bilet.image}`}
                  alt={bilet.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col items-center">
                <h3 className="text-lg font-bold text-center">{bilet.title}</h3>
                <p className="text-center text-gray-500 mt-2">
                  {new Date(bilet.ticket_date).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>Nu există bilete pentru astăzi.</p>
        )}
      </div>
    </div>
  );
};

export default Tickets;
