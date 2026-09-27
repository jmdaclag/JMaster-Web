import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createRequire } from 'module';

dotenv.config();

// Fix for CommonJS module loading in ES Module context
const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : pdfParseModule.default;

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini SDK safely
const aiKey = process.env.GEMINI_API_KEY;
const ai = aiKey && aiKey !== 'YOUR_GEMINI_API_KEY_HERE' 
  ? new GoogleGenAI({ apiKey: aiKey }) 
  : null;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 1. PDF to Text
app.post('/api/pdf-to-text', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file was uploaded.' });
    }

    const data = await pdfParse(req.file.buffer);
    
    if (!data.text || !data.text.trim()) {
      return res.status(400).json({ error: 'Could not extract text. The PDF might be scanned or image-only.' });
    }

    res.json({ text: data.text });
  } catch (error) {
    console.error('PDF Parse Error:', error);
    res.status(500).json({ error: `PDF Processing Error: ${error.message}` });
  }
});

// 2. Background Remover
app.post('/api/remove-bg', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

    if (!process.env.REMOVE_BG_API_KEY || process.env.REMOVE_BG_API_KEY === 'YOUR_REMOVE_BG_API_KEY_HERE') {
      return res.status(400).json({ error: 'REMOVE_BG_API_KEY is missing in your .env file.' });
    }

    const formData = new FormData();
    formData.append('image_file', req.file.buffer, req.file.originalname);
    formData.append('size', 'auto');

    const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
      },
      responseType: 'arraybuffer'
    });

    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    res.json({ imageUri: `data:image/png;base64,${base64Image}` });
  } catch (error) {
    console.error('BG Removal Error:', error.response?.data ? error.response.data.toString() : error.message);
    res.status(500).json({ error: 'Background removal failed. Check API key or remaining credits.' });
  }
});

// 3. AI Grammar Checker
app.post('/api/grammar-check', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided.' });

    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is missing or invalid in your .env file.' });
    }

    // Updated model string
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Correct the grammar, punctuation, and spelling of the following text while preserving its meaning. Return ONLY the revised text:\n\n${text}`
    });

    res.json({ result: response.text });
  } catch (error) {
    console.error('Grammar Check Error:', error);
    res.status(500).json({ error: `AI Grammar check failed: ${error.message}` });
  }
});

// 4. Data Cleanup
app.post('/api/clean-data', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided.' });

    const lines = data.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const uniqueLines = [...new Set(lines)];
    res.json({ cleaned: uniqueLines.join('\n') });
  } catch (error) {
    console.error('Data Cleanup Error:', error);
    res.status(500).json({ error: 'Data cleanup failed.' });
  }
});

// 5. Math Equation Converter
app.post('/api/convert-equation', async (req, res) => {
  try {
    const { equation } = req.body;
    if (!equation) return res.status(400).json({ error: 'No equation string provided.' });

    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is missing or invalid in your .env file.' });
    }

    const prompt = `Convert this mathematical equation into MS Word Linear Math format (the text syntax typed inside MS Word's Alt + = mode). Return ONLY the converted syntax string, with no markdown code blocks or explanations:\n\n${equation}`;
    
    // Updated model string
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    res.json({ wordMath: response.text });
  } catch (error) {
    console.error('Equation Error:', error);
    res.status(500).json({ error: `Equation conversion failed: ${error.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`JMaster App running at http://localhost:${PORT}`));