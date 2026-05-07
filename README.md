# NBA MVP Predictor

A machine learning model that predicts the NBA MVP for any season from 1985 to present (2026).

All data soursed from Basketball Reference. Manipulation and cleaning of data done using build_dataset.py. All statistics used for educational / non-commercial purposes only.
## How it works

A Random Forest classifier trained on 42 seasons of NBA data (1985–2026) ranks players by their probability of winning MVP. The model uses 7 features selected via domain knowledge and feature importance analysis:

- Win Shares (WS)
- Player Efficiency Rating (PER)
- Box Plus/Minus (BPM)
- Value Over Replacement Player (VORP)
- Points Per Game (PPG)
- Assists Per Game (AST)
- Team Wins (derived from WS)

Stats are normalized within each season independently so cross-era comparisons are valid.

## Model performance

- **Mean Average Precision: 0.65** (~108x better than random baseline of 0.006)
- Evaluated via StratifiedKFold (k=5) cross-validation
- Tuned via GridSearchCV optimising average precision

## Key design decisions

**Class imbalance:** Handled via `class_weight='balanced'` — penalises MVP misclassification ~165x more heavily than non-MVP given the 1:165 class ratio.

**Voter fatigue:** A 0.90x post-processing discount is applied to the 2 most recent MVP winners before the target year to reflect real voter behaviour.

**Team wins proxy:** Basketball Reference defines WS so that every player WS totals ≈ team wins. Only non-traded players are summed to get the num of wins of their team (exclude team == TOT/2TM/3TM); traded players get NaN and are dropped since they are never MVP candidates. Absolute values are understated because the minutes filter excludes bench players, but within-season normalisation preserves the relative team ranking which is all the model needs. Added +0.0077 mean AP (+13% relative) over the baseline of 0.573.

**Held-out target season:** The prediction year is never touched during training. Only seasons with a confirmed MVP are used for training.

## Usage

```bash
pip install pandas scikit-learn openpyxl
python randomTree_model.py
```

Enter a season year when prompted (e.g. `2026` for the 2025–26 season). For historical seasons, the model also shows the actual MVP and its predicted rank.

## Dataset

Built from 42 seasons of NBA advanced and per-game statistics. The dataset is not included in this repo — run `build_dataset.py` to regenerate it from your own data source.