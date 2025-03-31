// Statistics calculations for chess match data

/**
 * Calculate basic statistics from chess match data
 * @param {Array} matchData - Array of chess match data
 * @returns {Object} - Object containing calculated statistics
 */
function calculateBasicStats(matchData) {
    if (!matchData || matchData.length === 0) {
        return {
            totalGames: 0,
            totalDraws: 0,
            avgInvalidMoves: 0,
            whiteWinRate: 0
        };
    }

    // Total number of games
    const totalGames = matchData.length;

    // Total number of draws
    const totalDraws = matchData.filter(game => game.result === '1/2-1/2').length;

    // Average number of invalid moves per game
    const totalInvalidMoves = matchData.reduce((sum, game) => sum + (game.invalid_moves || 0), 0);
    const avgInvalidMoves = totalInvalidMoves / totalGames;

    // White win rate
    const whiteWins = matchData.filter(game => game.result === '1-0').length;
    const whiteWinRate = (whiteWins / totalGames) * 100;

    return {
        totalGames,
        totalDraws,
        avgInvalidMoves: avgInvalidMoves.toFixed(2),
        whiteWinRate: whiteWinRate.toFixed(1)
    };
}

/**
 * Calculate model win statistics
 * @param {Array} matchData - Array of chess match data
 * @returns {Object} - Object containing model win data for charting
 */
function calculateModelWins(matchData) {
    if (!matchData || matchData.length === 0) {
        return { labels: [], data: [] };
    }

    // Count wins by model
    const modelWins = {};
    
    matchData.forEach(game => {
        if (game.winner && game.result !== '1/2-1/2' && game.result !== 'ERR') {
            modelWins[game.winner] = (modelWins[game.winner] || 0) + 1;
        }
    });

    // Convert to arrays for charting
    const labels = Object.keys(modelWins);
    const data = Object.values(modelWins);

    return { labels, data };
}

/**
 * Calculate win statistics by color
 * @param {Array} matchData - Array of chess match data
 * @returns {Object} - Object containing win data by color
 */
function calculateColorWins(matchData) {
    if (!matchData || matchData.length === 0) {
        return { labels: ['White', 'Black', 'Draw'], data: [0, 0, 0] };
    }

    // Count results by color
    const whiteWins = matchData.filter(game => game.result === '1-0').length;
    const blackWins = matchData.filter(game => game.result === '0-1').length;
    const draws = matchData.filter(game => game.result === '1/2-1/2').length;

    return {
        labels: ['White', 'Black', 'Draw'],
        data: [whiteWins, blackWins, draws]
    };
}

/**
 * Calculate termination reason statistics
 * @param {Array} matchData - Array of chess match data
 * @returns {Object} - Object containing termination reason data
 */
function calculateTerminationReasons(matchData) {
    if (!matchData || matchData.length === 0) {
        return { labels: [], data: [] };
    }

    // Count games by termination reason
    const terminationReasons = {};
    
    matchData.forEach(game => {
        if (game.termination_reason) {
            const reason = game.termination_reason;
            terminationReasons[reason] = (terminationReasons[reason] || 0) + 1;
        }
    });

    // Convert to arrays for charting
    const labels = Object.keys(terminationReasons);
    const data = Object.values(terminationReasons);

    return { labels, data };
}

/**
 * Calculate invalid moves by model
 * @param {Array} matchData - Array of chess match data
 * @returns {Object} - Object containing invalid moves data by model
 */
function calculateInvalidMovesByModel(matchData) {
    if (!matchData || matchData.length === 0) {
        return { labels: [], data: [] };
    }

    // Group models and count their invalid moves
    const modelInvalidMoves = {};
    const modelGames = {};
    
    matchData.forEach(game => {
        // Skip games without invalid_moves data
        if (typeof game.invalid_moves === 'undefined') return;
        
        // Count white model invalid moves
        if (game.white_model) {
            modelGames[game.white_model] = (modelGames[game.white_model] || 0) + 1;
            // We don't know exactly how many invalid moves per model,
            // so we'll distribute them evenly for this statistic
            const whiteInvalidMoves = game.invalid_moves ? game.invalid_moves / 2 : 0;
            modelInvalidMoves[game.white_model] = (modelInvalidMoves[game.white_model] || 0) + whiteInvalidMoves;
        }
        
        // Count black model invalid moves
        if (game.black_model) {
            modelGames[game.black_model] = (modelGames[game.black_model] || 0) + 1;
            // We don't know exactly how many invalid moves per model,
            // so we'll distribute them evenly for this statistic
            const blackInvalidMoves = game.invalid_moves ? game.invalid_moves / 2 : 0;
            modelInvalidMoves[game.black_model] = (modelInvalidMoves[game.black_model] || 0) + blackInvalidMoves;
        }
    });

    // Calculate average invalid moves per game for each model
    const avgInvalidMoves = {};
    Object.keys(modelInvalidMoves).forEach(model => {
        avgInvalidMoves[model] = modelInvalidMoves[model] / modelGames[model];
    });

    // Sort models by average invalid moves (highest first)
    const sortedModels = Object.keys(avgInvalidMoves).sort((a, b) => {
        return avgInvalidMoves[b] - avgInvalidMoves[a];
    });

    // Limit to top 10 models to keep the chart readable
    const topModels = sortedModels.slice(0, 10);

    // Convert to arrays for charting
    const labels = topModels;
    const data = topModels.map(model => parseFloat(avgInvalidMoves[model].toFixed(2)));

    return { labels, data };
}

/**
 * Format a date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format recent games data for the table display
 * @param {Array} matchData - Array of chess match data
 * @param {number} limit - Maximum number of games to return
 * @returns {Array} - Array of formatted game data for display
 */
function formatRecentGames(matchData, limit = 10) {
    if (!matchData || matchData.length === 0) {
        return [];
    }

    // Sort by date (most recent first)
    const sortedData = [...matchData].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    // Take only the number of games specified by limit
    const limitedData = sortedData.slice(0, limit);

    // Format the data for display
    return limitedData.map(game => {
        return {
            date: formatDate(game.date),
            white: game.white_model || 'Unknown',
            black: game.black_model || 'Unknown',
            result: game.result || 'Unknown',
            winner: game.winner || 'N/A',
            termination: game.termination_reason || 'Unknown',
            invalidMoves: game.invalid_moves || 0
        };
    });
}
