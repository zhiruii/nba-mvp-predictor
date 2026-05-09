import os
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import FEATURES, load_dataset, load_model, predict_season, simulate

CURRENT_YEAR = 2026
# Stats shown in API responses (raw, not normalized)
DISPLAY_STATS = ['WS', 'PER', 'BPM', 'VORP', 'PPG', 'AST', 'TRB', 'STL', 'BLK', 'TS', 'G']

df: pd.DataFrame | None = None
rf_model = None
_cache: dict[int, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    global df, rf_model
    df = load_dataset()
    rf_model = load_model()
    yield


app = FastAPI(title="NBA MVP Predictor API", lifespan=lifespan)

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Helpers ---

def _labeled_seasons():
    counts = df.groupby('year')['mvp_label'].sum()
    return counts[counts > 0].index


def _season_result(year: int) -> dict:
    """Return (and cache) prediction result for a season."""
    if year not in _cache:
        use_pretrained = year not in _labeled_seasons()
        _cache[year] = predict_season(df, year, rf_model if use_pretrained else None)
    return _cache[year]


def _safe_float(val) -> float | None:
    try:
        return round(float(val), 3) if pd.notna(val) else None
    except (TypeError, ValueError):
        return None


def _format_player(rank: int, row: pd.Series) -> dict:
    return {
        'rank': rank,
        'name': row['name'],
        'team': row['team'],
        'mvp_prob': round(float(row['mvp_prob']), 4),
        'mvp_prob_adjusted': round(float(row['mvp_prob_adjusted']), 4),
        'stats': {c: _safe_float(row[c]) for c in DISPLAY_STATS if c in row.index},
    }


# --- Endpoints ---

@app.get("/api/seasons")
def seasons():
    """List all available seasons: historical (confirmed MVP) and current."""
    historical = sorted(_labeled_seasons().tolist())
    return {'historical': historical, 'current': CURRENT_YEAR}


@app.get("/api/players/{year}")
def players(year: int):
    """List all player names available for a given season year."""
    rows = df[df['year'] == year]
    if rows.empty:
        raise HTTPException(status_code=404, detail=f"No data for {year}.")
    return {'year': year, 'players': sorted(rows['name'].unique().tolist())}


@app.get("/api/current-season")
def current_season():
    """Top-15 MVP predictions for the current (2026) season."""
    result = _season_result(CURRENT_YEAR)
    preds = result['predictions']
    return {
        'year': CURRENT_YEAR,
        'predictions': [
            _format_player(i + 1, row)
            for i, (_, row) in enumerate(preds.head(15).iterrows())
        ],
        'fatigue_players': result['fatigue_names'],
    }


@app.get("/api/historical/{year}")
def historical(year: int):
    """Top-15 MVP predictions for a historical season, with the actual MVP and model rank."""
    if year < 1985 or year > 2025:
        raise HTTPException(status_code=422, detail="Year must be between 1985 and 2025.")
    if year not in df['year'].values:
        raise HTTPException(status_code=404, detail=f"No data found for {year}.")
    if year not in _labeled_seasons():
        raise HTTPException(status_code=422, detail=f"{year} has no confirmed MVP result.")

    result = _season_result(year)
    preds = result['predictions']
    ranked = [_format_player(i + 1, row) for i, (_, row) in enumerate(preds.head(15).iterrows())]

    actual_row = df[(df['year'] == year) & (df['mvp_label'] == 1)]
    actual_mvp = actual_row['name'].values[0] if not actual_row.empty else None
    model_rank = next((p['rank'] for p in ranked if p['name'] == actual_mvp), None)

    return {
        'year': year,
        'predictions': ranked,
        'actual_mvp': actual_mvp,
        'model_rank': model_rank,
        'fatigue_players': result['fatigue_names'],
    }


@app.get("/api/compare")
def compare(
    player1: str,
    player2: str,
    year: int = Query(..., ge=1985),
):
    """
    Return raw stats and MVP probability for two players in the same season.
    Players who didn't meet the games threshold will have null probabilities.
    """
    if year > CURRENT_YEAR:
        raise HTTPException(status_code=422, detail=f"Year must be at most {CURRENT_YEAR}.")

    result = _season_result(year)
    preds_df = result['predictions']

    out = []
    for name in [player1, player2]:
        raw = df[(df['year'] == year) & (df['name'] == name)]
        if raw.empty:
            raise HTTPException(status_code=404, detail=f"'{name}' not found for {year}.")

        pred = preds_df[preds_df['name'] == name]
        if not pred.empty:
            r = pred.iloc[0]
            stats = {c: _safe_float(r[c]) for c in DISPLAY_STATS if c in r.index}
        else:
            r = raw.iloc[0]
            # team_wins not available for games-filtered players
            stats = {c: _safe_float(r[c]) for c in DISPLAY_STATS if c in r.index and c != 'team_wins'}

        out.append({
            'name': name,
            'team': raw.iloc[0]['team'],
            'mvp_prob': round(float(pred['mvp_prob'].iloc[0]), 4) if not pred.empty else None,
            'mvp_prob_adjusted': round(float(pred['mvp_prob_adjusted'].iloc[0]), 4) if not pred.empty else None,
            'stats': stats,
        })

    return {'year': year, 'players': out}


class SimulateRequest(BaseModel):
    year: int = Field(..., ge=1985)
    player_name: str
    WS: float | None = None
    PER: float | None = None
    BPM: float | None = None
    VORP: float | None = None
    PPG: float | None = None
    AST: float | None = None


@app.post("/api/simulate")
def simulate_endpoint(req: SimulateRequest):
    """
    Replace a player's stats with custom values and return their new MVP probability and rank.
    Historical seasons require on-the-fly training (~5s). Current season uses the saved model.
    """
    if req.year > CURRENT_YEAR:
        raise HTTPException(status_code=422, detail=f"Year must be at most {CURRENT_YEAR}.")

    overrides = {k: v for k, v in req.model_dump().items() if k in FEATURES and v is not None}
    use_pretrained = req.year not in _labeled_seasons()

    try:
        return simulate(
            df, req.year, req.player_name, overrides,
            pretrained_model=rf_model if use_pretrained else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/raw-stats/{year}/{player_name}")
def raw_stats(year: int, player_name: str):
    """Return a player's raw stats directly from the dataset — no model inference, instant response."""
    rows = df[(df['year'] == year) & (df['name'] == player_name)]
    if rows.empty:
        raise HTTPException(status_code=404, detail=f"'{player_name}' not found for {year}.")
    row = rows.iloc[0]
    return {
        'name': player_name,
        'year': year,
        'is_actual_mvp': bool(row['mvp_label'] == 1),
        'stats': {c: _safe_float(row[c]) for c in DISPLAY_STATS if c in row.index},
    }
