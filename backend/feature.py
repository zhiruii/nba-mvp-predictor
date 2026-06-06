import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier

FEATURES = ['WS', 'PER', 'BPM', 'VORP', 'PPG', 'AST', 'team_wins']
FATIGUE_DISCOUNT = 0.90


def games_threshold(year: int) -> int:
    return 65 if year >= 2024 else 49


def compute_team_wins(df: pd.DataFrame) -> pd.DataFrame:
    df = df[~df['team'].isin(['TOT', '2TM', '3TM'])].copy()
    tw = df.groupby(['team', 'year'])['WS'].sum().rename('team_wins')
    return df.join(tw, on=['team', 'year'])


def normalise_by_season(df: pd.DataFrame) -> pd.DataFrame:
    years = df['year'].reset_index(drop=True)
    def _normalise_group(group):
        group[FEATURES] = MinMaxScaler().fit_transform(group[FEATURES])
        return group
    result = df.groupby('year', group_keys=False).apply(_normalise_group, include_groups=False).reset_index(drop=True)
    result['year'] = years
    return result


def train_rf(df_train: pd.DataFrame) -> RandomForestClassifier:
    rf = RandomForestClassifier(
        n_estimators=1000, max_features=0.3, min_samples_leaf=3,
        class_weight='balanced', oob_score=True, random_state=42,
    )
    rf.fit(df_train[FEATURES], df_train['mvp_label'])
    return rf