import pandas as pd
from sqlalchemy import create_engine
# Host: database-1.cv1pozpjpynb.us-east-1.rds.amazonaws.com
# Port: 5432
# Username: cis5500group13
# Password: kasbik-cegje4-tyFsyf
# Db: postgres

# Load your 300k row file
df = pd.read_csv('/Users/vaughanreale/Downloads/acs_df.csv')

# Connection string
engine = create_engine('postgresql://cis5500group13:kasbik-cegje4-tyFsyf@database-1.cv1pozpjpynb.us-east-1.rds.amazonaws.com:5432/final_project')
# 1. Reset the index to make sure there are no hidden MultiIndex levels
df = df.reset_index(drop=True)

# 2. Convert column types explicitly 
# region_id MUST be an integer or float without 'NaN' if the DB column is INT
df['region_id'] = pd.to_numeric(df['region_id'], errors='coerce').fillna(0).astype(int)
df['year'] = pd.to_numeric(df['year'], errors='coerce').fillna(0).astype(int)

# 3. Ensure numeric columns don't have 'NaN' (use None for SQL NULL)
df = df.where(pd.notnull(df), None)

import io
import csv
# --- 1. Robust Data Cleaning ---
# Fill NaNs with 0 (or another placeholder) so we can cast to Int safely
for col in ['region_id', 'year', 'num_households', 'household_income']:
    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

# --- 2. Updated psql_insert_copy ---
def psql_insert_copy(table, conn, keys, data_iter):
    dbapi_conn = conn.connection
    with dbapi_conn.cursor() as cur:
        s_buf = io.StringIO()
        # Explicitly tell the writer how to handle nulls and formatting
        writer = csv.writer(s_buf, quoting=csv.QUOTE_MINIMAL)
        writer.writerows(data_iter)
        s_buf.seek(0)

        columns = ', '.join('"{}"'.format(k) for k in keys)
        table_name = table.name
        if table.schema:
            table_name = '{}.{}'.format(table.schema, table.name)

        sql = 'COPY {} ({}) FROM STDIN WITH CSV'.format(table_name, columns)
        cur.copy_expert(sql=sql, file=s_buf)

# Use the custom method for the upload
df = df.drop_duplicates(subset=['region_id', 'year'])
df.to_sql('acs_income', 
          engine, 
          schema='public',
          if_exists='append', 
          index=False, 
          method=psql_insert_copy) # This replaces 'multi'

