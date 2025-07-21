#!/usr/bin/env node

/**
 * Ollama Setup Script for AI Researcher Tool
 * This script helps install and configure Ollama for local LLM inference
 */

const { exec } = require('child_process');
const axios = require('axios');

const OLLAMA_BASE_URL = 'http://localhost:11434';
const REQUIRED_MODEL = 'deepseek-r1:8b';

console.log('🦙 Ollama Setup for AI Researcher Tool');
console.log('=' .repeat(50));

/**
 * Check if Ollama is installed
 */
function checkOllamaInstalled() {
  return new Promise((resolve) => {
    exec('ollama --version', (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        console.log('✅ Ollama is installed:', stdout.trim());
        resolve(true);
      }
    });
  });
}

/**
 * Check if Ollama server is running
 */
async function checkOllamaRunning() {
  try {
    await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 3000 });
    console.log('✅ Ollama server is running');
    return true;
  } catch (error) {
    console.log('❌ Ollama server is not running');
    return false;
  }
}

/**
 * Check if required model is available
 */
async function checkModelAvailable() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    const models = response.data.models || [];
    const hasModel = models.some(model => model.name.includes(REQUIRED_MODEL));
    
    if (hasModel) {
      console.log(`✅ Model ${REQUIRED_MODEL} is available`);
      return true;
    } else {
      console.log(`❌ Model ${REQUIRED_MODEL} is not available`);
      console.log('📋 Available models:', models.map(m => m.name).join(', '));
      return false;
    }
  } catch (error) {
    console.log('❌ Could not check available models');
    return false;
  }
}

/**
 * Install Ollama
 */
function installOllama() {
  return new Promise((resolve, reject) => {
    console.log('📥 Installing Ollama...');
    
    const installCommand = process.platform === 'darwin' 
      ? 'curl -fsSL https://ollama.ai/install.sh | sh'
      : process.platform === 'linux'
      ? 'curl -fsSL https://ollama.ai/install.sh | sh'
      : 'echo "Please install Ollama manually from https://ollama.ai"';
    
    exec(installCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to install Ollama:', error.message);
        reject(error);
      } else {
        console.log('✅ Ollama installed successfully');
        resolve();
      }
    });
  });
}

/**
 * Start Ollama server
 */
function startOllamaServer() {
  return new Promise((resolve) => {
    console.log('🚀 Starting Ollama server...');
    
    // Start Ollama serve in background
    const ollamaProcess = exec('ollama serve', (error) => {
      if (error && !error.message.includes('address already in use')) {
        console.error('❌ Failed to start Ollama server:', error.message);
      }
    });
    
    // Give it a few seconds to start
    setTimeout(async () => {
      const isRunning = await checkOllamaRunning();
      resolve(isRunning);
    }, 3000);
  });
}

/**
 * Pull required model
 */
function pullModel() {
  return new Promise((resolve, reject) => {
    console.log(`📦 Pulling model ${REQUIRED_MODEL}...`);
    console.log('⏳ This may take a few minutes...');
    
    exec(`ollama pull ${REQUIRED_MODEL}`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Failed to pull model:', error.message);
        reject(error);
      } else {
        console.log(`✅ Model ${REQUIRED_MODEL} pulled successfully`);
        resolve();
      }
    });
  });
}

/**
 * Test Ollama with a simple prompt
 */
async function testOllama() {
  try {
    console.log('🧪 Testing Ollama with sample prompt...');
    
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: REQUIRED_MODEL,
      prompt: 'Say "Hello from Ollama!" and nothing else.',
      stream: false
    });
    
    console.log('✅ Test successful! Response:', response.data.response.trim());
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupOllama() {
  try {
    // Step 1: Check if Ollama is installed
    const isInstalled = await checkOllamaInstalled();
    if (!isInstalled) {
      console.log('📥 Ollama not found. Installing...');
      await installOllama();
    }
    
    // Step 2: Check if server is running
    let isRunning = await checkOllamaRunning();
    if (!isRunning) {
      console.log('🚀 Starting Ollama server...');
      isRunning = await startOllamaServer();
    }
    
    if (!isRunning) {
      console.log('❌ Could not start Ollama server automatically.');
      console.log('💡 Please run manually: ollama serve');
      return;
    }
    
    // Step 3: Check if model is available
    const hasModel = await checkModelAvailable();
    if (!hasModel) {
      console.log(`📦 Pulling required model: ${REQUIRED_MODEL}`);
      await pullModel();
    }
    
    // Step 4: Test the setup
    const testPassed = await testOllama();
    
    if (testPassed) {
      console.log('');
      console.log('🎉 Ollama setup completed successfully!');
      console.log('🚀 Your AI Researcher Tool is now ready to use local LLM inference');
      console.log('');
      console.log('💡 Benefits of using Ollama:');
      console.log('  ✅ Completely free - no API costs');
      console.log('  ✅ No rate limits');
      console.log('  ✅ Privacy - everything runs locally');
      console.log('  ✅ Fast inference');
      console.log('');
      console.log('🔧 To start using:');
      console.log('  1. Make sure Ollama server is running: ollama serve');
      console.log('  2. Run your AI Researcher Tool tests');
    } else {
      console.log('❌ Setup completed but tests failed. Please check the configuration.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('');
    console.log('📖 Manual setup instructions:');
    console.log('  1. Install Ollama: https://ollama.ai');
    console.log('  2. Start server: ollama serve');
    console.log(`  3. Pull model: ollama pull ${REQUIRED_MODEL}`);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupOllama();
}

module.exports = {
  setupOllama,
  checkOllamaInstalled,
  checkOllamaRunning,
  checkModelAvailable,
  testOllama
}; 