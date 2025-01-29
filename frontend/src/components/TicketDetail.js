import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TicketDetail = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    // Fetch ticket details by ID
    fetch(`${process.env.REACT_APP_API_URL}/api/biletul-zilei/${ticketId}`)
      .then(response => response.json())
      .then(data => setTicket(data))
      .catch(error => console.error('Error fetching ticket details:', error));
  }, [ticketId]);

  if (!ticket) return <p>Loading...</p>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-4">{ticket.title}</h2>
      <div className="w-full h-80 bg-white-200 rounded mb-4 flex justify-center items-center overflow-hidden">
        <img
          src={`${process.env.REACT_APP_API_URL}${ticket.image}` || 'default-image-url.jpg'}
          alt={ticket.title}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <p className="text-center text-gray-500 mb-4">
        {new Date(ticket.ticket_date).toLocaleDateString('ro-RO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </p>
      <div>
        <strong>Description:</strong>
        <div dangerouslySetInnerHTML={{ __html: ticket.description }} />
      </div>

      <p><strong>Ticket Odd:</strong> {ticket.ticket_odd}</p>
      <p><strong>Status:</strong> {ticket.ticket_status}</p>
      <h3 className="text-xl font-semibold mt-4">Predictions:</h3>
      <div className="space-y-2">
        {ticket.predictions.map((prediction, idx) => (
          <div key={idx} className="border-t mt-2 pt-2">
            <p><strong>Match:</strong> {prediction.team1} vs {prediction.team2}</p>
            <p><strong>Time:</strong> {new Date(prediction.date_time).toLocaleString()}</p>
            <p><strong>Prediction:</strong> {prediction.prediction}</p>
            <p><strong>Odd:</strong> {prediction.odd}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketDetail;
