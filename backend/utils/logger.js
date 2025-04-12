const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'otp_log.txt');

const logOTPState = (email, state) => {
    const logMessage = `${new Date().toISOString()} - Email: ${email}, OTP State: ${JSON.stringify(state)}\n`;
    fs.appendFileSync(logFilePath, logMessage, { encoding: 'utf8' });
};

module.exports = { logOTPState };
