function openTool(toolId) {
  document.getElementById('workspace').classList.remove('hidden');
  document.querySelectorAll('.tool-content').forEach(el => el.classList.remove('active'));
  document.getElementById(toolId).classList.add('active');
  
  // Smooth scroll down to workspace
  document.getElementById('workspace').scrollIntoView({ behavior: 'smooth' });
}

function closeWorkspace() {
  document.getElementById('workspace').classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 1. PDF Converter
async function convertPdf() {
  const fileInput = document.getElementById('pdfFile');
  const resultArea = document.getElementById('pdfResult');
  if (!fileInput.files[0]) return alert('Please select a PDF file first.');

  resultArea.value = "Extracting text, please wait...";
  const formData = new FormData();
  formData.append('pdf', fileInput.files[0]);

  try {
    const res = await fetch('/api/pdf-to-text', { method: 'POST', body: formData });
    const data = await res.json();
    resultArea.value = data.text || `Error: ${data.error}`;
  } catch (err) {
    resultArea.value = `Error: Failed to connect to server.`;
  }
}

// 2. BG Remover
async function removeBg() {
  const fileInput = document.getElementById('bgFile');
  const resultContainer = document.getElementById('bgResult');
  if (!fileInput.files[0]) return alert('Please select an image.');

  resultContainer.innerHTML = '<p class="hint">Processing image...</p>';
  const formData = new FormData();
  formData.append('image', fileInput.files[0]);

  try {
    const res = await fetch('/api/remove-bg', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.imageUri) {
      resultContainer.innerHTML = `<img src="${data.imageUri}" style="max-width:100%; margin-top:10px; border-radius:8px;">`;
    } else {
      resultContainer.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
    }
  } catch (err) {
    resultContainer.innerHTML = `<p style="color:red;">Error connecting to server.</p>`;
  }
}

// 3. Grammar Checker
async function checkGrammar() {
  const text = document.getElementById('grammarInput').value;
  const resultArea = document.getElementById('grammarResult');
  if (!text.trim()) return alert('Please enter some text first.');

  resultArea.value = "Checking grammar...";
  try {
    const res = await fetch('/api/grammar-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    resultArea.value = data.result || `Error: ${data.error}`;
  } catch (err) {
    resultArea.value = `Error: Failed to connect to server.`;
  }
}

// 4. Data Cleanup
async function cleanData() {
  const data = document.getElementById('dataInput').value;
  const resultArea = document.getElementById('dataResult');
  if (!data.trim()) return alert('Please enter some text to clean.');

  resultArea.value = "Cleaning data...";
  try {
    const res = await fetch('/api/clean-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    const resultData = await res.json();
    resultArea.value = resultData.cleaned || `Error: ${resultData.error}`;
  } catch (err) {
    resultArea.value = `Error: Failed to connect to server.`;
  }
}

// 5. Table Builder
function addRow() {
  const table = document.getElementById('customTable');
  const colCount = table.rows[0].cells.length;
  const row = table.insertRow(-1);
  for (let i = 0; i < colCount; i++) {
    const cell = row.insertCell(i);
    cell.contentEditable = "true";
    cell.innerText = `Cell`;
  }
}

function addColumn() {
  const table = document.getElementById('customTable');
  for (let i = 0; i < table.rows.length; i++) {
    const cell = table.rows[i].insertCell(-1);
    cell.contentEditable = "true";
    if (i === 0) {
      cell.outerHTML = `<th contenteditable="true">Header</th>`;
    } else {
      cell.innerText = `Cell`;
    }
  }
}

function copyTableHTML() {
  const table = document.getElementById('customTable').outerHTML;
  navigator.clipboard.writeText(table);
  alert('Table HTML copied to clipboard!');
}

// 6. Equation Converter
async function convertEquation() {
  const equation = document.getElementById('eqInput').value;
  const resultArea = document.getElementById('eqResult');
  if (!equation.trim()) return alert('Please enter an equation.');

  resultArea.value = "Converting equation...";
  try {
    const res = await fetch('/api/convert-equation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equation })
    });
    const data = await res.json();
    resultArea.value = data.wordMath || `Error: ${data.error}`;
  } catch (err) {
    resultArea.value = `Error: Failed to connect to server.`;
  }
}

function copyToClipboard(elementId) {
  const text = document.getElementById(elementId).value;
  if (!text) return alert('Nothing to copy!');
  navigator.clipboard.writeText(text);
  alert('Copied to clipboard!');
}