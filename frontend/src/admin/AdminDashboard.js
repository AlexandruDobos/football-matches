import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Competition from './../components/Competition';
import RichTextEditor from '../quill/RichTextEditor';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('addPrediction');
  const [tickets, setTickets] = useState([]); // Pentru a stoca biletele postate
  const [selectedTicket, setSelectedTicket] = useState(null); // Pentru a stoca biletul selectat pentru modificare
  const competitions = useSelector((state) => state.competitions.items); // Get competitions from Redux
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [ticketOdd, setTicketOdd] = useState(1);
  const [ticketStatus, setTicketStatus] = useState('waiting');
  const [ticketDate, setTicketDate] = useState(new Date()); // New state for event date

  useEffect(() => {
    console.log('Active Section:', activeSection);
  
    if (activeSection === 'viewTickets') {
      fetchTickets();
      setDescription('');
      setSelectedTicket(null);
      const toolbars = document.querySelectorAll('.ql-toolbar');
      toolbars.forEach((toolbar) => toolbar.remove());
    }
  
    if (activeSection === 'addTicket') {
      // Resetează doar la trecerea în `addTicket`
      if (selectedTicket !== null) setSelectedTicket(null); // Evită apeluri multiple
      setTitle('');
      setDescription('');
      setImage(null);
      setPredictions([]);
      setTicketOdd(1);
      setTicketStatus('waiting');
      setTicketDate(new Date());
    }
  
    if (activeSection === 'editTicket' && selectedTicket) {
      setTitle(selectedTicket.title);
      setDescription(selectedTicket.description);
      setImage(selectedTicket.image);
      setPredictions(selectedTicket.predictions || []);
      setTicketOdd(selectedTicket.ticket_odd);
      setTicketStatus(selectedTicket.ticket_status);
    }
  
    if (activeSection === 'addPrediction') {
      const toolbars = document.querySelectorAll('.ql-toolbar');
      toolbars.forEach((toolbar) => toolbar.remove());
    }
  }, [activeSection, selectedTicket]);
  



  const fetchTickets = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/biletul-zilei`);
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setTitle(ticket.title);
    setDescription(ticket.description);
    setImage(ticket.image);
    setPredictions(ticket.predictions || []);
    setTicketOdd(ticket.ticket_odd);
    setTicketStatus(ticket.ticket_status);
    setActiveSection('editTicket');
  };

  const handleAddPrediction = () => {
    const toolbars = document.querySelectorAll('.ql-toolbar');
    toolbars.forEach((toolbar) => toolbar.remove());
    setPredictions([...predictions, { date_time: new Date(), team1: '', team2: '', prediction: '', odd: '' }]);
  };

  const handlePredictionChange = (index, field, value) => {
    const updatedPredictions = [...predictions];
    updatedPredictions[index][field] = value;
    setPredictions(updatedPredictions);

    const newTicketOdd = updatedPredictions.reduce((total, p) => total * (p.odd || 1), 1);
    setTicketOdd(newTicketOdd.toFixed(2));
  };

  const handleRemovePrediction = (index) => {
    const updatedPredictions = predictions.filter((_, i) => i !== index);
    setPredictions(updatedPredictions);

    const newTicketOdd = updatedPredictions.reduce((total, p) => total * (p.odd || 1), 1);
    setTicketOdd(newTicketOdd.toFixed(2));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handlePublishTicket = async () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('ticket_odd', ticketOdd);
    formData.append('ticket_status', ticketStatus);
    formData.append('image', image);
    formData.append('predictions', JSON.stringify(predictions));
    formData.append('ticket_date', ticketDate.toISOString());
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/publish-ticket`, {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert('Ticket published successfully!');
        setTitle('');
        setDescription('');
        setImage(null);
        setPredictions([]);
        setTicketOdd(1);
        setTicketStatus('waiting');
        const toolbars = document.querySelectorAll('.ql-toolbar');
        toolbars.forEach((toolbar) => toolbar.remove()); // Remove all toolbars
      } else {
        alert('Failed to publish ticket.');
      }
    } catch (error) {
      console.error('Error publishing ticket:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <div className="bg-gray-200 p-4 w-full md:w-1/4 md:h-full">
        <h2 className="font-bold text-lg mb-4">Admin Menu</h2>
        <button onClick={() => {
          setActiveSection('addPrediction');
        }} className="w-full p-2 mb-2 bg-blue-500 text-white rounded">
          Add Prediction
        </button>
        <button onClick={() => {
          setActiveSection('addTicket');
        }} className="w-full p-2 mb-2 bg-blue-500 text-white rounded">
          Add Ticket
        </button>
        <button onClick={() => {
          setActiveSection('viewTickets'); const toolbars = document.querySelectorAll('.ql-toolbar');
          toolbars.forEach((toolbar) => toolbar.remove());
        }} className="w-full p-2 bg-blue-500 text-white rounded">
          Edit Tickets
        </button>
      </div>

      <div className="w-3/4 p-4">
        {activeSection === 'addPrediction' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Add Prediction</h2>
            {competitions.map(competition => (
              <Competition key={competition.name} competition={competition} />
            ))}
          </>
        )}
        {activeSection === 'addTicket' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Create Ticket</h2>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 mb-4 w-full" />
            {/* <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 mb-4 w-full" /> */}
            <RichTextEditor description={description} setDescription={setDescription} />
            <input type="file" onChange={handleImageChange} className="border p-2 mb-4 w-full" />
            <DatePicker
              selected={ticketDate}
              onChange={(date) => setTicketDate(date)}
              dateFormat="Pp"
              className="border p-2 mb-4 w-full"
              placeholderText="Select Ticket Date"
            />
            <h3 className="text-xl font-bold mb-4">Predictions</h3>
            {predictions.map((prediction, index) => (
              <div key={index} className="border p-4 rounded mb-4">
                <DatePicker
                  selected={prediction.date_time}
                  onChange={(date) => handlePredictionChange(index, 'date_time', date)}
                  showTimeSelect
                  dateFormat="Pp" />
                <input type="text" placeholder="Team 1" value={prediction.team1} onChange={(e) => handlePredictionChange(index, 'team1', e.target.value)} className="border p-2 mb-2 w-full" />
                <input type="text" placeholder="Team 2" value={prediction.team2} onChange={(e) => handlePredictionChange(index, 'team2', e.target.value)} className="border p-2 mb-2 w-full" />
                <input type="text" placeholder="Prediction" value={prediction.prediction} onChange={(e) => handlePredictionChange(index, 'prediction', e.target.value)} className="border p-2 mb-2 w-full" />
                <input type="number" placeholder="Odd" value={prediction.odd} onChange={(e) => handlePredictionChange(index, 'odd', parseFloat(e.target.value))} className="border p-2 mb-2 w-full" />
                <button onClick={() => handleRemovePrediction(index)} className="bg-red-500 text-white p-2 mt-2 rounded">Remove Prediction</button>
              </div>
            ))}
            <button onClick={handleAddPrediction} className="bg-blue-500 text-white p-2 rounded">Add Prediction</button>
            <p className="mt-4"><strong>Ticket Odd:</strong> {ticketOdd}</p>
            <select value={ticketStatus} onChange={(e) => setTicketStatus(e.target.value)} className="border p-2 mb-4 w-full">
              <option value="win">Win</option>
              <option value="lost">Lost</option>
              <option value="waiting">Waiting</option>
            </select>
            <button onClick={handlePublishTicket} className="bg-green-500 text-white p-2 rounded">Publish Ticket</button>
          </>
        )}

        {activeSection === 'viewTickets' && (
          <>
            <h2 className="text-2xl font-bold mb-4">Tickets</h2>
            <div className="space-y-4">
              {tickets.map(ticket => (
                <div key={ticket.id} className="border p-4 rounded shadow-lg hover:bg-gray-100 cursor-pointer" onClick={() => handleEditTicket(ticket)}>
                  <h3 className="font-bold">{ticket.title}</h3>
                  <p>{ticket.description}</p>
                  <p><strong>Status:</strong> {ticket.ticket_status}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {activeSection === 'editTicket' && selectedTicket && (
          <>
            <h2 className="text-2xl font-bold mb-4">Edit Ticket: {selectedTicket.title}</h2>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 mb-4 w-full" />
            {/* <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                e.target.style.height = "auto"; // Reset the height
                e.target.style.height = `${e.target.scrollHeight}px`; // Set it to the scroll height
              }}
              rows="10"
              className="border p-2 mb-4 w-full"
            /> */}

            <RichTextEditor description={description} setDescription={setDescription} />

            {selectedTicket.image && (
              <div className="mb-4">
                <p>Current Image:</p>
                <img src={`${process.env.REACT_APP_API_URL}${selectedTicket.image}`} alt="Current Ticket Image" className="w-full h-64 object-contain rounded" />
              </div>
            )}

            {/* Input pentru a încărca o nouă imagine */}
            <input type="file" onChange={handleImageChange} className="border p-2 mb-4 w-full" />

            <h3 className="text-xl font-bold mb-4">Predictions</h3>
            {predictions.map((prediction, index) => (
              <div key={index} className="border p-4 rounded mb-4">
                <DatePicker
                  selected={prediction.date_time ? new Date(prediction.date_time) : null}
                  onChange={(date) => handlePredictionChange(index, 'date_time', date)}
                  showTimeSelect
                  timeIntervals={15}
                  timeFormat="HH:mm"
                  dateFormat="Pp"
                  className="border p-2 mb-2 w-full" />
                <input type="text" placeholder="Team 1" value={prediction.team1} onChange={(e) => handlePredictionChange(index, 'team1', e.target.value)} className="border p-2 mb-2 w-full" />
                <input type="text" placeholder="Team 2" value={prediction.team2} onChange={(e) => handlePredictionChange(index, 'team2', e.target.value)} className="border p-2 mb-2 w-full" />
                <input type="text" placeholder="Prediction" value={prediction.prediction} onChange={(e) => handlePredictionChange(index, 'prediction', e.target.value)} className="border p-2 mb-2 w-full" />
                <input type="number" placeholder="Odd" value={prediction.odd} onChange={(e) => handlePredictionChange(index, 'odd', parseFloat(e.target.value))} className="border p-2 mb-2 w-full" />
                <button onClick={() => handleRemovePrediction(index)} className="bg-red-500 text-white p-2 mt-2 rounded">Remove Prediction</button>
              </div>
            ))}
            <button onClick={handleAddPrediction} className="bg-blue-500 text-white p-2 rounded">Add Prediction</button>
            <p className="mt-4"><strong>Ticket Odd:</strong> {ticketOdd}</p>
            <select value={ticketStatus} onChange={(e) => setTicketStatus(e.target.value)} className="border p-2 mb-4 w-full">
              <option value="win">Win</option>
              <option value="lost">Lost</option>
              <option value="waiting">Waiting</option>
            </select>
            <button onClick={handlePublishTicket} className="bg-green-500 text-white p-2 rounded">Update Ticket</button>
          </>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
