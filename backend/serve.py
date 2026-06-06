import pickle
from pathlib import Path
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler
from feature import FEATURES, FATIGUE_DISCOUNT, games_threshold, compute_team_wins, normalise_by_season, train_rf

_BASE = Path(__file__).parent
DATASET_PATH = _BASE / 'mvp_dataset.csv'
MODEL_PATH = _BASE / 'model' / 'rf_model.pkl'

def load_dataset() -> pd.DataFrame:
    return pd.read_csv(DATASET_PATH)


def load_model() -> RandomForestClassifier:
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

def _fatigue_names(df_labelled: pd.DataFrame, target_year: int) -> list[str]:
    return (
        df_labelled[(df_labelled['mvp_label'] == 1) & (df_labelled['year'] < target_year)]
        .sort_values('year', ascending=False)
        .head(2)['name']
        .tolist()
    )

def _build_training_set(df: pd.DataFrame, labeled_seasons, exclude_year: int) -> pd.DataFrame:
    df_train = df[df['year'].isin(labeled_seasons) & (df['year'] != exclude_year)].copy()
    df_train = df_train[df_train['G'] >= df_train['year'].apply(games_threshold)]
    df_train = compute_team_wins(df_train)
    df_train = normalise_by_season(df_train)
    return df_train

def _build_target_set(df: pd.DataFrame, target_year: int) -> pd.DataFrame:
    df_target = df[df['year'] == target_year].copy()
    df_target = df_target[df_target['G'] >= games_threshold(target_year)]
    df_target = compute_team_wins(df_target)
    return df_target

def predict_season(
    df: pd.DataFrame,
    target_year: int,
    pretrained_model: RandomForestClassifier | None = None,
) -> dict:
    seasons_with_mvp = df.groupby('year')['mvp_label'].sum()
    labeled_seasons = seasons_with_mvp[seasons_with_mvp > 0].index
    is_historical = target_year in labeled_seasons

    df_t = _build_target_set(df, target_year)

    if pretrained_model is not None and not is_historical:
        rf = pretrained_model
        df_for_fatigue = df[df['year'].isin(labeled_seasons)]
    else:
        df_train = _build_training_set(df, labeled_seasons, target_year)
        rf = train_rf(df_train)
        df_for_fatigue = df[df['year'].isin(labeled_seasons) & (df['year'] != target_year)]

    fatigue = _fatigue_names(df_for_fatigue, target_year)

    df_norm = df_t.copy()
    df_norm[FEATURES] = MinMaxScaler().fit_transform(df_norm[FEATURES])

    # Add probabilities back to the raw df_t so callers get unscaled stats and mvp_prob in the same DataFrame
    df_t['mvp_prob'] = rf.predict_proba(df_norm[FEATURES])[:, 1]
    df_t['mvp_prob_adjusted'] = df_t.apply(
        lambda r: r['mvp_prob'] * FATIGUE_DISCOUNT if r['name'] in fatigue else r['mvp_prob'],
        axis=1,
    )

    return {
        'predictions': df_t.sort_values('mvp_prob_adjusted', ascending=False),
        'fatigue_names': fatigue,
        'is_historical': is_historical,
    }


def simulate(
    df: pd.DataFrame,
    target_year: int,
    player_name: str,
    overrides: dict,
    pretrained_model: RandomForestClassifier | None = None,
) -> dict:
    """
    Replace one player's stats with overrides, recompute team_wins, renormalize, predict.
    Returns {mvp_prob, mvp_prob_adjusted, rank}.

    Limitation: User may end up tweaking Win-Shares and cause team_wins to be greater than full 82-games season. (impossible)
    But since we normalise team_wins anyways in our model, the limitation is less impactful.
    Since this is a what-if simulation for fun, we can accept this imperfection for now to avoid overcomplications.
    """
    seasons_with_mvp = df.groupby('year')['mvp_label'].sum()
    labeled_seasons = seasons_with_mvp[seasons_with_mvp > 0].index
    is_historical = target_year in labeled_seasons

    # Build target set without team_wins so we can recompute after overrides
    df_t = _build_target_set(df, target_year).drop(columns=['team_wins'])

    if not (df_t['name'] == player_name).any():
        raise ValueError(f"'{player_name}' not found in {target_year} (may not meet minimum games threshold).")

    raw_feature_cols = [f for f in FEATURES if f != 'team_wins']
    for col, val in overrides.items():
        if col in raw_feature_cols:
            df_t.loc[df_t['name'] == player_name, col] = float(val)

    df_t = compute_team_wins(df_t)

    if not (df_t['name'] == player_name).any():
        raise ValueError(f"'{player_name}' dropped after team_wins recomputation (traded player).")

    if pretrained_model is not None and not is_historical:
        rf = pretrained_model
        df_for_fatigue = df[df['year'].isin(labeled_seasons)]
    else:
        df_train = _build_training_set(df, labeled_seasons, target_year)
        rf = train_rf(df_train)
        df_for_fatigue = df[df['year'].isin(labeled_seasons) & (df['year'] != target_year)]

    fatigue = _fatigue_names(df_for_fatigue, target_year)

    df_norm = df_t.copy()
    df_norm[FEATURES] = MinMaxScaler().fit_transform(df_norm[FEATURES])
    df_t['mvp_prob'] = rf.predict_proba(df_norm[FEATURES])[:, 1]
    df_t['mvp_prob_adjusted'] = df_t.apply(
        lambda r: r['mvp_prob'] * FATIGUE_DISCOUNT if r['name'] in fatigue else r['mvp_prob'],
        axis=1,
    )

    df_ranked = df_t.sort_values('mvp_prob_adjusted', ascending=False).reset_index(drop=True)
    player_row = df_ranked[df_ranked['name'] == player_name]

    return {
        'mvp_prob': round(float(player_row['mvp_prob'].iloc[0]), 4),
        'mvp_prob_adjusted': round(float(player_row['mvp_prob_adjusted'].iloc[0]), 4),
        'rank': int(player_row.index[0]) + 1,
    }