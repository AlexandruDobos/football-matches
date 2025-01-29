const axios = require('axios');
const fs = require('fs');

// Configurează cheia ta API și endpoint-ul
const API_KEY = process.env.RAPIDAPI_KEY;
const API_HOST = 'https://v3.football.api-sports.io';
const ENDPOINT = '/leagues';

require('dotenv').config();

const fetchLeagues = async () => {
    try {
        const response = await axios.get(`${API_HOST}${ENDPOINT}`, {
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
            }
        });

        const leagues = response.data.response;
        let output = '';

        // Extrage numele competiției și țara
        leagues.forEach(league => {
            const leagueName = league.league.name;
            const countryName = league.country.name;
            output += `Competition: ${leagueName}, Country: ${countryName}\n`;
        });

        // Salvează într-un fișier .txt
        fs.writeFileSync('competitions_and_countries.txt', output);
        console.log('Fișierul competitions_and_countries.txt a fost creat cu succes!');
    } catch (error) {
        console.error('Eroare la obținerea datelor din API:', error);
    }
};

fetchLeagues();
