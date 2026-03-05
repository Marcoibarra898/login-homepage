
// Constants
const API_URL = 'https://pokeapi.co/api/v2';
const LIMIT = 20;

// State
let offset = 0;
let currentList = [];
let isFilteringByGen = false;
let activeFilters = { id: '', name: '', type: 'all', gen: 'all' };

// DOM Elements
const grid = document.getElementById('pokemon-grid');
const loadMoreBtn = document.getElementById('load-more');
const filterBtn = document.getElementById('filter-btn');
const filterPanel = document.getElementById('filter-panel');
const filterIdInput = document.getElementById('filter-id-input');
const filterNameInput = document.getElementById('filter-name-input');
const typeFilter = document.getElementById('type-filter');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');
const activeFiltersDiv = document.getElementById('active-filters');
const genBtns = document.querySelectorAll('.gen-btn');

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);


async function init() {
    // Toggle filter panel
    filterBtn.addEventListener('click', () => {
        filterPanel.classList.toggle('hidden');
    });

    // Generation buttons
    genBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    loadMoreBtn.addEventListener('click', loadMore);

    await fetchPokemonList();
}

async function applyFilters() {
    const idVal = filterIdInput.value.trim();
    const nameVal = filterNameInput.value.trim().toLowerCase();
    const typeVal = typeFilter.value;
    const genBtn = document.querySelector('.gen-btn.active');
    const genVal = genBtn ? genBtn.dataset.gen : 'all';

    activeFilters = { id: idVal, name: nameVal, type: typeVal, gen: genVal };

    filterPanel.classList.add('hidden');
    updateActiveFiltersDisplay();
    grid.innerHTML = '';
    offset = 0;

    //ID search\
    if (idVal) {
        loadMoreBtn.classList.add('hidden');
        try {
            const res = await fetch(`${API_URL}/pokemon/${idVal}`);
            if (!res.ok) throw new Error('Not found');
            const pokemon = await res.json();
            createPokemonCard(pokemon);
        } catch {
            grid.innerHTML = '<p class="not-found">No Pokémon found with that ID.</p>';
        }
        return;
    }

    //Name search
    if (nameVal) {
        loadMoreBtn.classList.add('hidden');
        try {
            const res = await fetch(`${API_URL}/pokemon/${nameVal}`);
            if (!res.ok) throw new Error('Not found');
            const pokemon = await res.json();
            // If type filter also active, check match
            if (typeVal !== 'all') {
                const hasType = pokemon.types.some(t => t.type.name === typeVal);
                if (!hasType) {
                    grid.innerHTML = '<p class="not-found">No Pokémon found with that name and type.</p>';
                    return;
                }
            }
            createPokemonCard(pokemon);
        } catch {
            grid.innerHTML = '<p class="not-found">No Pokémon found with that name.</p>';
        }
        return;
    }

    //Generation filter
    if (genVal !== 'all') {
        isFilteringByGen = true;
        try {
            const res = await fetch(`${API_URL}/generation/${genVal}`);
            const data = await res.json();
            currentList = data.pokemon_species
                .sort((a, b) => {
                    const idA = parseInt(a.url.split('/').filter(Boolean).pop());
                    const idB = parseInt(b.url.split('/').filter(Boolean).pop());
                    return idA - idB;
                })
                .map(s => ({ name: s.name, url: s.url.replace('pokemon-species', 'pokemon') }));

            await renderGenBatch(0, typeVal);
            loadMoreBtn.classList.remove('hidden');
        } catch (e) {
            console.error('Error fetching generation:', e);
        }
        return;
    }

    //Type filter only
    if (typeVal !== 'all') {
        isFilteringByGen = true;
        loadMoreBtn.classList.add('hidden');
        try {
            const res = await fetch(`${API_URL}/type/${typeVal}`);
            const data = await res.json();
            currentList = data.pokemon
                .map(p => ({ name: p.pokemon.name, url: p.pokemon.url }))
                .sort((a, b) => {
                    const idA = parseInt(a.url.split('/').filter(Boolean).pop());
                    const idB = parseInt(b.url.split('/').filter(Boolean).pop());
                    return idA - idB;
                });
            await renderGenBatch(0, 'all');
            loadMoreBtn.classList.remove('hidden');
        } catch (e) {
            console.error('Error fetching type:', e);
        }
        return;
    }

    //No filters: default list
    isFilteringByGen = false;
    currentList = [];
    await fetchPokemonList();
    loadMoreBtn.classList.remove('hidden');
}

