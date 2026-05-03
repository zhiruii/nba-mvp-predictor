import pandas as pd
import os

BASE_DIR = os.path.dirname(__file__)

def reg_stats_table(year):
    season_code = f"{(year - 1) % 100:02d}{year % 100:02d}"
    path = os.path.join(BASE_DIR, f"{season_code} season", f"{season_code} per game.xlsx")

    if not os.path.exists(path):
        raise ValueError(f"No per-game stats file found for season {season_code}: {path}")

    df = pd.read_excel(path)

    # For traded players, keep only the multi-team totals row (e.g. "2TM", "3TM")
    totals_mask = df['Team'].str.match(r'\d+TM', na=False)
    traded_players = set(df.loc[totals_mask, 'Player'])
    df = df[~df['Player'].isin(traded_players) | totals_mask]

    # MP is per-game here, so multiply by G for total minutes
    df = df[df['G'] * df['MP'] > 1560]

    df = df.rename(columns={
        'Player': 'name',
        'Age': 'age',
        'Team': 'team',
        'PTS': 'PPG',
    })

    return df[['name', 'age', 'team', 'PPG', 'AST', 'TRB', 'BLK', 'STL']].reset_index(drop=True)
