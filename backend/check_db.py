import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL: {db_url}")

try:
    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables in database:", tables)
    for table in tables:
        print(f"\nTable: {table}")
        for column in inspector.get_columns(table):
            print(f"  Column: {column['name']} ({column['type']})")
except Exception as e:
    print("Error connecting to database:", e)
