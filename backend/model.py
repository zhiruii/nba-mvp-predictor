import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler

FEATURES = ['WS', 'PER', 'BPM', 'VORP', 'PPG', 'AST', 'team_wins']
FATIGUE_DISCOUNT = 0.90
_BASE = Path(__file__).parent
DATASET_PATH = _BASE / 'mvp_dataset.csv'
MODEL_PATH = _BASE / 'model' / 'rf_model.pkl'


def load_dataset() -> pd.DataFrame:
    return pd.read_csv(DATASET_PATH)


def load_model() -> RandomForestClassifier:
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)


def _games_threshold(year: int) -> int:
    return 65 if year >= 2024 else 49


def _compute_team_wins(df: pd.DataFrame) -> pd.Series:
    non_traded = df[~df['team'].isin(['TOT', '2TM', '3TM'])]
    return non_traded.groupby(['team', 'year'])['WS'].sum().rename('team_wins')


def _normalise_group(group: pd.DataFrame) -> pd.DataFrame:
    group[FEATURES] = MinMaxScaler().fit_transform(group[FEATURES])
    return group


def _fatigue_names(df_labelled: pd.DataFrame, target_year: int) -> list[str]:
    return (
        df_labelled[(df_labelled['mvp_label'] == 1) & (df_labelled['year'] < target_year)]
        .sort_values('year', ascending=False)
        .head(2)['name']
        .tolist()
    )


def _build_training_set(df: pd.DataFrame, labeled_seasons, exclude_year: int) -> pd.DataFrame:
    df_train = df[df['year'].isin(labeled_seasons) & (df['year'] != exclude_year)].copy()
    mask_hist = (df_train['year'] < 2024) & (df_train['G'] >= 49)
    mask_mod = (df_train['year'] >= 2024) & (df_train['G'] >= 65)
    df_train = df_train[mask_hist | mask_mod]

    tw = _compute_team_wins(df_train)
    df_train = df_train.join(tw, on=['team', 'year']).dropna(subset=['team_wins'])

    years = df_train['year'].reset_index(drop=True)
    df_train = (
        df_train.groupby('year', group_keys=False)
        .apply(_normalise_group, include_groups=False)
        .reset_index(drop=True)
    )
    # Since we are retraining the model and building the training set, min-max normalisations is needed.
    df_train['year'] = years
    return df_train


def _build_target_set(df: pd.DataFrame, target_year: int) -> pd.DataFrame:
    df_t = df[df['year'] == target_year].copy()
    df_t = df_t[df_t['G'] >= _games_threshold(target_year)]
    tw = _compute_team_wins(df_t)
    return df_t.join(tw, on=['team', 'year']).dropna(subset=['team_wins'])


def _train_rf(df_train: pd.DataFrame) -> RandomForestClassifier:
    rf = RandomForestClassifier(
        n_estimators=1000, max_features=0.3, min_samples_leaf=3,
        class_weight='balanced', oob_score=True, random_state=42,
    )
    rf.fit(df_train[FEATURES], df_train['mvp_label'])
    return rf


def predict_season(
    df: pd.DataFrame,
    target_year: int,
    pretrained_model: RandomForestClassifier | None = None,
) -> dict:
    """
    Returns dict with:
      predictions: DataFrame (raw stats + team_wins + mvp_prob + mvp_prob_adjusted), sorted desc
      fatigue_names: list of players who received the fatigue discount
      is_historical: whether target_year has a known MVP result
    
    pretrained_model: use pretrained model if target_year is not historical as pretrained model uses all hoistorical seasons.
    if target_year is historical, we want to train a new model excluding that season even if pretrained_model is provided.
    """
    seasons_with_mvp = df.groupby('year')['mvp_label'].sum()
    labeled_seasons = seasons_with_mvp[seasons_with_mvp > 0].index
    is_historical = target_year in labeled_seasons

    df_t = _build_target_set(df, target_year)

    if pretrained_model is not None and not is_historical:
        rf = pretrained_model
        df_for_fatigue = df[df['year'].isin(labeled_seasons)]
    else:
        df_train = _build_training_set(df, labeled_seasons, target_year)
        rf = _train_rf(df_train)
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

    Limitation: User may end up change Win-Shares and cause team_wins to be greater than 82 (impossible)
    But since we normalise team_wins anyways in our model. The limitation is less impactful.
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

    tw = _compute_team_wins(df_t)
    df_t = df_t.join(tw, on=['team', 'year']).dropna(subset=['team_wins'])

    if not (df_t['name'] == player_name).any():
        raise ValueError(f"'{player_name}' dropped after team_wins recomputation (traded player).")

    if pretrained_model is not None and not is_historical:
        rf = pretrained_model
        df_for_fatigue = df[df['year'].isin(labeled_seasons)]
    else:
        df_train = _build_training_set(df, labeled_seasons, target_year)
        rf = _train_rf(df_train)
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