function clearFilters() {
    filterIdInput.value = '';
    filterNameInput.value = '';
    typeFilter.value = 'all';
    genBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.gen-btn[data-gen="all"]').classList.add('active');
    activeFilters = { id: '', name: '', type: 'all', gen: 'all' };
    activeFiltersDiv.innerHTML = '';
    filterPanel.classList.add('hidden');
    grid.innerHTML = '';
    offset = 0;
    isFilteringByGen = false;
    currentList = [];
    fetchPokemonList();
    loadMoreBtn.classList.remove('hidden');
}

//Active filter tags display
function updateActiveFiltersDisplay() {
    const tags = [];
    if (activeFilters.id) tags.push(`ID: ${activeFilters.id}`);
    if (activeFilters.name) tags.push(`Name: ${capitalize(activeFilters.name)}`);
    if (activeFilters.type !== 'all') tags.push(`Type: ${capitalize(activeFilters.type)}`);
    if (activeFilters.gen !== 'all') tags.push(`Gen ${activeFilters.gen}`);

    activeFiltersDiv.innerHTML = tags
        .map(t => `<span class="filter-tag">${t}</span>`)
        .join('');
}

// Fetch / Render helpers
async function fetchPokemonList() {
    if (isFilteringByGen) return;
    try {
        const res = await fetch(`${API_URL}/pokemon?limit=${LIMIT}&offset=${offset}`);
        const data = await res.json();
        await renderPokemonBatch(data.results);
        offset += LIMIT;
    } catch (e) {
        console.error('Error fetching pokemon list:', e);
    }
}

async function renderPokemonBatch(list) {
    const promises = list.map(item => fetchPokemonDetails(item.url));
    const details = await Promise.all(promises);
    details.forEach(createPokemonCard);
}

async function fetchPokemonDetails(url) {
    try {
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.error('Error fetching details:', e);
        return null;
    }
}

// Render a batch from currentList, optionally filtering by type
async function renderGenBatch(startIndex, typeFilter = 'all') {
    let batch = currentList.slice(startIndex, startIndex + LIMIT);

    const promises = batch.map(item => fetchPokemonDetails(item.url));
    const details = await Promise.all(promises);

    let rendered = 0;
    details.forEach(pokemon => {
        if (!pokemon) return;
        if (typeFilter !== 'all') {
            const hasType = pokemon.types.some(t => t.type.name === typeFilter);
            if (!hasType) return;
        }
        createPokemonCard(pokemon);
        rendered++;
    });

    offset = startIndex + LIMIT;

    if (offset >= currentList.length) {
        loadMoreBtn.classList.add('hidden');
    } else {
        loadMoreBtn.classList.remove('hidden');
    }
}

// Load More
function loadMore() {
    if (isFilteringByGen) {
        renderGenBatch(offset, activeFilters.type);
    } else {
        fetchPokemonList();
    }
}

// Create Card
function createPokemonCard(pokemon) {
    if (!pokemon) return;

    const card = document.createElement('div');
    card.classList.add('pokemon-card');

    const typesHtml = pokemon.types
        .map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`)
        .join('');

    const imageSrc =
        pokemon.sprites.other['official-artwork'].front_default ||
        pokemon.sprites.front_default;

    card.innerHTML = `
        <img src="${imageSrc}" alt="${pokemon.name}" class="pokemon-image">
        <div class="pokemon-id">#${pokemon.id.toString().padStart(4, '0')}</div>
        <div class="pokemon-name">${pokemon.name}</div>
        <div class="pokemon-types">${typesHtml}</div>
    `;

    grid.appendChild(card);
}

document.addEventListener('DOMContentLoaded', init);
