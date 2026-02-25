// Parse CSV text into an array of objects
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].replace(/^\uFEFF/, '').split(','); // strip BOM if present
    return lines.slice(1).map(line => {
        // Handle commas inside quoted fields
        const values = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const obj = {};
        headers.forEach((header, i) => {
            obj[header.trim()] = values[i] || '';
        });
        return obj;
    });
}

// Fetch and parse the CSV file
async function loadHats() {
    const response = await fetch('hats_items_complete.csv');
    const text = await response.text();
    return parseCSV(text);
}

// Shuffle an array in place (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Populate the bingo board with 16 category-balanced random hats:
// 10 "yes", 5 "maybe", 1 wild (any category, no duplicates)
function populateBoard(hats) {
    const dauberImageUrl = 'LeelaPogChamp.png';

    // Clear existing cells and remove old event listeners
    document.querySelectorAll('.cell').forEach(cell => {
        cell.replaceWith(cell.cloneNode(false)); // cloneNode(false) = no children
    });

    const yesHats   = shuffleArray(hats.filter(h => h.Category.trim() === 'yes'));
    const maybeHats = shuffleArray(hats.filter(h => h.Category.trim() === 'maybe'));

    const picked10Yes  = yesHats.slice(0, 10);
    const picked5Maybe = maybeHats.slice(0, 5);

    // Wild card: any hat not already selected, equal chance for all
    const usedNames = new Set([...picked10Yes, ...picked5Maybe].map(h => h.Name));
    const wildPool  = shuffleArray(hats.filter(h => !usedNames.has(h.Name)));
    const wildCard  = wildPool[0];

    // Combine all 16 and shuffle so categories are mixed across the board
    const shuffled = shuffleArray([...picked10Yes, ...picked5Maybe, wildCard]);

    shuffled.forEach((hat, index) => {
        const cell = document.getElementById(`cell-${index + 1}`);

        // Hat image
        const img = document.createElement('img');
        img.src = `images/${hat.Image}`;
        img.alt = hat.Name;
        img.className = 'villager-image';

        // Hat name label
        const label = document.createElement('div');
        label.className = 'villager-name';
        label.textContent = hat.Name;

        cell.appendChild(img);
        cell.appendChild(label);

        // Click to toggle dauber overlay
        cell.addEventListener('click', () => {
            const existingOverlay = cell.querySelector('.star-fragment-overlay');
            if (existingOverlay) {
                cell.removeChild(existingOverlay);
            } else {
                const dauberImg = document.createElement('img');
                dauberImg.src = dauberImageUrl;
                dauberImg.className = 'star-fragment-overlay';
                cell.appendChild(dauberImg);
            }
        });
    });
}

// Remove all dauber overlays without refreshing the board
function clearTickets() {
    document.querySelectorAll('.star-fragment-overlay').forEach(overlay => {
        overlay.parentElement.removeChild(overlay);
    });
}

// Initialize the app
(async function initializeApp() {
    const hats = await loadHats();

    // Initial board population
    populateBoard(hats);

    // Refresh button — new random board
    document.querySelector('.refresh-icon').addEventListener('click', () => {
        populateBoard(hats);
    });

    // Clear button — remove daubers only
    document.querySelector('.clear-icon').addEventListener('click', clearTickets);
})();
