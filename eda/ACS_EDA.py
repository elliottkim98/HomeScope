import pandas as pd
import numpy as np
import re
from pathlib import Path

#setting
BASE_DIR = Path(__file__).resolve().parent
YEARS = range(2010, 2025)

state_map = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
    'Puerto Rico': 'PR'
}

def normalize_name(name: str):
    if pd.isna(name):
        return None
    name = str(name).lower().strip()
    name = re.sub(r"[^\w\s]", "", name)

    suffixes = [
        " city", " town", " village", " borough", " township",
        " municipality", " county", " parish",
        " census designated place", " cdp"
    ]
    for suffix in suffixes:
        if name.endswith(suffix):
            name = name[:-len(suffix)].strip()

    name = re.sub(r"\s+", " ", name).strip()
    return name

def clean_numeric(series: pd.Series):
    s = pd.to_numeric(series, errors="coerce")
    # ACS sentinel values like -3333333333 = missing
    s = s.mask(s < 0, np.nan)
    return s


#process for all ACS 5Y files
all_data = []
all_full_data = []

for year in YEARS:
    print(f"Processing {year}...")

    file_path = BASE_DIR / f"ACSST5Y{year}.S1901-Data.csv"
    if not file_path.exists():
        print(f"  Skipping missing file: {file_path.name}")
        continue

    df = pd.read_csv(file_path, low_memory=False)

    needed_cols = [
        "GEO_ID",
        "NAME",
        "S1901_C01_001E",   #total households
        "S1901_C01_012E"    #median household income
    ]

    missing_cols = [c for c in needed_cols if c not in df.columns]
    if missing_cols:
        print(f"  Skipping {file_path.name}; missing columns: {missing_cols}")
        continue

    df = df[needed_cols].copy()
    df.columns = [
        "geo_id",
        "full_name",
        "num_households",
        "household_income"
    ]

    #clean numbers
    df["num_households"] = clean_numeric(df["num_households"])
    df["household_income"] = clean_numeric(df["household_income"])

    #split full name in reigon name and state
    split_names = df["full_name"].str.split(", ", n=1, expand=True)
    df["region_name_raw"] = split_names[0]
    df["state_full"] = split_names[1]

    df["state_abbr"] = df["state_full"].map(state_map)
    df["region_name_norm"] = df["region_name_raw"].apply(normalize_name)
    df["match_key"] = df["region_name_norm"] + "_" + df["state_abbr"].fillna("")

    df["year"] = year

    #cleaned
    full_df = df[
        [
            "geo_id",
            "full_name",
            "region_name_raw",
            "state_full",
            "state_abbr",
            "region_name_norm",
            "match_key",
            "year",
            "num_households",
            "household_income"
        ]
    ].dropna(subset=["geo_id", "full_name", "state_abbr", "match_key"])

    #db prep
    final_df = df[
        [
            "match_key",
            "year",
            "household_income",
            "num_households"
        ]
    ].dropna(subset=["match_key", "year", "household_income", "num_households"])

    all_full_data.append(full_df)
    all_data.append(final_df)

#concatenate across years
acs_clean_full = pd.concat(all_full_data, ignore_index=True).drop_duplicates()
acs_income_ready = pd.concat(all_data, ignore_index=True).drop_duplicates()

#outputs
acs_clean_full.to_csv(BASE_DIR / "acs_clean_full_2010_2024.csv", index=False)
acs_income_ready.to_csv(BASE_DIR / "acs_income_ready_2010_2024.csv", index=False)

#checks
print("acs_clean_full_2010_2024.csv shape:", acs_clean_full.shape)
print("acs_income_ready_2010_2024.csv shape:", acs_income_ready.shape)

#print("\nSample rows:")
#print(acs_income_ready.head())

#print("\nYears included:")
#print(sorted(acs_income_ready["year"].unique()))