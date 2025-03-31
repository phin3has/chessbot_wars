# ChessBot Wars

A system for conducting and analyzing chess matches between different AI language models.

![Chess Pieces](https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&q=80&w=1000)

## 🎯 Overview

ChessBot Wars automatically conducts chess matches between different AI language models (like GPT-4o and Claude 3.7 Sonnet), tracks performance, and visualizes results in a web dashboard. The project aims to benchmark and compare the chess-playing capabilities of different large language models.

**Live Dashboard:** [https://phin3has.github.io/chessbot_wars/dashboard/index.html](https://phin3has.github.io/chessbot_wars/dashboard/index.html)

## ✨ Features

- **Automated Matches**: Conducts full chess matches between any compatible AI models
- **Error Handling**: Robust recovery from invalid moves and API failures
- **Data Storage**: Stores game data in Supabase for persistence and analytics
- **Performance Analytics**: Tracks win rates, invalid moves, and termination reasons
- **Interactive Dashboard**: Web interface to explore match statistics and results

## 🧩 Components

### Backend (`matchAI.py`)
- Python script that manages chess matches between AI models
- Connects to AI model APIs to request chess moves
- Records match data and uploads to Supabase
- Handles error recovery for invalid moves and API failures

### Frontend Dashboard
- Interactive web dashboard built with HTML, CSS, and JavaScript
- Visualizes match statistics using Chart.js
- Connects to Supabase for real-time data
- Provides filtering capabilities for data analysis

## 🔧 Tech Stack

- **Backend**: Python with [python-chess](https://python-chess.readthedocs.io/), Requests, python-dotenv
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Frontend**: HTML, CSS, JavaScript
- **Visualizations**: [Chart.js](https://www.chartjs.org/)
- **Styling**: [Bootstrap 5](https://getbootstrap.com/)

## 📊 Dashboard Features

The dashboard provides several analytics:

- Overall statistics (total games, draws, white win rate)
- Win rates by model
- Win rates by color (white/black)
- Game termination reasons
- Average invalid moves by model
- Detailed game history table

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- API keys for the AI models you want to test
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chessbot_wars.git
   cd chessbot_wars
   ```

2. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file based on the `env-template` file:
   ```bash
   cp env-template .env
   ```

4. Configure your `.env` file with your API keys and Supabase credentials:
   ```
   MODEL1_NAME=your-model-name
   MODEL1_API_KEY=your-api-key
   MODEL1_API_URL=your-api-url
   
   MODEL2_NAME=another-model-name
   MODEL2_API_KEY=another-api-key
   MODEL2_API_URL=another-api-url
   
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   ```

### Running Chess Matches

To run a match between two AI models:

```bash
python matchAI.py
```

The script will:
1. Initialize a new game with random color assignment
2. Alternate between models for chess moves
3. Handle game termination and record the result
4. Upload match data to Supabase

### Accessing the Dashboard

The dashboard is a static website that connects to your Supabase database:

1. Open `dashboard/index.html` in your browser, or host it on a web server
2. The dashboard will automatically fetch and display match data from Supabase
3. Use the filters to analyze specific timeframes or models

## 🛠 Project Structure

```
chessbot_wars/
├── .env                 # Environment variables (API keys, etc.)
├── env-template         # Template for .env file
├── matchAI.py           # Main script for conducting chess matches
├── requirements.txt     # Python dependencies
├── dashboard/           # Web dashboard files
│   ├── index.html       # Main dashboard HTML
│   ├── css/             # Stylesheet directory
│   │   └── style.css    # Custom styles
│   ├── js/              # JavaScript directory
│       ├── app.js       # Main application logic
│       ├── charts.js    # Chart initialization and updates
│       ├── statistics.js # Statistical calculations
│       └── supabase.js  # Supabase client and data fetching
```

## 📈 View Results

The live dashboard with up-to-date match results can be viewed at:
[https://phin3has.github.io/chessbot_wars/dashboard/index.html](https://phin3has.github.io/chessbot_wars/dashboard/index.html)

## 🤝 Contributing

Contributions are welcome! Feel free to submit pull requests or open issues to improve the project.

## 📄 License

This project is licensed under the terms included in the LICENSE file.
