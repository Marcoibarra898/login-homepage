
// Constants
const API_URL = 'https://pokeapi.co/api/v2';
const LIMIT = 20;

// State
let offset = 0;
let currentList = []; // Holds the list of pokemon URLs to display (for generation filter)
let isFilteringByGen = false;

// DOM Elements
const grid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('search-input');
const genFilter = document.getElementById('gen-filter');
const loadMoreBtn = document.getElementById('load-more');

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Initialize
async function init() {
    // Determine current generation from select to handle browser cache/reload
    if (genFilter.value !== 'all') {
        handleGenFilter();
    } else {
        await fetchPokemonList();
    }

    // Event Listeners
    loadMoreBtn.addEventListener('click', loadMore);
    searchInput.addEventListener('input', debounce(handleSearch, 500));
    genFilter.addEventListener('change', handleGenFilter);
}

// Fetch Initial/Next Page of Pokemon
async function fetchPokemonList() {
    if (isFilteringByGen) return; // Handled by loadMoreGen

    try {
        const response = await fetch(`${API_URL}/pokemon?limit=${LIMIT}&offset=${offset}`);
        const data = await response.json();
        const results = data.results;

        await renderPokemonBatch(results);

        offset += LIMIT;
    } catch (error) {
        console.error('Error fetching pokemon list:', error);
    }
}

// Fetch details for a list of pokemon and render them
async function renderPokemonBatch(list) {
    const promises = list.map(item => fetchPokemonDetails(item.url));
    const pokemonDetails = await Promise.all(promises);
    pokemonDetails.forEach(createPokemonCard);
}

// Fetch details for a single Pokemon
async function fetchPokemonDetails(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error fetching details:', error);
        return null;
    }
}

// Search Pokemon
async function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();

    grid.innerHTML = '';
    offset = 0; // Reset offset
    loadMoreBtn.classList.add('hidden');

    if (!query) {
        // Reset to initial state
        loadMoreBtn.classList.remove('hidden');
        if (isFilteringByGen) {
            renderGenBatch(0);
        } else {
            // Force reset to first page
            grid.innerHTML = '';
            offset = 0;
            fetchPokemonList();
        }
        return;
    }

    try {
        const response = await fetch(`${API_URL}/pokemon/${query}`);
        if (!response.ok) throw new Error('Pokemon not found');
        const pokemon = await response.json();
        createPokemonCard(pokemon);
    } catch (error) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Pokemon not found.</p>';
    }
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generation Filter
async function handleGenFilter() {
    const genId = genFilter.value;
    grid.innerHTML = '';
    offset = 0;

    if (genId === 'all') {
        isFilteringByGen = false;
        currentList = [];
        fetchPokemonList();
        loadMoreBtn.classList.remove('hidden');
    } else {
        isFilteringByGen = true;
        try {
            const response = await fetch(`${API_URL}/generation/${genId}`);
            const data = await response.json();
            // Sort by ID to ensure "lowest to highest by default"
            currentList = data.pokemon_species.sort((a, b) => {
                const idA = parseInt(a.url.split('/').filter(Boolean).pop());
                const idB = parseInt(b.url.split('/').filter(Boolean).pop());
                return idA - idB;
            }).map(s => ({
                name: s.name,
                url: s.url.replace('pokemon-species', 'pokemon')
            }));

            renderGenBatch(0);
            loadMoreBtn.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching generation:', error);
        }
    }
}

// Render batch from currentList 
async function renderGenBatch(startIndex) {
    const batch = currentList.slice(startIndex, startIndex + LIMIT);
    await renderPokemonBatch(batch);
    offset = startIndex + LIMIT;

    if (offset >= currentList.length) {
        loadMoreBtn.classList.add('hidden');
    } else {
        loadMoreBtn.classList.remove('hidden');
    }
}

// Load More Handler
function loadMore() {
    if (isFilteringByGen) {
        renderGenBatch(offset);
    } else {
        fetchPokemonList();
    }
}

// Create Card
function createPokemonCard(pokemon) {
    if (!pokemon) return;

    const card = document.createElement('div');
    card.classList.add('pokemon-card');

    const typesHtml = pokemon.types.map(t =>
        `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
    ).join('');

    
    const imageSrc = pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default;
    
    card.innerHTML = `
        <img src="${imageSrc}" alt="${pokemon.name}" class="pokemon-image">
        <div class="pokemon-id">#${pokemon.id.toString().padStart(4, '0')}</div>
        <div class="pokemon-name">${pokemon.name}</div>
        <div class="pokemon-types">${typesHtml}</div>
    `;

    grid.appendChild(card);
}


document.addEventListener("DOMContentLoaded", init);
