import pandas as pd
import pickle
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MinMaxScaler

print("Loading dataset...")
df = pd.read_csv('../mvp_dataset.csv')

features = ['WS', 'PER', 'BPM', 'VORP', 'PPG', 'AST', 'team_wins']

# Seasons with a known MVP result
seasons_with_mvp = df.groupby('year')['mvp_label'].sum()
labeled_seasons = seasons_with_mvp[seasons_with_mvp > 0].index

# Use all labeled seasons for training (no holdout — this is production)
df_train = df[df['year'].isin(labeled_seasons)].copy()

# Era-appropriate games filter
mask_historical = (df_train['year'] < 2024) & (df_train['G'] >= 49)
mask_modern = (df_train['year'] >= 2024) & (df_train['G'] >= 65)
df_train = df_train[mask_historical | mask_modern]

# Team wins proxy
non_traded = df_train[~df_train['team'].isin(['TOT', '2TM', '3TM'])]
team_wins = non_traded.groupby(['team', 'year'])['WS'].sum().rename('team_wins')
df_train = df_train.join(team_wins, on=['team', 'year'])
df_train = df_train.dropna(subset=['team_wins'])

# Normalise within each season
def normalise_season(group):
    scaler = MinMaxScaler()
    group[features] = scaler.fit_transform(group[features])
    return group

identity = df_train[['year']].reset_index(drop=True)
df_train = df_train.groupby('year', group_keys=False).apply(
    normalise_season, include_groups=False
)
df_train = df_train.reset_index(drop=True)
df_train['year'] = identity['year']

X = df_train[features]
y = df_train['mvp_label']

print("Training Random Forest...")
rf = RandomForestClassifier(
    n_estimators=1000,
    max_features=0.3,
    min_samples_leaf=3,
    class_weight='balanced',
    oob_score=True,
    random_state=42
)
rf.fit(X, y)

print(f"OOB Score: {rf.oob_score_:.3f}")

# Save the model
with open('model/rf_model.pkl', 'wb') as f:
    pickle.dump(rf, f)

print("Model saved to backend/model/rf_model.pkl")