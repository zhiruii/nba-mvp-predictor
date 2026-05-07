import sys
sys.stdout.reconfigure(encoding='utf-8')
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
#from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import MinMaxScaler
#from sklearn.model_selection import GridSearchCV

df = pd.read_csv('mvp_dataset.csv')

try:
    target_year = int(input("Enter the season year to predict (e.g. 2026 for the 2025-26 season): "))
except ValueError:
    print("Invalid input — please enter a numeric year.")
    sys.exit(1)

# Seasons with a known MVP result (at least one mvp_label == 1)
seasons_with_mvp = df.groupby('year')['mvp_label'].sum()
labeled_seasons = seasons_with_mvp[seasons_with_mvp > 0].index

if target_year not in df['year'].values:
    print(f"No data found for {target_year}. Dataset covers 1985–{df['year'].max()}.")
    sys.exit(1)

is_historical = target_year in labeled_seasons

# Training: all labeled seasons except the target year
df_labelled = df[df['year'].isin(labeled_seasons) & (df['year'] != target_year)].copy()
df_target = df[df['year'] == target_year].copy()

# Era-appropriate games filter
mask_historical = (df_labelled['year'] < 2024) & (df_labelled['G'] >= 49)
mask_modern = (df_labelled['year'] >= 2024) & (df_labelled['G'] >= 65)

df_labelled = df_labelled[mask_historical | mask_modern]

# Era-appropriate filter for target year
games_threshold = 65 if target_year >= 2024 else 49
df_target = df_target[df_target['G'] >= games_threshold]

# Derive team wins proxy: WS sums to team wins by BR's accounting identity.
# Only sum non-traded players — TOT/2TM/3TM rows are fake teams whose pooled WS is meaningless.
# Traded players get NaN and are dropped; they are never MVP candidates.
# Absolute values are understated (minutes filter excludes bench players) but
# within-season normalisation preserves the relative team ranking, which is all the model needs.
non_traded = df_labelled[~df_labelled['team'].isin(['TOT', '2TM', '3TM'])]
team_wins = non_traded.groupby(['team', 'year'])['WS'].sum().rename('team_wins')
df_labelled = df_labelled.join(team_wins, on=['team', 'year'])
df_labelled = df_labelled.dropna(subset=['team_wins'])

# Same proxy for target year
non_traded_target = df_target[~df_target['team'].isin(['TOT', '2TM', '3TM'])]
team_wins_target = non_traded_target.groupby(['team', 'year'])['WS'].sum().rename('team_wins')
df_target = df_target.join(team_wins_target, on=['team', 'year'])
df_target = df_target.dropna(subset=['team_wins'])

#print(df_labelled.shape)
#print(df_labelled['mvp_label'].value_counts())

# previously used features:
# features = ['PPG', 'AST', 'TRB', 'BLK', 'STL', 'PER', 'TS', 'WS', 'BPM', 'VORP']
features = ['WS', 'PER', 'BPM', 'VORP', 'PPG', 'AST', 'team_wins']

identity = df_labelled[['year']].reset_index(drop=True)

# normalise features within each season
def normalise_season(group):
    scaler = MinMaxScaler()
    group[features] = scaler.fit_transform(group[features])
    return group

df_labelled = df_labelled.groupby('year', group_keys=False).apply(normalise_season, include_groups = False)

# Restore year
df_labelled = df_labelled.reset_index(drop=True)
df_labelled['year'] = identity['year']

#print(df_labelled.columns.tolist())
X = df_labelled[features]
y = df_labelled['mvp_label']

#print(y.value_counts())

rf = RandomForestClassifier(n_estimators=1000, 
                            max_features = 0.3,
                            min_samples_leaf = 3,
                            class_weight='balanced',
                            oob_score=True,
                            random_state=42)

#cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
#scores = cross_val_score(rf, X, y, cv=cv, scoring= 'average_precision')
#print("AP per fold:", scores.round(3))
#print("Mean AP:", scores.mean().round(3))
#print("Std AP:", scores.std().round(3))

rf.fit(X, y)

# 2 most recent MVP winners before the target year
recent_winners = (df_labelled[(df_labelled['mvp_label'] == 1) & (df_labelled['year'] < target_year)]
                  .sort_values('year', ascending=False)
                  .head(2)['name'].tolist())
print("Applying fatigue discount to:", recent_winners)

df_target_norm = df_target.copy()
df_target_norm[features] = MinMaxScaler().fit_transform(df_target_norm[features])

# Generate raw probabilities
X_target = df_target_norm[features]
df_target_norm['mvp_prob'] = rf.predict_proba(X_target)[:, 1]

# Apply voter fatigue discount
fatigue_discount = 0.90
df_target_norm['mvp_prob_adjusted'] = df_target_norm.apply(
    lambda row: row['mvp_prob'] * fatigue_discount if row['name'] in recent_winners else row['mvp_prob'],
    axis=1
)

# Final ranked output
results = df_target_norm[['name', 'team', 'mvp_prob', 'mvp_prob_adjusted']].sort_values('mvp_prob_adjusted', ascending=False).head(10)
results = results.reset_index(drop=True)
results.index += 1

print(f"\n--- {target_year} MVP Predictions ---")
print(results.round(3))

if is_historical:
    actual_mvp = df[(df['year'] == target_year) & (df['mvp_label'] == 1)]['name'].values
    actual_name = actual_mvp[0] if len(actual_mvp) > 0 else 'Unknown'
    predicted_rank = results[results['name'] == actual_name].index.tolist()
    rank_str = f"(model ranked #{predicted_rank[0]})" if predicted_rank else "(not in top 10)"
    print(f"\nActual MVP: {actual_name} {rank_str}")

# Testing AP to decide on best model parameters.
#print("AP per fold:", scores.round(3))
#print("Mean AP:", scores.mean().round(3))
#print("Std AP:", scores.std().round(3))

# Fit the model to the entire dataset to get feature importances
#rf.fit(X, y)
#importances = pd.Series(rf.feature_importances_, index=features)
#importances = importances.sort_values(ascending=False)

#print(importances.round(3))

# Hyperparameter tuning with GridSearchCV
#param_grid = {
#    'n_estimators': [500, 1000],
#    'max_features': ['sqrt', 'log2', 0.3, 0.5],
#    'min_samples_leaf': [1, 2, 3]
#}

#grid_search = GridSearchCV(
#    estimator=RandomForestClassifier(
#        class_weight='balanced',
#        random_state=42
#    ),
#    param_grid=param_grid,
#    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
#    scoring='average_precision',
#    n_jobs=-1,
#    verbose=1
#)

#grid_search.fit(X, y)
#print("Best params:", grid_search.best_params_)
#print("Best Mean AP:", round(grid_search.best_score_, 3))