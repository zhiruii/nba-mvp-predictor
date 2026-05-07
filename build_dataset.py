import pandas as pd
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

def load_advanced(season_code, path):
    df = pd.read_excel(path)

    # Keep only the multi-team totals row for traded players
    totals_mask = df['Team'].str.match(r'\d+TM', na=False)
    traded_players = set(df.loc[totals_mask, 'Player'])
    df = df[~df['Player'].isin(traded_players) | totals_mask]

    df = df[df['MP'] > 1560]

    df = df.rename(columns={
        'Player': 'name',
        'Age':    'age',
        'Team':   'team',
        'MP':     'minutes_played',
        'TS%':    'TS',
    })

    return df[['name', 'age', 'team', 'minutes_played',
               'PER', 'TS', 'WS', 'BPM', 'VORP']].reset_index(drop=True)

def load_per_game(season_code, path):
    df = pd.read_excel(path)

    totals_mask = df['Team'].str.match(r'\d+TM', na=False)
    traded_players = set(df.loc[totals_mask, 'Player'])
    df = df[~df['Player'].isin(traded_players) | totals_mask]

    df = df[df['G'] * df['MP'] > 1560]

    df = df.rename(columns={
        'Player': 'name',
        'Age':    'age',
        'Team':   'team',
        'PTS':    'PPG',
    })

    return df[['name', 'age', 'team', 'PPG', 'AST', 'TRB', 'BLK', 'STL',
               'G', 'MP']].reset_index(drop=True)


def load_mvp_votes(season_code, path):

    # mvp_label: 1 for the actual MVP winner, 0 for everyone else.

    df = pd.read_excel(path, header=1)

    df = df.rename(columns={'Player': 'name'})

    df['mvp_label'] = (df['Rank'] == 1).astype(int)

    return df[['name', 'mvp_label']]



all_seasons = []

for year in range(1984, 2026):
    season_code = f"{(year - 1) % 100:02d}{year % 100:02d}"
    season_dir  = os.path.join(DATA_DIR, f"{season_code} season")

    adv_path = os.path.join(season_dir, f"{season_code} advanced.xlsx")
    pg_path  = os.path.join(season_dir, f"{season_code} per game.xlsx")
    mvp_path = os.path.join(season_dir, f"{season_code} actual mvp.xlsx")


    try:
        adv = load_advanced(season_code, adv_path)
        pg  = load_per_game(season_code, pg_path)
    except Exception as e:
        print(f"[SKIP] {season_code} — stats error: {e}")
        continue

    # merge on (name, age, team)
    merged = pd.merge(adv, pg, on=['name', 'age', 'team'], how='inner')

    # load MVP labels
    # The latest season won't have an MVP file yet, we just skip attaching labels
    if os.path.exists(mvp_path):
        try:
            votes = load_mvp_votes(season_code, mvp_path)
            # Left join: every qualified player gets a row; those not in the
            # voting file get NaN, which we fill with 0 (didn't receive votes)
            merged = pd.merge(merged, votes, on='name', how='left')
            merged['mvp_label'] = merged['mvp_label'].fillna(0).astype(int)
        except Exception as e:
            print(f"[WARN] {season_code} — MVP file error: {e}")
            merged['mvp_label'] = 0
    else:
        # Latest season, no labels yet
        merged['mvp_label'] = None
        print(f"[INFO] {season_code} — no MVP file (latest season, as expected)")

    merged['year'] = year

    all_seasons.append(merged)
    print(f"[OK]   {season_code} — {len(merged)} qualified players")


full_df = pd.concat(all_seasons, ignore_index=True)

print(f"\n{'='*50}")
print(f"Total rows across all seasons : {len(full_df)}")
print(f"Seasons loaded                : {full_df['year'].nunique()}")
print(f"MVP winners (label = 1)       : {full_df['mvp_label'].sum()}")
print(f"Columns                       : {list(full_df.columns)}")
print(f"\nSample (first 3 rows):")
print(full_df.head(3).to_string())


# Save to CSV
out_path = os.path.join(BASE_DIR, "mvp_dataset.csv")
full_df.to_csv(out_path, index=False)
print(f"\nDataset saved to: {out_path}")
