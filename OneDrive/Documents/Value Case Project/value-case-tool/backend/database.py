import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 環境変数からDATABASE_URLを取得（ローカルではSQLite）
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./financial_data.db"
)

# RenderのPostgreSQLはpostgres://で始まるが、SQLAlchemyはpostgresql+psycopg2://が必要
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)

# SQLiteの場合のみcheck_same_threadを設定
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
