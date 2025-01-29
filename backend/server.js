const express = require('express');
const mysql = require('mysql2');
const axios = require('axios');
const app = express();
const port = 3000;
const cors = require('cors');
const cron = require('node-cron');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname); // extrage extensia fișierului
        cb(null, file.fieldname + '-' + uniqueSuffix + extension); // adaugă extensia originală la nume
    }
});

const upload = multer({ storage: storage });

app.use(cors());
const { DateTime } = require('luxon');
const path = require('path');
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

require('dotenv').config();


const convertToRomanianTime = (dateString) => {
    return DateTime.fromISO(dateString, { zone: 'utc' })
        .setZone('Europe/Bucharest')
        .toJSDate(); // Returnează ca obiect Date
};

const allowedCompetitions = {
    World: ['World Cup', 'UEFA Champions League', 'UEFA Europa League', 'CONCACAF Gold Cup', 'Copa America', 'UEFA Super Cup', 'Friendlies', 'UEFA U21 Championship', 'UEFA Nations League', 'World Cup - Qualification Europe', 'World Cup - Qualification South America', 'UEFA Europa Conference League', 'Emirates Cup', 'UEFA U21 Championship - Qualification',],
    France: ['Ligue 1', 'Ligue 2', 'Coupe de France', 'Coupe de la Ligue'],
    Belgium: ['Jupiler Pro League', 'Super Cup', 'Cup'],
    Romania: ['Cupa României', 'Superliga', 'Liga I', 'Liga II', 'Supercupa'],
    England: ['Premier League', 'Championship', 'FA Cup'],
    Germany: ['Bundesliga', '2. Bundesliga', 'Super Cup', 'DFB Pokal'],
    Italy: ['Serie A', 'Super Cup', 'Serie B', 'Coppa Italia'],
    Netherlands: ['Eredivisie', 'Super Cup', 'KNVB Beker'],
    Portugal: ['Primeira Liga', 'Super Cup', 'Taça de Portugal'],
    Spain: ['La Liga', 'Super Cup', 'Segunda División', 'Copa del Rey'],
    Scotland: ['Premiership', 'FA Cup'],
    Ukraine: ['Premier League'],
    Turkey: ['Süper Lig', 'Cup', 'Super Cup'],
    Greece: ['Super League 1'],
    Austria: ['Bundesliga'],
    Denmark: ['Superliga'],
    Sweden: ['Allsvenskan'],
    Norway: ['Eliteserien', 'Super Cup'],
    Switzerland: ['Super League'],
    Croatia: ['HNL'],
    Bulgaria: ['First League'],
    Serbia: ['Super Liga', 'Cup'],
    Poland: ['Ekstraklasa'],

    // Adaugă alte țări și competiții după cum este necesar
};


