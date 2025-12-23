// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const filesSection = document.getElementById('filesSection');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const statusSection = document.getElementById('statusSection');
const statusText = document.getElementById('statusText');
const statusSubtext = document.getElementById('statusSubtext');
const progressFill = document.getElementById('progressFill');
const resultSection = document.getElementById('resultSection');
const downloadLink = document.getElementById('downloadLink');
const convertAnotherBtn = document.getElementById('convertAnotherBtn');
const errorSection = document.getElementById('errorSection');
const errorTitle = document.getElementById('errorTitle');
const errorMessage = document.getElementById('errorMessage');
const closeErrorBtn = document.getElementById('closeErrorBtn');
const timeTaken = document.getElementById('timeTaken');

let selectedFiles = [];

// Upload button click
uploadBtn.addEventListener('click', () => fileInput.click());

// File input change
fileInput.addEventListener('change', (e) => {
    addFiles(Array.from(e.target.files));
    fileInput.value = '';
});

// Drag and drop
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    addFiles(Array.from(e.dataTransfer.files));
});

// Add files to selectedFiles array
function addFiles(files) {
    files.forEach(file => {
        if (file.type === 'text/html' || file.type === 'text/css' || file.name.endsWith('.html') || file.name.endsWith('.css')) {
            const exists = selectedFiles.some(f => f.name === file.name);
            if (!exists) {
                selectedFiles.push(file);
            }
        }
    });
    updateFileList();
}

// Update file list UI
function updateFileList() {
    if (selectedFiles.length === 0) {
        filesSection.style.display = 'none';
        dropZone.style.display = 'block';
        return;
    }

    filesSection.style.display = 'block';
    dropZone.style.display = 'none';

    fileList.innerHTML = selectedFiles.map((file, index) => `
        <li class="file-item">
            <div class="file-item-info">
                <div class="file-type">${file.name.split('.').pop().toUpperCase()}</div>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
            </div>
            <button class="file-remove" onclick="removeFile(${index})" title="Remove file">✕</button>
        </li>
    `).join('');
}

// Remove file
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Clear all files
clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    updateFileList();
});

// Convert to PDF
convertBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
        showError('No Files Selected', 'Please select at least one HTML or CSS file.');
        return;
    }

    await convertToPDF();
});

// Convert to PDF function
async function convertToPDF() {
    // Show loading state
    filesSection.style.display = 'none';
    statusSection.style.display = 'block';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));

    try {
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 30;
                progressFill.style.width = progress + '%';
            }
        }, 300);

        // Compute base URL:
        // - When opened via http(s), use the page origin so requests go to same host/port.
        // - When opened via file:// (origin is "null"), fall back to localhost:3002 where the server defaults to run.
        const origin = window.location && window.location.origin;
        const fallback = 'http://localhost:3002';
        const baseUrl = (!origin || origin === 'null') ? fallback : origin;

        const response = await fetch(`${baseUrl}/convert`, {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        progressFill.style.width = '100%';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Conversion failed');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Conversion failed');
        }

        // Show result
        showResult(result);

    } catch (error) {
        console.error('Error:', error);
        showError('Conversion Error', error.message);
    }
}

// Show result
function showResult(result) {
    statusSection.style.display = 'none';
    resultSection.style.display = 'block';

    const cachStatus = result.cached ? ' (cached)' : '';
    timeTaken.innerHTML = `✓ Converted successfully in <strong>${result.timeTakenMs}ms</strong>${cachStatus}`;

    downloadLink.href = result.downloadUrl;
    downloadLink.download = `converted-${Date.now()}.pdf`;
}

// Show error
function showError(title, message) {
    statusSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'block';
    filesSection.style.display = 'block';

    errorTitle.textContent = title;
    errorMessage.textContent = message;
}

// Close error and reset
closeErrorBtn.addEventListener('click', resetUI);
convertAnotherBtn.addEventListener('click', resetUI);

// Reset UI to initial state
function resetUI() {
    selectedFiles = [];
    fileInput.value = '';
    statusSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    filesSection.style.display = 'none';
    dropZone.style.display = 'block';
    progressFill.style.width = '0%';
    updateFileList();
}

// Prevent default drag behavior on body
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());
