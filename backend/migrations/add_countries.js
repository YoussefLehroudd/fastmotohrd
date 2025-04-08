const db = require('../db');

async function addCountriesTable() {
  try {
    // Create countries table
    await db.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10) NOT NULL,
        flag VARCHAR(10) NOT NULL
      )
    `);

    // Insert countries data
    const countries = [
      { name: 'Canada', code: '+1', flag: '🇨🇦' },
      { name: 'United States', code: '+1', flag: '🇺🇸' },
      { name: 'Egypt', code: '+20', flag: '🇪🇬' },
      { name: 'South Africa', code: '+27', flag: '🇿🇦' },
      { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
      { name: 'Belgium', code: '+32', flag: '🇧🇪' },
      { name: 'France', code: '+33', flag: '🇫🇷' },
      { name: 'Spain', code: '+34', flag: '🇪🇸' },
      { name: 'Italy', code: '+39', flag: '🇮🇹' },
      { name: 'Switzerland', code: '+41', flag: '🇨🇭' },
      { name: 'Austria', code: '+43', flag: '🇦🇹' },
      { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
      { name: 'Denmark', code: '+45', flag: '🇩🇰' },
      { name: 'Sweden', code: '+46', flag: '🇸🇪' },
      { name: 'Norway', code: '+47', flag: '🇳🇴' },
      { name: 'Germany', code: '+49', flag: '🇩🇪' },
      { name: 'Peru', code: '+51', flag: '🇵🇪' },
      { name: 'Mexico', code: '+52', flag: '🇲🇽' },
      { name: 'Argentina', code: '+54', flag: '🇦🇷' },
      { name: 'Brazil', code: '+55', flag: '🇧🇷' },
      { name: 'Chile', code: '+56', flag: '🇨🇱' },
      { name: 'Colombia', code: '+57', flag: '🇨🇴' },
      { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
      { name: 'Australia', code: '+61', flag: '🇦🇺' },
      { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
      { name: 'Philippines', code: '+63', flag: '🇵🇭' },
      { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
      { name: 'Singapore', code: '+65', flag: '🇸🇬' },
      { name: 'Thailand', code: '+66', flag: '🇹🇭' },
      { name: 'Japan', code: '+81', flag: '🇯🇵' },
      { name: 'South Korea', code: '+82', flag: '🇰🇷' },
      { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
      { name: 'China', code: '+86', flag: '🇨🇳' },
      { name: 'India', code: '+91', flag: '🇮🇳' },
      { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
      { name: 'Morocco', code: '+212', flag: '🇲🇦' },
      { name: 'Algeria', code: '+213', flag: '🇩🇿' },
      { name: 'Tunisia', code: '+216', flag: '🇹🇳' },
      { name: 'Libya', code: '+218', flag: '🇱🇾' },
      { name: 'Nigeria', code: '+234', flag: '🇳🇬' }
    ];

    // Clear existing data
    await db.query('DELETE FROM countries');
    
    // Insert all countries with IGNORE to prevent duplicates
    for (const country of countries) {
      await db.query(
        'INSERT IGNORE INTO countries (name, code, flag) VALUES (?, ?, ?)',
        [country.name, country.code, country.flag]
      );
    }

    console.log('Successfully added countries table and data');
  } catch (error) {
    console.error('Error adding countries:', error);
    throw error;
  }
}

addCountriesTable().catch(console.error);
