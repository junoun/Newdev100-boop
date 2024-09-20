const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios'); // Ensure axios is installed

const app = express();
const port = 3000;

// Middleware setup
app.use(express.static('public'));
app.use('/items', express.static(path.join(__dirname, 'items'))); // Serve items from the items folder
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

// Discord webhook URL
const webhookURL = 'https://discord.com/api/webhooks/1286465461315436554/ObMLPm3fSB0EaBxvwK4a-3gP4Cc5RcBTvqV9JGuCNZhvRXMqFe5kNfmiRkVfdKIPSy4P'; // Replace with your actual webhook URL

// Middleware to check for login cookie
app.use((req, res, next) => {
    const cookies = req.cookies;
    if (req.path.startsWith('/dashboard') && !cookies.login) {
        return res.redirect('/login.html'); // Redirect to login if no cookie
    }
    next();
});

// Serve login.html
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve logout.html
app.get('/logout.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logout.html'));
});

// Serve home.html (dashboard)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Upload endpoint
app.post('/upload', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const file = req.files.file; // The uploaded file
    const uploadPath = path.join(__dirname, 'items', file.name); // Save using the original file name

    file.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        // Send webhook notification with file size
        sendWebhookNotification('File Uploaded', `File: ${file.name} (${(file.size / 1024).toFixed(2)} KB) has been uploaded.`);
        res.send('File uploaded!'); // Success message
    });
});

// Function to send a message to Discord webhook
function sendWebhookNotification(title, description) {
    const payload = {
        embeds: [{
            title: title,
            description: description,
            color: 7506394 // Optional: color for the embed
        }]
    };

    axios.post(webhookURL, payload)
        .then(response => {
            console.log('Webhook sent successfully:', response.data);
        })
        .catch(error => {
            console.error('Error sending webhook:', error);
        });
}

// List files endpoint
app.get('/files', (req, res) => {
    fs.readdir(path.join(__dirname, 'items'), (err, files) => {
        if (err) {
            return res.status(500).send('Error reading files.');
        }
        // Send file list as JSON with correct URLs and sizes
        const fileDetails = files.map(file => {
            const filePath = path.join(__dirname, 'items', file);
            const stats = fs.statSync(filePath); // Get file stats
            return {
                name: file,
                url: `/items/${file}`, // Correct URL to access the file
                size: stats.size // Get file size in bytes
            };
        });
        res.json(fileDetails);
    });
});

// Delete file endpoint
app.delete('/delete/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, 'items', fileName);

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send('Error deleting file.');
        }

        // Send webhook notification with file size
        sendWebhookNotification('File Deleted', `File: ${fileName} has been deleted.`);
        res.send('File deleted!');
    });
});

// Logout endpoint
app.get('/logout', (req, res) => {
    res.clearCookie('login');
    res.redirect('/logout.html');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
