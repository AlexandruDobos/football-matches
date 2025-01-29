const fs = require('fs');
const readline = require('readline');

const inputFile = 'competitions_and_countries.txt';
const outputFile = 'organized_competitions_by_country.txt';

const organizeCompetitions = async () => {
    const competitionsByCountry = {};

    const rl = readline.createInterface({
        input: fs.createReadStream(inputFile),
        output: process.stdout,
        terminal: false
    });

    for await (const line of rl) {
        const match = line.match(/Competition: (.+), Country: (.+)/);
        if (match) {
            const [_, competition, country] = match;
            if (!competitionsByCountry[country]) {
                competitionsByCountry[country] = [];
            }
            competitionsByCountry[country].push(competition);
        }
    }

    const output = Object.entries(competitionsByCountry)
        .map(([country, competitions]) => `${country}\n${competitions.map(c => `  - ${c}`).join('\n')}`)
        .join('\n\n');

    fs.writeFileSync(outputFile, output, 'utf-8');
    console.log(`Competitions organized by country saved to ${outputFile}`);
};

organizeCompetitions();
