# NBA MVP Predictor

A machine learning model that predicts the NBA MVP for any season from 1985 to present (2026).

This project focuses on the modeling pipeline, including feature engineering, handling class imbalance, and evaluating a classifier at extreme class skew. The web interface exists to make predictions accessible

Live Site -> https://nba-mvp-predictor.vercel.app -> may take 30s to wake up on first load.

All data sourced from Basketball Reference. Manipulation and cleaning of data done using build_dataset.py. All statistics used for educational / non-commercial purposes only.

## Model performance

- **Mean Average Precision: 0.65** (~108x better than random baseline of 0.006)
- Evaluated via StratifiedKFold (k=5) cross-validation
- Tuned via GridSearchCV optimising average precision
- Best hyperparameters: n_estimators = 1000, max_features = 0.3, min_sample_leaf = 3. class_weight = 'balanced'

## How it works

A Random Forest classifier trained on 42 seasons of NBA data (1985–2026) ranks players by their probability of winning MVP. Stats are normalized within each season independently so cross-era comparisons are valid. The model outputs predict_proba scores (probability of winning the award) rather than hard labels, producing a ranked leaderboard.

## Features
The model uses 7 features selected via domain knowledge and feature importance analysis:
- Win Shares (WS)
- Player Efficiency Rating (PER)
- Box Plus/Minus (BPM)
- Value Over Replacement Player (VORP)
- Points Per Game (PPG)
- Assists Per Game (AST)
- Team Wins (derived from WS)

Dropped features: TS%, STL, TRB, and BLK were removed after showing near-zero feature importance (<0.025 each). Removing them reduced noise without measurable AP loss.

## Key design decisions

**Minutes filter:** Only players with more than 1,560 total minutes qualify. Advanced stats use actual total MP directly. Per-game stats don't carry total minutes, so the filter approximates with `G × MP` (games × minutes-per-game). Players near the boundary may pass one filter but not the other and are dropped by the inner join in build_dataset.py.

**Binary label:** MVP = 1, everyone else = 0. The model is trained to separate the winner from the field. This keeps the problem well-defined and avoids label ambiguity in close races.

**Evaluation metric — average precision:** Accuracy and AUC-ROC are misleading as every season there will only be 1 winner. In 2026 specifically, its 1:165 (predicting 0 for everyone gives 99.4% accuracy). Average precision focuses specifically on how well the model ranks MVPs to the top of the leaderboard, which is exactly the task. Evaluated via StratifiedKFold (k=5) to preserve the class ratio across folds.

**Era-appropriate games filter:** 49+ games for seasons before 2024, 65+ games from 2024 onwards. The NBA introduced a 65-game eligibility threshold for awards in 2024. 49 games threshold chosen because historically, that the lowest number of games played by a MVP winner.

**Class imbalance:** Handled via `class_weight='balanced'` — penalises MVP misclassification ~165x more heavily than non-MVP given the 1:165 class ratio (in 2026).

**Probability ranking:** The model outputs `predict_proba` scores rather than hard `predict` labels. This produces a ranked leaderboard of MVP probabilities.

**Team wins proxy:** Basketball Reference defines WS so that team totals ≈ team wins. Team wins are derived by summing WS across all non-traded players on each team. Traded players (team listed as `TOT`/`2TM`/`3TM`) are excluded from this sum because their WS can't be attributed to a single team — and as a consequence of getting no `team_wins` value, they are dropped from both training and prediction entirely. No traded player has ever won MVP, so this is an acceptable constraint, not a loss of signal. Absolute values are understated because bench players under the minutes filter are excluded, but within-season normalisation preserves the relative team ranking which is all the model needs.

**Voter fatigue:** A 0.90x post-processing discount is applied to the 2 most recent MVP winners before the target year to reflect real voter behaviour. The discount factor was determined empirically by testing several values and observing the effect on leaderboard rankings. A more rigorous approach would derive this statistically from historical vote share data.

**Held-out target season:** The prediction year is never touched during training. Only seasons with a confirmed MVP are used for training.

**OOB score as sanity check:** `oob_score=True` provides a free out-of-bag accuracy estimate during training without needing a separate validation split. It serves as a quick health check alongside the cross-validation average precision.

## Stack

- Model: scikit-learn RandomForestClassifier
- Backend: FastAPI (Python). main.py & model.py built with CLaude Code assisstance
- Frontend: React (built with Claude Code assistance)
- Deployment: Render (backend), Vercel (frontend)
- Data: Basketball Reference: advanced and per-game stats across 42 seasons

## Usage

```bash
pip install pandas scikit-learn openpyxl
python randomTree_model.py
```

Enter a season year when prompted (e.g. `2026` for the 2025–26 season). For historical seasons, the model also shows the actual MVP and its predicted rank.

To run the full web app locally:
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev

## Dataset

Built from 42 seasons of NBA advanced and per-game statistics. The cleaned dataset generated by 'build_dataset.py' is included in this repo. All primary data sourced from Basketball Reference. All statistics used for educational / non-commercial purposes only.

## What I'd Improve

Dynamic games threshold: Replace the fixed 65/49 game thresholds with a proportion-based threshold (e.g. 79% of max games played that season). This would handle mid-season predictions and lockout seasons automatically without hardcoded rules. Requires full retraining and CV re-evaluation to verify AP holds up — deferred because WS and VORP are cumulative stats that look structurally different mid-season, so model validity mid-season is an open question.

Voter fatigue derivation: Replace the empirically chosen 0.90x discount with a value derived statistically from historical vote share data for past repeat winners.
