const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

// Middleware setup
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

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

        // Optionally, send a message to a Discord webhook here

        res.send('File uploaded!'); // Success message
    });
});

// List files endpoint
app.get('/files', (req, res) => {
    fs.readdir(path.join(__dirname, 'items'), (err, files) => {
        if (err) {
            return res.status(500).send('Error reading files.');
        }
        res.json(files.map(file => ({ name: file }))); // Send file list as JSON
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

        // Optionally, send a message to a Discord webhook here

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
