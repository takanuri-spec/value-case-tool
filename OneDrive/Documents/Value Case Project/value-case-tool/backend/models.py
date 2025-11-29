from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from database import Base
from datetime import datetime

class CompanyFinancialSnapshot(Base):
    __tablename__ = "company_financial_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    ticker_symbol = Column(String, index=True)
    
    # Basic Info
    company_name = Column(String)
    sector = Column(String)
    fiscal_year_start_month = Column(Integer)
    
    # Market Data
    market_cap = Column(Integer)  # BigInt in spec, Integer in Python/SQLite usually handles large nums
    roe = Column(Float)
    pbr = Column(Float)
    
    # Financial Data (JSON)
    financial_data = Column(JSON)
    
    # Metadata
    data_fetched_at = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)
