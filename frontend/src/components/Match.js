import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateMatch } from '../redux/competitionSlice';

const Match = ({ match, showEditButton }) => {
  const [showPrediction, setShowPrediction] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(match.match_description || '');
  const [prediction, setPrediction] = useState(match.prediction || '');
  const [odd, setOdd] = useState(match.odd_prediction || '');
  const [image, setImage] = useState(match.match_image || null);
  const dispatch = useDispatch();
  const matchDate = new Date(match.match_date);

  const formattedTime = matchDate.toLocaleTimeString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleEditClick = () => {
    setDescription(match.match_description || '');
    setPrediction(match.prediction || '');
    setOdd(match.odd_prediction || '');
    setImage(match.match_image || null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('prediction', prediction);
    formData.append('odd', odd);
    if (image instanceof File) formData.append('image', image);

    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/matches/${match.id}`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const updatedMatch = await response.json();
      dispatch(updateMatch({ updatedMatch }));
      setImage(updatedMatch.match_image);
      setIsEditing(false);
    } else {
      alert('Eroare la salvarea datelor');
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', marginBottom: '16px', width: '100%', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center', marginTop: '8px', color: '#6b7280' }}>
          <p>{formattedTime}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '33%' }}>
          <img
            src={match.home_logo}
            alt={`${match.home_team} Logo`}
            className="w-16 h-16 md:w-12 md:h-12 sm:w-10 sm:h-10"
          />
          <h3 className="font-bold mt-2 text-lg md:text-base sm:text-sm">{match.home_team}</h3>
        </div>
        <span className="text-lg font-bold text-gray-700 w-1/3 text-center md:text-base sm:text-sm">vs</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '33%' }}>
          <img
            src={match.away_logo}
            alt={`${match.away_team} Logo`}
            className="w-16 h-16 md:w-12 md:h-12 sm:w-10 sm:h-10"
          />
          <h3 className="font-bold mt-2 text-lg md:text-base sm:text-sm">{match.away_team}</h3>
        </div>
      </div>

      <button
        onClick={() => setShowPrediction(!showPrediction)}
        className="mt-4 mx-auto bg-yellow-400 text-black font-bold py-2 px-4 rounded text-center block"
      >
        {showPrediction ? 'Ascunde predicția' : 'Vezi predicția'}
      </button>
      
      {showPrediction && (
        <div style={{ marginTop: '8px', color: '#374151' }}>
          {image && (
            <img
            src={`${process.env.REACT_APP_API_URL}${match.match_image}`}
              alt="Imagine meci"
              style={{ width: '100%', height: 'auto', marginTop: '16px', borderRadius: '8px' }}
            />
          )}
          <div style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '8px', marginBottom: '8px' }}>
            <p><strong>Descriere:</strong></p>
            <p style={{ paddingTop: '8px', paddingBottom: '8px' }}>{match.match_description}</p>
            <p><strong>Predicție:</strong> {match.prediction}</p>
            <p><strong>Cotă:</strong> {match.odd_prediction}</p>
          </div>
        </div>
      )}

      {showEditButton && (
        <button onClick={handleEditClick} className="bg-yellow-500 text-white font-bold py-1 px-3 rounded mt-2">
          Edit
        </button>
      )}
      
      {isEditing && (
        <div className="mt-6 p-4 border rounded">
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full mb-2 p-2 border rounded" />
          <input type="text" placeholder="Prediction" value={prediction} onChange={(e) => setPrediction(e.target.value)} className="w-full mb-2 p-2 border rounded" />
          <input type="number" step="0.01" placeholder="Odd" value={odd} onChange={(e) => setOdd(e.target.value)} className="w-full mb-2 p-2 border rounded" />

          {image && !(image instanceof File) && (
            <div style={{ marginBottom: '8px' }}>
              <img src={`${process.env.REACT_APP_API_URL}${image}`} alt="Imagine existentă" style={{ width: '100px', height: 'auto', marginBottom: '8px' }} />
            </div>
          )}

          <input type="file" onChange={(e) => setImage(e.target.files[0])} className="w-full mb-2" />
          <button onClick={handleSave} className="p-2 bg-green-500 text-white rounded">Save</button>
        </div>
      )}
    </div>
  );
};

export default Match;
