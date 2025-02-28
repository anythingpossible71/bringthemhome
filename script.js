document.addEventListener('DOMContentLoaded', () => {
    // Game state
    let hostages = [];
    let selectedCards = [];
    let matchedPairs = 0;
    
    // DOM elements
    const gameBoard = document.getElementById('game-board');
    const matchesCount = document.getElementById('matches-count');
    
    // CSV URL
    const csvUrl = 'https://raw.githubusercontent.com/anythingpossible71/bringthemhome/refs/heads/main/59listcsv.csv';
    const imageBaseUrl = 'https://raw.githubusercontent.com/anythingpossible71/bringthemhome/refs/heads/main/';
    
    // Initialize the game
    initGame();
    
    // Functions
    async function initGame() {
        try {
            // Fetch and parse CSV data
            const data = await fetchCSV(csvUrl);
            hostages = parseCSV(data);
            
            // Create and shuffle cards
            const cards = createCards(hostages);
            const shuffledCards = shuffleArray(cards);
            
            // Render cards
            renderCards(shuffledCards);
        } catch (error) {
            console.error('Error initializing game:', error);
            gameBoard.innerHTML = `<p class="error">Error loading game data. Please try again later.</p>`;
        }
    }
    
    async function fetchCSV(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    }
    
    function parseCSV(csvText) {
        const lines = csvText.split('\n');
        const result = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            try {
                // The format is: "Name"ImageFileName.jpg
                // We need to extract just the image filename without any part of the name
                const lastQuoteIndex = line.lastIndexOf('"');
                if (lastQuoteIndex !== -1 && lastQuoteIndex < line.length - 1) {
                    const name = line.substring(1, lastQuoteIndex).trim();
                    // Remove any leading comma from the image filename
                    let imageFileName = line.substring(lastQuoteIndex + 1).trim();
                    if (imageFileName.startsWith(',')) {
                        imageFileName = imageFileName.substring(1).trim();
                    }
                    
                    if (name && imageFileName) {
                        result.push({ name, imageFileName });
                    }
                }
            } catch (error) {
                console.error('Error parsing line:', line, error);
            }
        }
        
        return result;
    }
    
    function createCards(hostages) {
        const nameCards = [];
        const imageCards = [];
        
        hostages.forEach(hostage => {
            // Create name card
            nameCards.push({
                id: `name-${hostage.imageFileName}`,
                type: 'name',
                content: hostage.name,
                match: hostage.imageFileName
            });
            
            // Create image card
            imageCards.push({
                id: `image-${hostage.imageFileName}`,
                type: 'image',
                content: `${imageBaseUrl}${hostage.imageFileName}`,
                match: hostage.imageFileName
            });
        });
        
        // Return combined array
        return [...nameCards, ...imageCards];
    }
    
    function shuffleArray(array) {
        // First, separate name and image cards
        const nameCards = array.filter(card => card.type === 'name');
        const imageCards = array.filter(card => card.type === 'image');
        
        // Shuffle each array separately
        shuffleInPlace(nameCards);
        shuffleInPlace(imageCards);
        
        // Interleave the cards to create a better playing experience
        // while ensuring ALL cards are included
        const result = [];
        const maxLength = Math.max(nameCards.length, imageCards.length);
        
        // Create pairs of name and image cards (one name card followed by one image card)
        for (let i = 0; i < maxLength; i++) {
            if (i < nameCards.length) result.push(nameCards[i]);
            if (i < imageCards.length) result.push(imageCards[i]);
        }
        
        return result;
    }
    
    function shuffleInPlace(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    function renderCards(cards) {
        gameBoard.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('card');
            cardElement.classList.add(`${card.type}-card`);
            cardElement.dataset.id = card.id;
            cardElement.dataset.match = card.match;
            
            // Add name attribute for image cards to display on match
            if (card.type === 'image') {
                // Find the corresponding hostage name
                const hostage = hostages.find(h => h.imageFileName === card.match);
                if (hostage) {
                    cardElement.dataset.name = hostage.name;
                    // Add a div for the name to ensure it's displayed
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'card-name';
                    nameDiv.textContent = hostage.name;
                    nameDiv.style.display = 'none';
                    cardElement.appendChild(nameDiv);
                }
            }
            
            const cardContent = document.createElement('div');
            cardContent.classList.add('card-content');
            
            if (card.type === 'name') {
                cardContent.textContent = card.content;
            } else {
                const img = document.createElement('img');
                console.log('Loading image:', card.content);
                img.src = card.content;
                img.alt = 'Hostage image';
                img.onerror = (e) => {
                    console.error('Image failed to load:', card.content, e);
                    img.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20fill%3D%22%23ccc%22%20d%3D%22M16%2016c-4.42%200-8-3.58-8-8s3.58-8%208-8%208%203.58%208%208-3.58%208-8%208zm0%204c5.5%200%2016%202.5%2016%208v4H0v-4c0-5.5%2010.5-8%2016-8z%22%2F%3E%3C%2Fsvg%3E';
                    img.style.width = '100px';
                    img.style.height = '100px';
                };
                img.onload = () => {
                    console.log('Image loaded successfully:', card.content);
                };
                cardContent.appendChild(img);
            }
            
            cardElement.appendChild(cardContent);
            gameBoard.appendChild(cardElement);
            
            // Add click event
            cardElement.addEventListener('click', () => handleCardClick(cardElement));
        });
    }
    
    function handleCardClick(card) {
        // Ignore if card is already matched or selected
        if (card.classList.contains('matched') || card.classList.contains('selected')) {
            return;
        }
        
        // Select the card
        card.classList.add('selected');
        selectedCards.push(card);
        
        // Check if we have 2 selected cards
        if (selectedCards.length === 2) {
            checkForMatch();
        }
    }
    
    function checkForMatch() {
        const [card1, card2] = selectedCards;
        
        // Check if cards match
        if (card1.dataset.match === card2.dataset.match && 
            card1.dataset.id !== card2.dataset.id) {
            // It's a match!
            card1.classList.remove('selected');
            card2.classList.remove('selected');
            card1.classList.add('matched');
            card2.classList.add('matched');
            
            // Show name on image card
            if (card1.classList.contains('image-card')) {
                const nameDiv = card1.querySelector('.card-name');
                if (nameDiv) nameDiv.style.display = 'block';
            }
            if (card2.classList.contains('image-card')) {
                const nameDiv = card2.querySelector('.card-name');
                if (nameDiv) nameDiv.style.display = 'block';
            }
            
            // Update match count
            matchedPairs++;
            matchesCount.textContent = matchedPairs;
            
            // Check for victory
            if (matchedPairs === hostages.length) {
                // Game completed - no alert needed
            }
        } else {
            // Not a match, deselect after a short delay
            setTimeout(() => {
                card1.classList.remove('selected');
                card2.classList.remove('selected');
            }, 1000);
        }
        
        // Reset selected cards
        selectedCards = [];
    }
    
    function resetGame() {
        // Reset game state
        selectedCards = [];
        matchedPairs = 0;
        matchesCount.textContent = '0';
        
        // Reshuffle and render cards
        const cards = createCards(hostages);
        const shuffledCards = shuffleArray(cards);
        renderCards(shuffledCards);
    }
});
