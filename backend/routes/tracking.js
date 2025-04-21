const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyTokenOptional } = require('../middleware/auth');

// Function to get IP info from ip-api.com
async function getIpInfo(ip) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,currency,isp,org,as,mobile,proxy,hosting,query`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching IP info:', error);
    return null;
  }
}

// Record or update user session with browser and IP info
router.post('/session', verifyTokenOptional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { browser, userAgent, ip } = req.body;

    if (!browser || !userAgent || !ip) {
      return res.status(400).json({ message: 'Browser, userAgent and IP are required' });
    }

    // Get detailed IP info
    const ipInfo = await getIpInfo(ip);
    // console.log('Location Info:', ipInfo);

    if (ipInfo && ipInfo.status === 'success') {
      // Update visitor_countries table with basic info
      await db.query(`
        INSERT INTO visitor_countries 
        (ip_address, country_code, country_name, region, region_name, city, timezone, isp, visit_count, first_visit, last_visit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          country_code = VALUES(country_code),
          country_name = VALUES(country_name),
          region = VALUES(region),
          region_name = VALUES(region_name),
          city = VALUES(city),
          timezone = VALUES(timezone),
          isp = VALUES(isp),
          visit_count = visit_count + 1,
          last_visit = NOW()
      `, [
        ip,
        ipInfo.countryCode,
        ipInfo.country,
        ipInfo.region,
        ipInfo.regionName,
        ipInfo.city,
        ipInfo.timezone,
        ipInfo.isp
      ]);
    }

    // Insert or update session record
    await db.query(`
      INSERT INTO user_sessions (userId, browser, userAgent, lastActive)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        browser = VALUES(browser),
        userAgent = VALUES(userAgent),
        lastActive = NOW()
    `, [userId, browser, userAgent]);

    res.json({ 
      message: 'Session recorded',
      ip: ip,
      location: ipInfo
    });
  } catch (error) {
    console.error('Error recording session:', error);
    res.status(500).json({ message: 'Error recording session', error: error.message });
  }
});

// Get visitor country statistics with percentages
router.get('/country-stats', async (req, res) => {
  try {
    // First get total visits across all countries
    const [totalResult] = await db.query(`
      SELECT SUM(visit_count) as total_visits
      FROM visitor_countries
    `);
    const totalVisits = totalResult[0].total_visits || 0;

    // Then get per-country statistics with percentage
    const [stats] = await db.query(`
      SELECT 
        country_name,
        SUM(visit_count) as visits,
        (SUM(visit_count) / ${totalVisits} * 100) as percentage
      FROM visitor_countries
      GROUP BY country_name
      ORDER BY visits DESC
    `);
    
    // Format percentages to 2 decimal places
    const formattedStats = stats.map(stat => ({
      country_name: stat.country_name || 'Unknown',
      percentage: Number(stat.percentage).toFixed(2)
    }));
    
    res.json(formattedStats);
  } catch (error) {
    console.error('Error fetching country stats:', error);
    res.status(500).json({ message: 'Error fetching country statistics', error: error.message });
  }
});

// Record page view
router.post('/pageview', verifyTokenOptional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Check if this page view already exists in the same second
    const [existing] = await db.query(`
      SELECT * FROM page_views 
      WHERE userId = ? AND page_url = ? 
        AND ABS(TIMESTAMPDIFF(SECOND, viewedAt, NOW())) < 2
    `, [userId, url]);

    if (existing.length === 0) {
      await db.query(`
        INSERT INTO page_views (userId, page_url, viewedAt)
        VALUES (?, ?, NOW())
      `, [userId, url]);
    }

    res.json({ message: 'Page view recorded (or skipped duplicate)' });
  } catch (error) {
    console.error('Error recording page view:', error);
    res.status(500).json({ message: 'Error recording page view', error: error.message });
  }
});

module.exports = router;