// Configurarea conexiunii la baza de date
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Connecting to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');

    // Create the `matches` table
    const createMatchesTableQuery = `
        CREATE TABLE IF NOT EXISTS matches (
            id INT PRIMARY KEY,
            league_name VARCHAR(255),
            league_logo VARCHAR(255),
            league_round VARCHAR(50),
            country VARCHAR(255),
            match_date DATETIME,
            home_team VARCHAR(255),
            home_logo VARCHAR(255),
            away_team VARCHAR(255),
            away_logo VARCHAR(255),
            match_description TEXT,
            final_result VARCHAR(10),
            status ENUM('scheduled', 'finished', 'NS', 'FT', 'HT', 'LIVE', 'CANC', 'PST', 'SUSP', 'INT', 'ABD', 'AWD', 'WO', '1H', '2H', 'ET', 'PEN', 'AET') DEFAULT 'NS',
            match_image VARCHAR(255),
            prediction VARCHAR(255) NULL,
            odd_prediction DECIMAL(4, 2) NULL
        ) CHARSET=utf8mb4;
    `;
    db.query(createMatchesTableQuery, (err, result) => {
        if (err) {
            console.error('Error creating `matches` table:', err);
            return;
        }
        console.log('Table `matches` is ready');
    });

    // Create the `tickets` table
    const createTicketsTableQuery = `
        CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            ticket_date DATETIME,
            description TEXT,
            image VARCHAR(255),
            ticket_odd DECIMAL(5, 2),
            ticket_status ENUM('win', 'lost', 'waiting') DEFAULT 'waiting'
        );
    `;
    db.query(createTicketsTableQuery, (err) => {
        if (err) console.error('Error creating `tickets` table:', err);
        else console.log('Table `tickets` is ready');
    });

    // Create the `predictions` table with all required columns
    const createPredictionsTableQuery = `
        CREATE TABLE IF NOT EXISTS predictions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT,
            date_time DATETIME,
            team1 VARCHAR(255),
            team2 VARCHAR(255),
            prediction VARCHAR(255),
            odd DECIMAL(4, 2),
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
        );
    `;
    db.query(createPredictionsTableQuery, (err) => {
        if (err) console.error('Error creating `predictions` table:', err);
        else console.log('Table `predictions` is ready');
    });

    // Create the `ticket_predictions` table to handle the many-to-many relationship
    const createTicketPredictionsTableQuery = `
        CREATE TABLE IF NOT EXISTS ticket_predictions (
            ticket_id INT NOT NULL,
            prediction_id INT NOT NULL,
            FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
            FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE,
            PRIMARY KEY (ticket_id, prediction_id)
        ) ENGINE=InnoDB;
    `;
    db.query(createTicketPredictionsTableQuery, (err) => {
        if (err) console.error('Error creating `ticket_predictions` table:', err);
        else console.log('Table `ticket_predictions` is ready');
    });

    // Create the `administrators` table
    const createAdministratorsTableQuery = `
        CREATE TABLE IF NOT EXISTS administrators (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE,
            password VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        );
    `;
    db.query(createAdministratorsTableQuery, (err) => {
        if (err) console.error('Error creating `administrators` table:', err);
        else console.log('Table `administrators` is ready');
    });
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM administrators WHERE username = ? AND password = ?`;
    db.query(query, [username, password], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
        } else if (results.length > 0) {
            const admin = results[0];
            db.query(`UPDATE administrators SET last_login = NOW() WHERE id = ?`, [admin.id]);
            res.status(200).json({ message: 'Authenticated successfully', adminId: admin.id });
        } else {
            res.status(401).json({ message: 'Authentication failed' });
        }
    });
});

const headers = {
    'X-RapidAPI-Host': process.env.RAPIDAPI_HOST,
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY
};

// Ruta pentru a prelua și insera datele de la API în baza de date
// Funcția de salvare a meciurilor
const saveMatches = async () => {
    try {
        const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
            headers: headers,
            params: { date: new Date().toISOString().split('T')[0] } // Data de azi
        });

        const matches = response.data.response.filter(match =>
            allowedCompetitions[match.league.country]?.includes(match.league.name)
        );

        const insertQuery = `
            INSERT INTO matches (id, league_name, league_logo, league_round, country, match_date, home_team, home_logo, away_team, away_logo, match_description, final_result, status, match_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            league_name = VALUES(league_name),
            league_logo = VALUES(league_logo),
            league_round = VALUES(league_round),
            country = VALUES(country),
            match_date = VALUES(match_date),
            home_team = VALUES(home_team),
            home_logo = VALUES(home_logo),
            away_team = VALUES(away_team),
            away_logo = VALUES(away_logo),
            final_result = VALUES(final_result),
            status = VALUES(status)
        `;

        for (const match of matches) {
            const romaniaDate = convertToRomanianTime(match.fixture.date); // Conversie la ora României
            const matchData = [
                match.fixture.id,
                match.league.name,
                match.league.logo,
                match.league.round,
                match.league.country,
                romaniaDate,
                match.teams.home.name,
                match.teams.home.logo,
                match.teams.away.name,
                match.teams.away.logo,
                "", // match_description
                match.score.fulltime.home + "-" + match.score.fulltime.away,
                match.fixture.status.short,
                "" // match_image
            ];

            db.query(insertQuery, matchData, (err) => {
                if (err) console.error('Error inserting match data:', err);
            });
        }

        console.log("Matches saved successfully!");
    } catch (error) {
        console.error('Error fetching matches from API:', error);
    }
};


// Ruta pentru a obține meciurile din baza de date
app.get('/api/matches', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const allowedConditions = Object.entries(allowedCompetitions)
        .map(([country, leagues]) =>
            `(${leagues.map(name => `(league_name = '${name}' AND country = '${country}')`).join(' OR ')})`
        )
        .join(' OR ');

    const query = `
        SELECT id, match_description, match_image, prediction, odd_prediction, league_name, league_logo, league_round, country, match_date, home_team, home_logo, away_team, away_logo, final_result, status 
        FROM matches
        WHERE (${allowedConditions}) AND DATE(match_date) = ?
        ORDER BY country, league_name, match_date;
    `;

    db.query(query, [today], (err, results) => {
        if (err) {
            console.error('Error fetching match data:', err);
            res.status(500).json({ error: 'Failed to fetch matches' });
            return;
        }

        const competitions = results.reduce((acc, match) => {
            const key = `${match.country}-${match.league_name}`;
            if (!acc[key]) {
                acc[key] = {
                    country: match.country,
                    name: match.league_name,
                    logo: match.league_logo,
                    matches: []
                };
            }
            acc[key].matches.push({
                id: match.id,
                round: match.league_round,
                match_date: match.match_date,
                home_team: match.home_team,
                home_logo: match.home_logo,
                away_team: match.away_team,
                away_logo: match.away_logo,
                final_result: match.final_result,
                status: match.status,
                match_description: match.match_description,
                match_image: match.match_image,
                prediction: match.prediction,
                odd_prediction: match.odd_prediction
            });
            return acc;
        }, {});

        res.json(Object.values(competitions));
    });
});

app.post('/api/matches/:id', upload.single('image'), (req, res) => {
    const matchId = req.params.id;
    const { description, prediction, odd } = req.body;
    let imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `
        UPDATE matches SET 
            match_description = ?, 
            prediction = ?, 
            odd_prediction = ?, 
            match_image = COALESCE(?, match_image)
        WHERE id = ?
    `;

    db.query(query, [description, prediction, odd, imagePath, matchId], (err, result) => {
        if (err) {
            console.error('Error updating match:', err);
            res.status(500).json({ error: 'Failed to update match' });
        } else {
            db.query('SELECT * FROM matches WHERE id = ?', [matchId], (err, updatedMatch) => {
                if (err) {
                    res.status(500).json({ error: 'Failed to retrieve updated match' });
                } else {
                    res.status(200).json(updatedMatch[0]);
                }
            });
        }
    });
});


// POST route to publish a ticket
const formatDateForMySQL = (isoDate) => {
    const date = new Date(isoDate);
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

app.post('/api/publish-ticket', upload.single('image'), (req, res) => {
    const { title, description, ticket_odd, ticket_status, ticket_date } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const formattedTicketDate = new Date(ticket_date).toISOString().slice(0, 19).replace('T', ' ');

    // Parse `predictions` as JSON, handling cases where it may not be an array
    let predictions;
    try {
        predictions = JSON.parse(req.body.predictions);
    } catch (error) {
        console.error('Failed to parse predictions:', error);
        return res.status(400).json({ error: 'Invalid predictions format' });
    }

    if (!Array.isArray(predictions)) {
        return res.status(400).json({ error: 'Predictions must be an array' });
    }

    // Insert ticket into tickets table, including the event_date field
    const ticketQuery = `
        INSERT INTO tickets (title, description, image, ticket_odd, ticket_status, ticket_date)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(ticketQuery, [title, description, imagePath, ticket_odd, ticket_status, formattedTicketDate], (err, result) => {
        if (err) {
            console.error('Error inserting ticket:', err);
            res.status(500).json({ error: 'Failed to insert ticket' });
            return;
        }

        const ticketId = result.insertId;

        const predictionPromises = predictions.map(prediction => {
            return new Promise((resolve, reject) => {
                const formattedDate = new Date(prediction.date_time).toISOString().slice(0, 19).replace('T', ' ');

                // Insert prediction into predictions table
                const predictionQuery = `
                    INSERT INTO predictions (ticket_id, date_time, team1, team2, prediction, odd)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                db.query(predictionQuery, [ticketId, formattedDate, prediction.team1, prediction.team2, prediction.prediction, prediction.odd], (err, result) => {
                    if (err) return reject(err);

                    // Insert into ticket_predictions table to link ticket and prediction
                    const predictionId = result.insertId;
                    const linkQuery = `
                        INSERT INTO ticket_predictions (ticket_id, prediction_id)
                        VALUES (?, ?)
                    `;
                    db.query(linkQuery, [ticketId, predictionId], (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });

        Promise.all(predictionPromises)
            .then(() => res.status(201).json({ message: 'Ticket and predictions published successfully' }))
            .catch(error => {
                console.error('Error inserting predictions or linking them:', error);
                res.status(500).json({ error: 'Failed to insert predictions or links' });
            });
    });
});




// Route to get tickets of the day
app.get('/api/biletul-zilei', (req, res) => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Query to fetch tickets and their associated predictions for today
    const query = `
        SELECT t.id AS ticket_id, t.title, t.description, t.image, t.ticket_odd, t.ticket_status, t.ticket_date, 
               p.date_time, p.team1, p.team2, p.prediction, p.odd 
        FROM tickets t
        JOIN predictions p ON t.id = p.ticket_id
        ORDER BY t.ticket_date DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching tickets:', err);
            res.status(500).json({ error: 'Failed to fetch tickets' });
            return;
        }

        // Group predictions by ticket
        const tickets = results.reduce((acc, row) => {
            const { ticket_id, title, description, ticket_odd, image, ticket_status, ticket_date, date_time, team1, team2, prediction, odd } = row;
            if (!acc[ticket_id]) {
                acc[ticket_id] = {
                    id: ticket_id,
                    image: image,
                    title,
                    description,
                    ticket_odd,
                    ticket_status,
                    ticket_date,
                    predictions: []
                };
            }
            acc[ticket_id].predictions.push({
                date_time,
                team1,
                team2,
                prediction,
                odd
            });
            return acc;
        }, {});


        res.json(Object.values(tickets)); // Convert grouped tickets object to an array
    });
});



app.get('/api/biletul-zilei/:ticketId', (req, res) => {
    const ticketId = req.params.ticketId;
  
    const query = `
      SELECT t.id AS ticket_id, t.title, t.description, t.ticket_date, t.image, t.ticket_odd, t.ticket_status, 
             p.date_time, p.team1, p.team2, p.prediction, p.odd 
      FROM tickets t
      JOIN predictions p ON t.id = p.ticket_id
      WHERE t.id = ?
    `;
  
    db.query(query, [ticketId], (err, results) => {
      if (err) {
        console.error('Error fetching ticket details:', err);
        res.status(500).json({ error: 'Failed to fetch ticket details' });
        return;
      }
  
      if (results.length === 0) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }
  
      const ticket = {
        id: results[0].ticket_id,
        title: results[0].title,
        description: results[0].description,
        image: results[0].image,
        ticket_odd: results[0].ticket_odd,
        ticket_date: results[0].ticket_date,
        ticket_status: results[0].ticket_status,
        predictions: results.map(row => ({
          date_time: row.date_time,
          team1: row.team1,
          team2: row.team2,
          prediction: row.prediction,
          odd: row.odd
        }))
      };
  
      res.json(ticket);
    });
  });
  


// Programare sarcină zilnică la 00:00
saveMatches();
cron.schedule('0 0 * * *', saveMatches);

// Pornește serverul
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
