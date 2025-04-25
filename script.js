// DOM Elements
const levelSelection = document.getElementById('levelSelection');
const gameScreen = document.getElementById('gameScreen');
const levelCards = document.querySelectorAll('.level-card');
const wordsContainer = document.getElementById('wordsContainer');
const answerContainer = document.getElementById('answerContainer');
const checkButton = document.getElementById('checkButton');
const resetButton = document.getElementById('resetButton');
const nextButton = document.getElementById('nextButton');
const hintButton = document.getElementById('hintButton');
const backToMenuButton = document.getElementById('backToMenuButton');
const resultElement = document.getElementById('result');
const currentLevelElement = document.getElementById('currentLevel');
const scoreElement = document.getElementById('score');
const hintContainer = document.getElementById('hint-container');
const hintText = document.getElementById('hint-text');
const questionCounter = document.getElementById('questionCounter');
const totalQuestions = document.getElementById('totalQuestions');

// Audio Elements
const backgroundMusic = new Audio('sound/background.mp3');
const correctSound = new Audio('sound/correct.mp3');
const wrongSound = new Audio('sound/wrong.mp3');

// Audio Settings
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

// Game Variables
let sentences = [];
let selectedDifficulty = 1;
let currentSentenceIndex = 0;
let selectedWords = [];
let score = 0;
let hintsUsed = 0;
let currentLevelSentences = [];

// Initialize audio
function initializeAudio() {
    // Load all audio files
    backgroundMusic.load();
    correctSound.load();
    wrongSound.load();
    
    // Start playing background music
    backgroundMusic.play().catch(error => {
        console.error('Error playing background music:', error);
    });
}

// Fetch sentences from JSON file
async function fetchSentences() {
    try {
        const response = await fetch('sentences.json');
        sentences = await response.json();
        
        // Initialize game with level 1 by default
        filterSentencesByLevel(1);
    } catch (error) {
        console.error('Error loading sentences:', error);
        alert('Cümleler yüklenirken bir hata oluştu.');
    }
}

// Initialize the game
window.addEventListener('DOMContentLoaded', () => {
    fetchSentences();
    initializeLevelSelection();
    initializeAudio();
});

// Level Selection Handlers
function initializeLevelSelection() {
    levelCards.forEach(card => {
        card.addEventListener('click', () => {
            selectedDifficulty = parseInt(card.dataset.level);
            startGame(selectedDifficulty);
        });
    });
}

function startGame(level) {
    // Reset game state
    score = 0;
    hintsUsed = 0;
    currentSentenceIndex = 0;
    
    // Filter sentences by selected level
    filterSentencesByLevel(level);
    
    // Update UI
    currentLevelElement.textContent = level;
    scoreElement.textContent = "0";
    questionCounter.textContent = "1";
    totalQuestions.textContent = currentLevelSentences.length;
    
    // Hide level selection and show game screen
    levelSelection.style.display = 'none';
    gameScreen.style.display = 'flex';
    
    // Load first sentence
    loadSentence();
}

function filterSentencesByLevel(level) {
    currentLevelSentences = sentences.filter(sentence => sentence.level === level);
    
    // Shuffle sentences
    currentLevelSentences = shuffleArray(currentLevelSentences);
}

// Shuffle array helper function
function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Game Logic Functions
function loadSentence() {
    if (currentSentenceIndex >= currentLevelSentences.length) {
        // End of questions for this level
        alert(`Tebrikler! Bu seviyedeki tüm soruları tamamladınız. Toplam puanınız: ${score}`);
        returnToMainMenu();
        return;
    }
    
    const currentSentence = currentLevelSentences[currentSentenceIndex];
    
    // Update question counter
    questionCounter.textContent = currentSentenceIndex + 1;
    
    // Reset selection
    selectedWords = [];
    
    // Hide hint
    hintContainer.style.display = 'none';
    
    // Shuffle words
    const shuffledWords = shuffleArray([...currentSentence.words]);
    
    // Clear containers
    wordsContainer.innerHTML = '';
    answerContainer.innerHTML = '';
    
    // Add words to the words container
    shuffledWords.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word';
        wordElement.textContent = word;
        wordElement.addEventListener('click', () => selectWord(word, wordElement));
        wordsContainer.appendChild(wordElement);
    });
    
    // Reset buttons
    checkButton.disabled = true;
    nextButton.disabled = true;
    resultElement.style.display = 'none';
}

