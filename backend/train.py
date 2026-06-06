import pandas as pd
from feature import games_threshold, compute_team_wins, normalise_by_season, train_rf
import pickle


df = pd.read_csv('mvp_dataset.csv')
seasons_with_mvp = df.groupby('year')['mvp_label'].sum()
labeled_seasons = seasons_with_mvp[seasons_with_mvp > 0].index

df = df[df['year'].isin(labeled_seasons) & (df['G'] >= df['year'].apply(games_threshold))]
df = compute_team_wins(df)
df = normalise_by_season(df)

rf = train_rf(df)
print(f"OOB Score: {rf.oob_score_:.3f}")
with open('model/rf_model.pkl', 'wb') as f:
    pickle.dump(rf, f)

print("Model saved to backend/model/rf_model.pkl")