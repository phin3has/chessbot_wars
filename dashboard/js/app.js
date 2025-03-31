// Main application logic for the chess match dashboard

// DOM elements
const loadingEl = document.getElementById('loading');
const dashboardContentEl = document.getElementById('dashboard-content');
const refreshDataBtn = document.getElementById('refresh-data');
const applyFiltersBtn = document.getElementById('apply-filters');
const dateRangeSelect = document.getElementById('date-range');
const modelFilterSelect = document.getElementById('model-filter');
const resultFilterSelect = document.getElementById('result-filter');
const totalGamesEl = document.getElementById('total-games');
const totalDrawsEl = document.getElementById('total-draws');
const avgInvalidMovesEl = document.getElementById('avg-invalid-moves');
const whiteWinRateEl = document.getElementById('white-win-rate');
const recentGamesTableEl = document.getElementById('recent-games-table');

// Current state
let currentData = [];
let currentFilters = {
    dateRange: 'all',
    model: 'all',
    result: 'all'
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Document ready, checking Supabase availability");
    
    // Give a bit more time for Supabase to initialize if needed
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!supabase && !window.supabaseClient && attempts < maxAttempts) {
        console.log(`Waiting for Supabase to initialize (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        
        // Try to use the global client if available
        if (window.supabaseClient) {
            console.log("Using global supabaseClient");
            supabase = window.supabaseClient;
        }
    }
    
    // Check if Supabase is properly initialized
    if (!supabase && window.supabaseClient) {
        console.log("Using global supabaseClient as fallback");
        supabase = window.supabaseClient;
    }
    
    if (!supabase) {
        console.error("Supabase is not initialized!");
        alert("Database connection error. Please check console for details.");
        return;
    }
    try {
        // Initialize charts
        initializeCharts();
        
        // Load data
        await loadData();
        
        // Update model filter options
        await populateModelFilter();
        
        // Setup event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Failed to load dashboard. Please check the console for details.');
    }
});

/**
 * Load chess match data and update the dashboard
 * @param {boolean} forceRefresh - Whether to force a refresh of the data
 */
async function loadData(forceRefresh = false) {
    try {
        // Show loading state
        showLoading(true);
        
        // Fetch data
        currentData = await fetchChessMatchData(forceRefresh);
        
        // Update the dashboard with the data
        updateDashboard(currentData);
        
        // Hide loading state
        showLoading(false);
        
    } catch (error) {
        console.error('Failed to load data:', error);
        showError('Failed to load data. Please try refreshing the page.');
        showLoading(false);
    }
}

/**
 * Apply filters to the data and update the dashboard
 */
async function applyFilters() {
    try {
        // Show loading state
        showLoading(true);
        
        // Get filter values
        currentFilters = {
            dateRange: dateRangeSelect.value,
            model: modelFilterSelect.value,
            result: resultFilterSelect.value
        };
        
        // Fetch filtered data
        const filteredData = await fetchFilteredChessMatchData(currentFilters);
        
        // Update the dashboard with the filtered data
        updateDashboard(filteredData);
        
        // Hide loading state
        showLoading(false);
        
    } catch (error) {
        console.error('Failed to apply filters:', error);
        showError('Failed to apply filters. Please try again.');
        showLoading(false);
    }
}

/**
 * Update the dashboard with new data
 * @param {Array} data - Array of chess match data
 */
function updateDashboard(data) {
    // Update statistics
    updateStatistics(data);
    
    // Update charts
    updateCharts(data);
    
    // Update recent games table
    updateRecentGamesTable(data);
}

/**
 * Update the statistics section of the dashboard
 * @param {Array} data - Array of chess match data
 */
function updateStatistics(data) {
    const stats = calculateBasicStats(data);
    
    // Update the stats cards
    totalGamesEl.textContent = stats.totalGames;
    totalDrawsEl.textContent = stats.totalDraws;
    avgInvalidMovesEl.textContent = stats.avgInvalidMoves;
    whiteWinRateEl.textContent = `${stats.whiteWinRate}%`;
}

/**
 * Update the recent games table
 * @param {Array} data - Array of chess match data
 */
function updateRecentGamesTable(data) {
    const recentGames = formatRecentGames(data, 10);
    
    // Clear the table
    recentGamesTableEl.innerHTML = '';
    
    // Add each game to the table
    recentGames.forEach(game => {
        const row = document.createElement('tr');
        
        // Determine result class for styling
        let resultClass = '';
        if (game.result === '1-0') {
            resultClass = 'table-light';
        } else if (game.result === '0-1') {
            resultClass = 'table-dark';
        } else if (game.result === '1/2-1/2') {
            resultClass = 'table-secondary';
        } else if (game.result === 'ERR') {
            resultClass = 'table-danger';
        }
        
        // Add the class to the row
        row.classList.add(resultClass);
        
        // Add cells to the row
        row.innerHTML = `
            <td>${game.date}</td>
            <td>${game.white}</td>
            <td>${game.black}</td>
            <td>${game.result}</td>
            <td>${game.winner}</td>
            <td>${game.termination}</td>
            <td>${game.invalidMoves}</td>
        `;
        
        // Add the row to the table
        recentGamesTableEl.appendChild(row);
    });
    
    // If no games, show a message
    if (recentGames.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">No games found</td>';
        recentGamesTableEl.appendChild(row);
    }
}

/**
 * Populate the model filter dropdown with unique models
 */
async function populateModelFilter() {
    try {
        const models = await getUniqueModels();
        
        // Clear existing options (except 'All Models')
        while (modelFilterSelect.options.length > 1) {
            modelFilterSelect.remove(1);
        }
        
        // Add each model to the dropdown
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelFilterSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Failed to populate model filter:', error);
    }
}

/**
 * Setup event listeners for the dashboard
 */
function setupEventListeners() {
    // Refresh data button
    refreshDataBtn.addEventListener('click', () => {
        loadData(true);
    });
    
    // Apply filters button
    applyFiltersBtn.addEventListener('click', () => {
        applyFilters();
    });
}

/**
 * Show or hide the loading indicator
 * @param {boolean} show - Whether to show the loading indicator
 */
function showLoading(show) {
    if (show) {
        loadingEl.classList.remove('d-none');
        dashboardContentEl.classList.add('d-none');
    } else {
        loadingEl.classList.add('d-none');
        dashboardContentEl.classList.remove('d-none');
    }
}

/**
 * Show an error message to the user
 * @param {string} message - The error message to show
 */
function showError(message) {
    alert(message);
}
