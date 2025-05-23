import os
import json
import time
import random
import requests
import chess
import re
from dotenv import load_dotenv
from datetime import datetime
import supabase

# Add this helper function outside the class
def get_legal_moves_san(board):
    """Get a list of legal moves in Standard Algebraic Notation (SAN)."""
    legal_moves_san = []
    for move in board.legal_moves:
        san = board.san(move)
        legal_moves_san.append(san)
    return legal_moves_san

# Monkey patch the Board class to add the legal_moves_san property
chess.Board.legal_moves_san = property(get_legal_moves_san)

# Load environment variables from .env file
load_dotenv()

class ChessMediator:
    def __init__(self):
        """Initialize the chess mediator."""
        self.board = chess.Board()
        
        # Initialize Supabase client with service role key for bypassing RLS
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")  # Use service role key instead
        self.supabase_client = supabase.create_client(supabase_url, supabase_key)
        
        self.current_game = {
            "id": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "date": datetime.now().isoformat(),
            "white_model": None,
            "black_model": None,
            "moves": [],
            "result": None,
            "winner": None,
            "termination_reason": None,
            "invalid_moves_count": 0  # Track invalid moves
        }
        self.load_results()
        
    def load_results(self):
        """Load existing game results from Supabase."""
        try:
            # Fetch games from Supabase
            response = self.supabase_client.table('ai_chess_match_data').select('*').execute()
            self.results = {"games": response.data}
        except Exception as e:
            print(f"Error loading results from Supabase: {e}")
            self.results = {"games": []}
    
    def save_game_to_supabase(self):
        """Save game results to Supabase."""
        try:
            # Create a record in the ai_chess_match_data table
            game_data = {
                "game_id": self.current_game["id"],
                "date": self.current_game["date"],
                "white_model": self.current_game["white_model"],
                "black_model": self.current_game["black_model"],
                "result": self.current_game["result"],
                "winner": self.current_game["winner"],
                "termination_reason": self.current_game["termination_reason"],
                "invalid_moves": self.current_game["invalid_moves_count"],
                "moves": json.dumps(self.current_game["moves"])  # Store moves as JSON
            }
            
            # Insert game data
            self.supabase_client.table('ai_chess_match_data').insert(game_data).execute()
                
            print(f"Game saved to Supabase database")
            
        except Exception as e:
            print(f"Error saving game to Supabase: {e}")
            # Fallback to JSON file if Supabase save fails
            fallback_file = "chess_results_fallback.json"
            with open(fallback_file, "w") as f:
                json.dump(self.current_game, f, indent=2)
            print(f"Game saved to fallback file: {fallback_file}")
            
    def make_api_call(self, model_api_info, prompt):
        """Make API call to the AI model with error handling and retries."""
        api_key = model_api_info["api_key"]
        model_name = model_api_info["model_name"]
        api_url = model_api_info["api_url"]
        
        # Configure headers and data based on API provider
        if "openai" in api_url.lower():
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7
            }
        elif "anthropic" in api_url.lower():
            headers = {
                "x-api-key": api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            }
            data = {
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,
                "temperature": 0.7
            }
        else:
            # Generic format - adjust as needed
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            data = {
                "model": model_name,
                "prompt": prompt,
                "max_tokens": 300,
                "temperature": 0.7
            }
        
        # Try the API call with retries
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                response = requests.post(api_url, headers=headers, json=data, timeout=30)
                response.raise_for_status()
                
                # Parse response based on API format
                if "openai" in api_url.lower():
                    return response.json()["choices"][0]["message"]["content"]
                elif "anthropic" in api_url.lower():
                    return response.json()["content"][0]["text"]
                else:
                    # Generic parsing - adjust as needed
                    return response.json().get("text", response.json().get("output", ""))
                
            except requests.exceptions.RequestException as e:
                print(f"API call failed (attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    print(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    print("All retry attempts failed. Falling back to default move.")
                    # Return a simple, valid chess move as a fallback
                    return "e4" if "Black" not in prompt else "e5"

    def play_game(self, model1_info, model2_info):
        """Play a full chess game between two AI models."""
        # Randomly assign colors
        if random.choice([True, False]):
            white_model = model1_info
            black_model = model2_info
        else:
            white_model = model2_info
            black_model = model1_info
            
        print(f"White: {white_model['model_name']}")
        print(f"Black: {black_model['model_name']}")
        
        self.current_game["white_model"] = white_model["model_name"]
        self.current_game["black_model"] = black_model["model_name"]
        self.current_game["invalid_moves_count"] = 0  # Reset invalid moves counter
        
        self.board = chess.Board()
        game_history = []
        
        # Game loop
        while not self.board.is_game_over():
            current_fen = self.board.fen()
            current_player = white_model if self.board.turn == chess.WHITE else black_model
            opponent = black_model if self.board.turn == chess.WHITE else white_model
            color = "White" if self.board.turn == chess.WHITE else "Black"
            
            # Create prompt for the current player
            if len(game_history) == 0:
                prompt = (
                    f"You are playing chess as {color}. "
                    f"Please make the opening move. "
                    f"Respond with only the algebraic notation of your move (e.g., 'e4')."
                )
            else:
                prompt = (
                    f"We are playing chess. You are {color}. "
                    f"The current board state in FEN is: {current_fen}\n"
                    f"Move history: {', '.join(game_history)}\n"
                    f"Please make your next move. "
                    f"Respond with only the algebraic notation of your move (e.g., 'e4')."
                )
            
            # Get move from the AI
            print(f"{color} ({current_player['model_name']}) thinking...")
            move_text = self.make_api_call(current_player, prompt).strip()
            
            # Clean up the response to extract just the move
            move_text = move_text.strip()
            # Handle potential responses with explanations
            if ' ' in move_text:
                potential_moves = move_text.split()
                # Look for standard algebraic notation patterns like e4, Nf3, Bxc6, O-O
                for potential_move in potential_moves:
                    # Remove any punctuation except for required chess symbols
                    cleaned_move = ''.join(c for c in potential_move if c.isalnum() or c in 'x+-=')
                    # Common chess move patterns
                    if (
                        # Pawn moves (e4, e2e4)
                        (len(cleaned_move) == 2 and cleaned_move[0].lower() in 'abcdefgh' and cleaned_move[1] in '12345678') or
                        # Piece moves (Nf3, Bc4)
                        (len(cleaned_move) == 3 and cleaned_move[0].upper() in 'NBRQK' and cleaned_move[1].lower() in 'abcdefgh' and cleaned_move[2] in '12345678') or
                        # Captures (exd5, Bxc6)
                        ('x' in cleaned_move) or
                        # Castling
                        (cleaned_move.upper() in ['OO', 'OOO', 'O-O', 'O-O-O']) or
                        # UCI format (e2e4, g1f3)
                        (len(cleaned_move) == 4 and cleaned_move[0].lower() in 'abcdefgh' and cleaned_move[1] in '12345678' and 
                         cleaned_move[2].lower() in 'abcdefgh' and cleaned_move[3] in '12345678')
                    ):
                        move_text = cleaned_move
                        break
            
            # Standardize castling notation
            if move_text.upper() in ['OO', 'O-O', '0-0']:
                move_text = 'O-O'
            elif move_text.upper() in ['OOO', 'O-O-O', '0-0-0']:
                move_text = 'O-O-O'
            
            # Try to parse and apply the move
            try:
                # First attempt to parse as Standard Algebraic Notation (SAN)
                try:
                    move = self.board.parse_san(move_text)
                    valid_move = True
                except ValueError:
                    valid_move = False
                
                # If SAN parsing fails, try as UCI notation
                if not valid_move:
                    try:
                        move = chess.Move.from_uci(move_text)
                        if move not in self.board.legal_moves:
                            valid_move = False
                        else:
                            valid_move = True
                    except ValueError:
                        valid_move = False
                
                if not valid_move:
                    # Increment invalid move counter
                    self.current_game["invalid_moves_count"] += 1
                    print(f"Invalid move: {move_text} - Total invalid moves: {self.current_game['invalid_moves_count']}")
                    raise ValueError(f"Could not parse move: {move_text}")
                
                # Apply the valid move and record it properly
                move_uci = move.uci()
                
                # Get SAN representation before pushing the move
                try:
                    move_san = self.board.san(move)
                except ValueError:
                    # If conversion fails, use UCI notation
                    move_san = move_uci
                
                # Now push the move to the board
                self.board.push(move)
                
                game_history.append(move_san)
                print(f"{color} plays: {move_san}")
                self.current_game["moves"].append({
                    "color": color.lower(),
                    "model": current_player["model_name"],
                    "move": move_san,
                    "fen": self.board.fen()
                })
                
            except Exception as e:
                # Increment invalid move counter for any exceptions in move processing
                self.current_game["invalid_moves_count"] += 1
                print(f"Error processing move: {e}")
                print(f"Invalid move detected. Total invalid moves: {self.current_game['invalid_moves_count']}")
                print(f"Current game state: {self.board.fen()}")
                print(f"Board position:")
                print(self.board)
                print(f"Valid moves: {[self.board.san(m) for m in self.board.legal_moves]}")
                
                # Try to recover with a fallback move
                if list(self.board.legal_moves):
                    # Check if this is a rook or queen capture move first
                    if move_text.startswith('Q') and 'x' in move_text:
                        target_square = move_text.split('x')[1]
                        print(f"Looking for rook captures to {target_square}...")
                        
                        try:
                            for m in self.board.legal_moves:
                                to_sq = chess.square_name(m.to_square)
                                if to_sq == target_square and 'x' in self.board.san(m):
                                    # Found a capture to this square
                                    move = m
                                    move_san = self.board.san(move)
                                    valid_move = True
                                    print(f"Using {move_san} instead of {move_text}")
                                    
                                    # Apply the move and continue
                                    self.board.push(move)
                                    game_history.append(move_san)
                                    print(f"{color} plays: {move_san}")
                                    self.current_game["moves"].append({
                                        "color": color.lower(),
                                        "model": current_player["model_name"],
                                        "move": move_san,
                                        "fen": self.board.fen()
                                    })
                                    continue
                        except Exception as capture_error:
                            print(f"Error finding capture: {capture_error}")
                    
                    # If we couldn't find a specific capture, use a random legal move
                    print("Selecting a fallback move...")
                    move = list(self.board.legal_moves)[0]
                    move_san = self.board.san(move)
                    
                    # Apply the move and continue
                    try:
                        self.board.push(move)
                        game_history.append(move_san)
                        print(f"{color} plays (fallback): {move_san}")
                        self.current_game["moves"].append({
                            "color": color.lower(),
                            "model": current_player["model_name"],
                            "move": move_san,
                            "fen": self.board.fen()
                        })
                        continue
                    except Exception as push_error:
                        print(f"Error applying fallback move: {push_error}")
                
                # If all recovery attempts failed, save game and exit
                self.save_game_and_continue(f"Error processing move: {str(e)}")
                break
                
            # Wait to avoid rate limiting
            time.sleep(1)
        
        # Game ended normally
        if not self.current_game["result"]:
            if self.board.is_checkmate():
                winner_color = "Black" if self.board.turn == chess.WHITE else "White"
                winner_model = black_model["model_name"] if winner_color == "Black" else white_model["model_name"]
                self.current_game["result"] = "0-1" if winner_color == "Black" else "1-0"
                self.current_game["winner"] = winner_model
                self.current_game["termination_reason"] = "Checkmate"
                print(f"{winner_color} ({winner_model}) wins by checkmate!")
            elif self.board.is_stalemate():
                self.current_game["result"] = "1/2-1/2"
                self.current_game["termination_reason"] = "Stalemate"
                print("Game ended in stalemate")
            elif self.board.is_insufficient_material():
                self.current_game["result"] = "1/2-1/2"
                self.current_game["termination_reason"] = "Insufficient material"
                print("Game ended due to insufficient material")
            else:
                self.current_game["result"] = "1/2-1/2"
                self.current_game["termination_reason"] = "Other draw"
                print("Game ended in a draw")
                
        # Save game to Supabase
        self.save_game_to_supabase()
        print(f"Game saved to Supabase database with {self.current_game['invalid_moves_count']} invalid moves (stored as 'invalid_moves')")
        
    def save_game_and_continue(self, termination_reason):
        """Save the game with an error termination and continue."""
        self.current_game["termination_reason"] = termination_reason
        self.current_game["result"] = "ERR"
        self.save_game_to_supabase()
        
    # Removed generate_stats, generate_visualizations, and generate_readme_content methods
    # as they are no longer needed since we're interacting with the database separately
        

def main():
    """Main function to run the chess tournament."""
    # Load environment variables
    load_dotenv()
    
    # Check if service key is available
    if not os.getenv("SUPABASE_SERVICE_KEY"):
        print("ERROR: SUPABASE_SERVICE_KEY not found in environment variables.")
        print("Row Level Security requires a service role key to bypass policies.")
        print("Please add this key to your .env file and try again.")
        return
        
    mediator = ChessMediator()
    
    # Configure your models
    model1_info = {
        "model_name": os.getenv("MODEL1_NAME"),
        "api_key": os.getenv("MODEL1_API_KEY"),
        "api_url": os.getenv("MODEL1_API_URL")
    }
    
    model2_info = {
        "model_name": os.getenv("MODEL2_NAME"),
        "api_key": os.getenv("MODEL2_API_KEY"),
        "api_url": os.getenv("MODEL2_API_URL")
    }
    
    # Play a game
    mediator.play_game(model1_info, model2_info)
    

if __name__ == "__main__":
    main()