import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

from sqlalchemy import text
try:
    result = db.execute(text("SELECT * FROM usuarios")).fetchall()
    print("Users in database:")
    for row in result:
        print(row)
except Exception as e:
    print("Error querying database:", e)
finally:
    db.close()
