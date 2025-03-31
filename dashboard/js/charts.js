// Chart creation and updates

// Store chart instances for later updates
let modelWinsChart = null;
let colorWinsChart = null;
let terminationChart = null;
let invalidMovesChart = null;

/**
 * Initialize all charts with empty data
 */
function initializeCharts() {
    // Model Wins Chart
    const modelWinsCtx = document.getElementById('model-wins-chart').getContext('2d');
    modelWinsChart = new Chart(modelWinsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Wins',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Wins: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });

    // Color Wins Chart
    const colorWinsCtx = document.getElementById('color-wins-chart').getContext('2d');
    colorWinsChart = new Chart(colorWinsCtx, {
        type: 'pie',
        data: {
            labels: ['White', 'Black', 'Draw'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    'rgba(255, 255, 255, 0.8)',
                    'rgba(0, 0, 0, 0.8)',
                    'rgba(128, 128, 128, 0.8)'
                ],
                borderColor: [
                    'rgba(200, 200, 200, 1)',
                    'rgba(50, 50, 50, 1)',
                    'rgba(100, 100, 100, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Termination Reasons Chart
    const terminationCtx = document.getElementById('termination-chart').getContext('2d');
    terminationChart = new Chart(terminationCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // Invalid Moves by Model Chart
    const invalidMovesCtx = document.getElementById('invalid-moves-chart').getContext('2d');
    invalidMovesChart = new Chart(invalidMovesCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Avg. Invalid Moves',
                data: [],
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',  // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Avg. Invalid Moves: ${context.parsed.x.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Average Invalid Moves Per Game'
                    }
                }
            }
        }
    });
}

/**
 * Update all charts with new data
 * @param {Array} matchData - Array of chess match data
 */
function updateCharts(matchData) {
    if (!matchData || matchData.length === 0) {
        return;
    }

    // Update Model Wins Chart
    const modelWinsData = calculateModelWins(matchData);
    updateModelWinsChart(modelWinsData);

    // Update Color Wins Chart
    const colorWinsData = calculateColorWins(matchData);
    updateColorWinsChart(colorWinsData);

    // Update Termination Reasons Chart
    const terminationData = calculateTerminationReasons(matchData);
    updateTerminationChart(terminationData);

    // Update Invalid Moves Chart
    const invalidMovesData = calculateInvalidMovesByModel(matchData);
    updateInvalidMovesChart(invalidMovesData);
}

/**
 * Update the Model Wins Chart with new data
 * @param {Object} data - Object containing labels and data arrays
 */
function updateModelWinsChart(data) {
    if (!modelWinsChart) return;

    modelWinsChart.data.labels = data.labels;
    modelWinsChart.data.datasets[0].data = data.data;
    modelWinsChart.update();
}

/**
 * Update the Color Wins Chart with new data
 * @param {Object} data - Object containing labels and data arrays
 */
function updateColorWinsChart(data) {
    if (!colorWinsChart) return;

    colorWinsChart.data.labels = data.labels;
    colorWinsChart.data.datasets[0].data = data.data;
    colorWinsChart.update();
}

/**
 * Update the Termination Reasons Chart with new data
 * @param {Object} data - Object containing labels and data arrays
 */
function updateTerminationChart(data) {
    if (!terminationChart) return;

    terminationChart.data.labels = data.labels;
    terminationChart.data.datasets[0].data = data.data;
    terminationChart.update();
}

/**
 * Update the Invalid Moves Chart with new data
 * @param {Object} data - Object containing labels and data arrays
 */
function updateInvalidMovesChart(data) {
    if (!invalidMovesChart) return;

    invalidMovesChart.data.labels = data.labels;
    invalidMovesChart.data.datasets[0].data = data.data;
    invalidMovesChart.update();
}
