// Description: Supabase client initialization and data fetching functions

// Supabase connection details
const supabaseUrl = 'https://wtqgforevtuaigkubwwf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cWdmb3JldnR1YWlna3Vid3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2ODE5MjMsImV4cCI6MjA1ODI1NzkyM30.uccdNnxA2b0TirIAaaQx1LN8wJlUVERnD_ge7GF1Wi0';

// Initialize Supabase client - we'll initialize this when needed
let supabase = null;

// Cache for storing fetched data
let cachedMatchData = null;
let lastFetchTime = null;

/**
 * Ensure Supabase client is initialized
 * @returns {boolean} - Whether initialization was successful
 */
function ensureSupabaseInitialized() {
    if (supabase) return true;
    
    try {
        // Check for global client first
        if (window.supabaseClient) {
            supabase = window.supabaseClient;
            console.log('Using global supabaseClient');
            return true;
        }
        
        // Initialize directly when needed
        if (typeof window.supabase !== 'undefined') {
            // Direct initialization with the CDN-loaded global object
            supabase = window.supabase.createClient(
                supabaseUrl, 
                supabaseKey
            );
            console.log('Supabase client initialized on demand');
            return true;
        } else {
            console.error('Supabase client not available. Make sure to include the CDN script.');
            return false;
        }
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
        return false;
    }
}

/**
 * Fetch all chess match data from Supabase
 * @param {boolean} forceRefresh - Whether to force a refresh of the data
 * @returns {Promise<Array>} - Array of match data
 */
async function fetchChessMatchData(forceRefresh = false) {
    console.log('Fetching chess match data...');
    
    // Initialize Supabase client if needed
    if (!ensureSupabaseInitialized()) {
        console.warn('Trying fallback initialization...');
        // Last resort: try to use the global client directly
        if (window.supabaseClient) {
            console.log('Using global supabaseClient directly');
            supabase = window.supabaseClient;
        } else {
            console.error('Cannot fetch data: No Supabase client available');
            return [];
        }
    }
    
    // If we have cached data and it's less than 5 minutes old, use it
    const now = new Date();
    if (
        !forceRefresh && 
        cachedMatchData && 
        lastFetchTime && 
        ((now - lastFetchTime) / 1000 / 60) < 5
    ) {
        return cachedMatchData;
    }

    try {
        // Debug: Log the URL we're connecting to
        console.log('Supabase URL:', supabaseUrl);
        
        // Make the query
        const { data, error } = await supabase
            .from('ai_chess_match_data')
            .select('*')
            .order('date', { ascending: false });
        
        console.log('Query response:', { data, error });

        if (error) {
            console.error('Error fetching data:', error);
            throw error;
        }

        // Check if data is empty but we got a 200 response
        if (!data || data.length === 0) {
            console.warn('Received empty data array with 200 OK response');
            console.warn('This could be due to Row Level Security (RLS) settings or table permissions');
        }

        // Update cache
        cachedMatchData = data || [];
        lastFetchTime = now;
        
        return data || [];
    } catch (error) {
        console.error('Failed to fetch chess match data:', error);
        throw error;
    }
}

/**
 * Fetch filtered chess match data based on criteria
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} - Array of filtered match data
 */
async function fetchFilteredChessMatchData(filters = {}) {
    // Initialize Supabase client if needed
    if (!ensureSupabaseInitialized()) {
        console.error('Cannot fetch filtered data: Supabase client not initialized');
        return [];
    }
    
    try {
        let query = supabase.from('ai_chess_match_data').select('*');

        // Apply date filter
        if (filters.dateRange && filters.dateRange !== 'all') {
            const now = new Date();
            let startDate;

            switch (filters.dateRange) {
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    // No date filter
                    break;
            }

            if (startDate) {
                query = query.gte('date', startDate.toISOString());
            }
        }

        // Apply model filter
        if (filters.model && filters.model !== 'all') {
            // Use or filter with proper syntax
            query = query.or(`white_model.eq.${filters.model},black_model.eq.${filters.model}`);
        }

        // Apply result filter
        if (filters.result && filters.result !== 'all') {
            if (filters.result === 'win') {
                query = query.not('result', 'eq', '1/2-1/2').not('result', 'eq', 'ERR');
            } else if (filters.result === 'draw') {
                query = query.eq('result', '1/2-1/2');
            }
        }

        // Execute query
        const { data, error } = await query.order('date', { ascending: false });

        if (error) {
            console.error('Error fetching filtered data:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to fetch filtered chess match data:', error);
        throw error;
    }
}

/**
 * Get a list of all unique models that have played games
 * @returns {Promise<Array>} - Array of unique model names
 */
async function getUniqueModels() {
    try {
        const data = await fetchChessMatchData();
        
        // Extract unique model names from both white and black models
        const allModels = [];
        data.forEach(game => {
            if (game.white_model) allModels.push(game.white_model);
            if (game.black_model) allModels.push(game.black_model);
        });
        
        // Remove duplicates
        const uniqueModels = [...new Set(allModels)];
        return uniqueModels;
    } catch (error) {
        console.error('Failed to get unique models:', error);
        return [];
    }
}
