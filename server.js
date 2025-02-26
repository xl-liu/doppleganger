const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Load environment variables
dotenv.config();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get presets
app.get('/api/presets/:presetId', (req, res) => {
    const presetId = req.params.presetId;
    
    // In a real app, you would fetch preset data from a database
    // For now, we'll return mock data
    const presets = {
        preset1: {
            image_url: "https://example.com/image1.jpg"
        },
        preset2: {
            image_url: "https://example.com/image2.jpg"
        },
        preset3: {
            image_url: "https://example.com/image3.jpg"
        },
        preset4: {
            image_url: "https://example.com/image4.jpg"
        }
    };
    
    if (presets[presetId]) {
        res.status(200).json(presets[presetId]);
    } else {
        res.status(404).json({ error: 'Preset not found' });
    }
});

// API endpoint to clone voice with ElevenLabs
app.post('/api/clone-voice', upload.single('audio'), async (req, res) => {
    try {
        let audioData;
        let audioSource;
        
        if (req.file) {
            // If audio file was uploaded
            audioData = fs.readFileSync(req.file.path);
            audioSource = 'file';
        } else if (req.body.audio_url) {
            // If audio URL was provided
            const response = await axios({
                method: 'get',
                url: req.body.audio_url,
                responseType: 'arraybuffer'
            });
            audioData = response.data;
            audioSource = 'url';
        } else {
            return res.status(400).json({ error: 'No audio file or URL provided' });
        }
        
        // Call ElevenLabs API to clone voice
        const response = await axios({
            method: 'post',
            url: 'https://api.elevenlabs.io/v1/voices/add',
            headers: {
                'Accept': 'application/json',
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'multipart/form-data'
            },
            data: {
                name: `Cloned Voice ${Date.now()}`,
                files: [audioData],
                description: `Voice cloned from ${audioSource}`
            }
        });
        
        // Clean up uploaded file if it exists
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(200).json({
            voice_id: response.data.voice_id,
            message: 'Voice cloned successfully'
        });
    } catch (error) {
        console.error('Error cloning voice:', error);
        
        // Clean up uploaded file if it exists
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: 'Failed to clone voice' });
    }
});

// API endpoint to generate video
app.post('/api/generate-video', upload.fields([
    { name: 'image', maxCount: 1 }
]), async (req, res) => {
    try {
        let imageData;
        let imageUrl;
        
        // Get image data
        if (req.files && req.files.image) {
            // If image file was uploaded
            const imagePath = req.files.image[0].path;
            imageData = fs.readFileSync(imagePath);
            // Clean up uploaded file
            fs.unlinkSync(imagePath);
        } else if (req.body.image_url) {
            // If image URL was provided
            imageUrl = req.body.image_url;
        } else {
            return res.status(400).json({ error: 'No image file or URL provided' });
        }
        
        // Call fal.ai API to generate video
        const falData = new FormData();
        
        if (imageData) {
            falData.append('image', imageData);
        } else {
            falData.append('image_url', imageUrl);
        }
        
        const videoResponse = await axios({
            method: 'post',
            url: 'https://api.fal.ai/v1/video-generation',
            headers: {
                'Authorization': `Bearer ${process.env.FAL_API_KEY}`,
                'Content-Type': 'multipart/form-data'
            },
            data: falData
        });
        
        // Return the video URL
        res.status(200).json({
            video_url: videoResponse.data.video_url,
            message: 'Video generated successfully'
        });
    } catch (error) {
        console.error('Error generating video:', error);
        
        // Clean up uploaded files if they exist
        if (req.files && req.files.image) {
            fs.unlinkSync(req.files.image[0].path);
        }
        
        res.status(500).json({ error: 'Failed to generate video' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 