import pandas as pd
import os

BASE_DIR = os.path.dirname(__file__)

def historical_MVP_race_table(year):
    season_code = f"{(year - 1) % 100:02d}{year % 100:02d}"
    path = os.path.join(BASE_DIR, f"{season_code} season", f"{season_code} actual mvp.xlsx")

    if not os.path.exists(path):
        return f"No MVP voting data available for the {season_code} season."

    # Row 0 is a group header (Voting / Per Game / Shooting / Advanced); row 1 has real column names
    df = pd.read_excel(path, header=1)

    return df[['Rank', 'Player']].head(6).to_string(index=False)
