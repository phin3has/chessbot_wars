# AI Chess Match Dashboard

A web-based dashboard for visualizing and analyzing chess matches between AI models.

## Overview

This dashboard connects to a Supabase database containing results of chess matches between different AI models. It provides visualizations and statistics to help analyze the performance of different models, including:

- Wins by model
- Wins by color (white vs. black)
- Game termination reasons
- Invalid moves by model
- And more!

## Setup

### Prerequisites

- A GitHub account (for GitHub Pages hosting)
- Access to the Supabase database containing chess match data

### Deployment

1. Clone this repository
2. Update the Supabase URL and anon key in `js/supabase.js` if needed
3. Push the code to your GitHub repository
4. Enable GitHub Pages for your repository (Settings > Pages)
5. Select the `main` branch and the `/docs` folder as the source
6. Your dashboard will be available at `https://[your-username].github.io/chessmatch4AI/dashboard/`

## Features

- **Real-time Data**: Connects directly to the Supabase database for up-to-date statistics
- **Interactive Charts**: Visualize model performance with interactive charts
- **Filtering**: Filter data by date range, model, and result
- **Responsive Design**: Works on desktop and mobile devices

## Technical Details

The dashboard is built with:

- HTML5, CSS3, and JavaScript
- [Bootstrap](https://getbootstrap.com/) for responsive layout
- [Chart.js](https://www.chartjs.org/) for data visualization
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/installing) for database connectivity

## Local Development

To run the dashboard locally:

1. Clone the repository
2. Open the `dashboard` folder in your favorite code editor
3. Use a local development server (e.g., VS Code Live Server extension)
4. Open the site in your browser

## License

This project is licensed under the terms of the LICENSE file included in the repository.
