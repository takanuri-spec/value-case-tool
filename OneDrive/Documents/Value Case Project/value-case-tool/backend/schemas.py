from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Financial Data Structure within JSON
class FiscalYearData(BaseModel):
    year: str
    revenue: float
    revenue_growth: Optional[float] = None
    ebit: float
    ebitda: float
    fcf: float
    total_assets: float
    cash: float
    debt: float

class FinancialData(BaseModel):
    fiscal_years: List[FiscalYearData]

# Request Model
class FetchRequest(BaseModel):
    ticker: str

# Response Model
class CompanySnapshot(BaseModel):
    id: int
    ticker_symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    fiscal_year_start_month: Optional[int] = None
    market_cap: Optional[int] = None
    roe: Optional[float] = None
    pbr: Optional[float] = None
    financial_data: Optional[FinancialData] = None
    data_fetched_at: datetime

    class Config:
        orm_mode = True

class CompanySummary(BaseModel):
    id: int
    ticker_symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    market_cap: Optional[int] = None
    data_fetched_at: datetime

    class Config:
        orm_mode = True
