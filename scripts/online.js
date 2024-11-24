const { spawn } = require('child_process');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Create log file stream with timestamp in filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logStream = fs.createWriteStream(path.join(logsDir, `serveo-${timestamp}.log`));

// Helper function to log both to console and file
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    // Log to file
    logStream.write(logMessage + '\n');
    
    // Log to console with colors
    switch(type) {
        case 'error':
            console.error('\x1b[31m%s\x1b[0m', logMessage); // Red
            break;
        case 'success':
            console.log('\x1b[32m%s\x1b[0m', logMessage); // Green
            break;
        case 'info':
            console.log('\x1b[36m%s\x1b[0m', logMessage); // Cyan
            break;
        default:
            console.log(logMessage);
    }
}

// Start SSH tunnel
log('Starting SSH tunnel to serveo.net...');
const sshProcess = spawn('ssh', ['-R', '80:localhost:80', 'serveo.net']);

// Handle SSH output
sshProcess.stdout.on('data', async (data) => {
    const output = data.toString();
    log(output.trim());
    
    // Look for the Forwarding line that contains the URL
    if (output.includes('Forwarding')) {
        const url = output.match(/https?:\/\/[^\s]+/)[0];
        log(`Public URL: ${url}`, 'success');

        try {
            // Generate QR code in terminal
            log('Generating QR code...');
            const qr = await QRCode.toString(url, {type: 'terminal'});
            console.log(qr);

            // Save QR code as image
            await QRCode.toFile('./public/current-url-qr.png', url);
            log('QR code image saved as: public/current-url-qr.png', 'success');
        } catch (err) {
            log(`Error generating QR code: ${err}`, 'error');
        }
    }
});

// Handle SSH errors
sshProcess.stderr.on('data', (data) => {
    log(data.toString().trim(), 'error');
});

// Handle SSH process exit
sshProcess.on('close', (code) => {
    log(`SSH tunnel closed with code ${code}`, 'error');
    logStream.end();
});

// Handle cleanup on exit
process.on('SIGINT', () => {
    log('Shutting down SSH tunnel...', 'info');
    sshProcess.kill();
    logStream.end();
    process.exit();
});