function selectWord(word, element) {
    // Add word to selected words
    selectedWords.push(word);
    
    // Mark word as selected
    element.classList.add('selected');
    
    // Add word to answer container
    const selectedWordElement = document.createElement('div');
    selectedWordElement.className = 'selected-word';
    selectedWordElement.textContent = word;
    selectedWordElement.addEventListener('click', () => removeWord(word, element, selectedWordElement));
    answerContainer.appendChild(selectedWordElement);
    
    // Enable check button if all words are selected
    const currentSentence = currentLevelSentences[currentSentenceIndex];
    if (selectedWords.length === currentSentence.words.length) {
        checkButton.disabled = false;
    }
}

function removeWord(word, originalElement, selectedElement) {
    // Remove word from selected words
    const index = selectedWords.indexOf(word);
    if (index !== -1) {
        selectedWords.splice(index, 1);
    }
    
    // Remove selected class from original word
    originalElement.classList.remove('selected');
    
    // Remove word from answer container
    answerContainer.removeChild(selectedElement);
    
    // Disable check button
    checkButton.disabled = true;
}

function checkAnswer() {
    const currentSentence = currentLevelSentences[currentSentenceIndex];
    const userAnswer = selectedWords.join(' ');
    
    if (userAnswer === currentSentence.correct) {
        // Correct answer
        resultElement.textContent = 'Doğru! Tebrikler! 🎉';
        resultElement.className = 'result correct';
        
        // Play correct sound
        correctSound.currentTime = 0;
        correctSound.play().catch(error => {
            console.error('Error playing correct sound:', error);
        });
        
        // Calculate score based on hints used
        let pointsEarned = 10;
        if (hintsUsed > 0) {
            pointsEarned = Math.max(5, 10 - hintsUsed * 2); // Reduce points for hints used
        }
        
        score += pointsEarned;
        scoreElement.textContent = score;
        
        // Create confetti effect
        createConfetti();
        
        // Enable next button
        nextButton.disabled = false;
        checkButton.disabled = true;
    } else {
        // Incorrect answer
        resultElement.textContent = 'Yanlış. Tekrar deneyin! 🤔';
        resultElement.className = 'result incorrect';
        
        // Play wrong sound
        wrongSound.currentTime = 0;
        wrongSound.play().catch(error => {
            console.error('Error playing wrong sound:', error);
        });
    }
    
    resultElement.style.display = 'block';
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random position
        confetti.style.left = Math.random() * 100 + 'vw';
        
        // Random color
        const colors = ['#FF9999', '#FFFF99', '#99FF99', '#99FFFF', '#9999FF', '#FF99FF'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Random size
        const size = Math.random() * 10 + 5;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        
        // Random animation duration
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        
        document.body.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            document.body.removeChild(confetti);
        }, 5000);
    }
}

function resetSelection() {
    // Clear selected words
    selectedWords = [];
    
    // Reset word elements
    const wordElements = wordsContainer.querySelectorAll('.word');
    wordElements.forEach(element => {
        element.classList.remove('selected');
    });
    
    // Clear answer container
    answerContainer.innerHTML = '';
    
    // Disable check button
    checkButton.disabled = true;
    
    // Hide result
    resultElement.style.display = 'none';
}

function showHint() {
    const currentSentence = currentLevelSentences[currentSentenceIndex];
    hintText.textContent = currentSentence.hint;
    hintContainer.style.display = 'block';
    
    // Count hint usage
    hintsUsed++;
}

function nextQuestion() {
    currentSentenceIndex++;
    hintsUsed = 0;
    loadSentence();
}

function returnToMainMenu() {
    gameScreen.style.display = 'none';
    levelSelection.style.display = 'flex';
}

// Event Listeners
checkButton.addEventListener('click', checkAnswer);
resetButton.addEventListener('click', resetSelection);
nextButton.addEventListener('click', nextQuestion);
hintButton.addEventListener('click', showHint);
backToMenuButton.addEventListener('click', returnToMainMenu);
