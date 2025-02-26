document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - Navigation
    const loadPresetBtn = document.getElementById('loadPresetBtn');
    const createNewBtn = document.getElementById('createNewBtn');
    const presetOptions = document.getElementById('presetOptions');
    const createNewForm = document.getElementById('createNewForm');
    const initialButtons = document.querySelector('.initial-buttons');
    const backBtn = document.getElementById('backBtn');
    const createBackBtn = document.getElementById('createBackBtn');
    
    // DOM Elements - File Uploads
    const audioUpload = document.getElementById('audioUpload');
    const imageUpload = document.getElementById('imageUpload');
    const browseAudioBtn = document.getElementById('browseAudioBtn');
    const browseImageBtn = document.getElementById('browseImageBtn');
    const audioFileName = document.getElementById('audioFileName');
    const imageFileName = document.getElementById('imageFileName');
    
    // DOM Elements - Form Inputs
    const audioUrl = document.getElementById('audioUrl');
    const imageUrl = document.getElementById('imageUrl');
    
    // DOM Elements - Toggle Buttons
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    // DOM Elements - Action Buttons
    const cloneVoiceBtn = document.getElementById('cloneVoiceBtn');
    const generateBtn = document.getElementById('generateBtn');
    
    // DOM Elements - Status and Output
    const voiceCloneStatus = document.getElementById('voiceCloneStatus');
    const outputVideo = document.getElementById('outputVideo');
    const placeholderMessage = document.getElementById('placeholderMessage');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    // Store cloned voices
    let clonedVoices = [];
    
    // Navigation Event Listeners
    loadPresetBtn.addEventListener('click', function() {
        initialButtons.classList.add('hidden');
        presetOptions.classList.remove('hidden');
    });
    
    createNewBtn.addEventListener('click', function() {
        initialButtons.classList.add('hidden');
        createNewForm.classList.remove('hidden');
    });
    
    backBtn.addEventListener('click', function() {
        presetOptions.classList.add('hidden');
        initialButtons.classList.remove('hidden');
    });
    
    createBackBtn.addEventListener('click', function() {
        createNewForm.classList.add('hidden');
        initialButtons.classList.remove('hidden');
    });
    
    // Toggle Button Event Listeners
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Get the parent toggle container
            const toggleContainer = this.closest('.input-toggle');
            
            // Remove active class from all buttons in this container
            toggleContainer.querySelectorAll('.toggle-btn').forEach(button => {
                button.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all content sections in this container
            toggleContainer.querySelectorAll('.toggle-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show the target content section
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Clear inputs in the inactive section
            if (targetId === 'audioFileInput') {
                audioUrl.value = '';
            } else if (targetId === 'audioUrlInput') {
                audioUpload.value = '';
                audioFileName.textContent = 'No file chosen';
            } else if (targetId === 'imageFileInput') {
                imageUrl.value = '';
            } else if (targetId === 'imageUrlInput') {
                imageUpload.value = '';
                imageFileName.textContent = 'No file chosen';
            }
        });
    });
    
    // File Upload Event Listeners
    browseAudioBtn.addEventListener('click', function() {
        audioUpload.click();
    });
    
    browseImageBtn.addEventListener('click', function() {
        imageUpload.click();
    });
    
    audioUpload.addEventListener('change', function() {
        if (this.files.length > 0) {
            audioFileName.textContent = this.files[0].name;
        } else {
            audioFileName.textContent = 'No file chosen';
        }
    });
    
    imageUpload.addEventListener('change', function() {
        if (this.files.length > 0) {
            imageFileName.textContent = this.files[0].name;
        } else {
            imageFileName.textContent = 'No file chosen';
        }
    });
    
    // Handle preset selection
    presetBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const presetId = this.getAttribute('data-preset');
            loadPreset(presetId);
        });
    });
    
    // Clone Voice Button Event Listener
    cloneVoiceBtn.addEventListener('click', function() {
        // Determine which input method is active
        const isFileActive = document.getElementById('audioFileInput').classList.contains('active');
        
        // Get the appropriate input
        const audioFile = isFileActive && audioUpload.files.length > 0 ? audioUpload.files[0] : null;
        const audioUrlValue = !isFileActive ? audioUrl.value.trim() : '';
        
        if (!audioFile && !audioUrlValue) {
            showStatus(voiceCloneStatus, 'Please provide an audio file or URL', 'error');
            return;
        }
        
        // Clone voice
        cloneVoice(audioFile, audioUrlValue);
    });
    
    // Generate Button Event Listener
    generateBtn.addEventListener('click', function() {
        // Determine which input method is active
        const isFileActive = document.getElementById('imageFileInput').classList.contains('active');
        
        // Get the appropriate input
        const imageFile = isFileActive && imageUpload.files.length > 0 ? imageUpload.files[0] : null;
        const imageUrlValue = !isFileActive ? imageUrl.value.trim() : '';
        
        if (!imageFile && !imageUrlValue) {
            alert('Please provide an image file or URL');
            return;
        }
        
        // Generate video
        generateVideo(imageFile, imageUrlValue);
    });
    
    // Functions
    function loadPreset(presetId) {
        console.log(`Loading preset: ${presetId}`);
        
        placeholderMessage.textContent = "Loading preset...";
        
        // Make API request to get preset data
        fetch(`/api/presets/${presetId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load preset');
                }
                return response.json();
            })
            .then(data => {
                // Process the preset data and generate video
                simulateApiCalls(presetId);
            })
            .catch(error => {
                console.error('Error loading preset:', error);
                placeholderMessage.textContent = "Error loading preset. Please try again.";
            });
    }
    
    function cloneVoice(audioFile, audioUrl) {
        showStatus(voiceCloneStatus, 'Cloning voice... This may take a minute', 'loading');
        
        // Create FormData object for file upload to ElevenLabs API
        const formData = new FormData();
        formData.append('name', `Cloned Voice ${clonedVoices.length + 1}`);
        
        if (audioFile) {
            formData.append('files', audioFile);
        } else if (audioUrl) {
            // For ElevenLabs, we'd need to download the file first
            // This would typically be handled server-side
            showStatus(voiceCloneStatus, 'URL-based cloning requires server processing', 'error');
            return;
        }
        
        // Optional parameters
        formData.append('remove_background_noise', 'true');
        formData.append('description', 'Voice cloned through our application');
        
        // Make API request to ElevenLabs to clone voice
        fetch('https://api.elevenlabs.io/v1/voices/add', {
            method: 'POST',
            headers: {
                'xi-api-key': 'YOUR_ELEVENLABS_API_KEY' // This should be retrieved securely
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Voice cloning failed');
            }
            return response.json();
        })
        .then(data => {
            // Add the cloned voice to the list
            clonedVoices.push({
                id: data.voice_id,
                name: `Cloned Voice ${clonedVoices.length + 1}`
            });
            
            // Show success message
            showStatus(voiceCloneStatus, 'Voice cloned successfully!', 'success');
        })
        .catch(error => {
            console.error('Error cloning voice:', error);
            showStatus(voiceCloneStatus, 'Failed to clone voice. Please try again.', 'error');
        });
    }
    
    function generateVideo(imageFile, imageUrl) {
        placeholderMessage.textContent = "Generating video...";
        placeholderMessage.style.display = 'flex';
        outputVideo.style.display = 'none';
        
        // Create FormData object for file upload
        const formData = new FormData();
        if (imageFile) {
            formData.append('image', imageFile);
        } else {
            formData.append('image_url', imageUrl);
        }
        
        // Make API request to generate video
        fetch('/api/generate-video', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Video generation failed');
            }
            return response.json();
        })
        .then(data => {
            // Display the generated video
            placeholderMessage.style.display = 'none';
            outputVideo.style.display = 'block';
            outputVideo.src = data.video_url;
            outputVideo.play();
        })
        .catch(error => {
            console.error('Error generating video:', error);
            placeholderMessage.textContent = "Error generating video. Please try again.";
        });
    }
    
    function showStatus(element, message, type) {
        element.textContent = message;
        element.className = 'status-message';
        element.classList.add(type);
        
        // Clear error/success messages after 5 seconds
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 5000);
        }
    }
    
    function simulateApiCalls(type) {
        // Simulate fal.ai API call (generating video)
        placeholderMessage.textContent = "Generating video...";
        
        setTimeout(() => {
            // Show the video (in a real app, you'd set the src to the returned video URL)
            placeholderMessage.style.display = 'none';
            outputVideo.style.display = 'block';
            
            // For demo purposes, we'll use a placeholder video
            outputVideo.src = 'https://storage.googleapis.com/webfundamentals-assets/videos/chrome.mp4';
            outputVideo.play();
            
            console.log(`${type} video generated successfully`);
        }, 2000);
    }
}); 