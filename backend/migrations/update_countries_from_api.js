const fetch = require('node-fetch');
const db = require('../db');

async function updateCountriesFromAPI() {
  try {
    console.log('Clearing existing countries table...');
    // Clear existing data first
    await db.query('DELETE FROM countries');
    await db.query('ALTER TABLE countries AUTO_INCREMENT = 1');
    console.log('Countries table cleared successfully');

    // Add required columns if they don't exist
    await db.query(`
      ALTER TABLE countries 
      ADD COLUMN IF NOT EXISTS flag_image VARCHAR(255) AFTER flag,
      ADD COLUMN IF NOT EXISTS code VARCHAR(10) AFTER name
    `);

    // Fetch data using node-fetch with v2 API
    console.log('Fetching countries from API...');
    const response = await fetch('https://restcountries.com/v2/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const countries = await response.json();
    console.log(`Fetched ${countries.length} countries`);
    
    // Process and insert each country
    let count = 0;
    for (const country of countries) {
      const name = country.name;
      // Get the flag emoji from the country code (ISO 3166-1 alpha-2)
      const flagEmoji = country.alpha2Code ? getFlagEmoji(country.alpha2Code) : '';
      const flagImage = country.flags?.png || '';
      // Get calling code if available
      const code = country.callingCodes && country.callingCodes[0] 
        ? '+' + country.callingCodes[0] 
        : '+0';

      await db.query(
        'INSERT INTO countries (name, code, flag, flag_image) VALUES (?, ?, ?, ?)',
        [name, code, flagEmoji, flagImage]
      );
      
      count++;
      if (count % 10 === 0) {
        console.log(`Processed ${count}/${countries.length} countries`);
      }
    }

    console.log('Countries updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Function to convert country code to flag emoji
function getFlagEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

updateCountriesFromAPI();
