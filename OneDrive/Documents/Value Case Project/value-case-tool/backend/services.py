import yfinance as yf
from sqlalchemy.orm import Session
from models import CompanyFinancialSnapshot
from datetime import datetime
import json
import math

def fetch_company_data(db: Session, ticker_symbol: str):
    # 1. Fetch data from yfinance
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info
    
    # 2. Basic Info
    company_name = info.get('longName')
    sector = info.get('sector')
    
    # 3. Market Data
    market_cap = info.get('marketCap')
    roe = info.get('returnOnEquity')
    pbr = info.get('priceToBook')
    
    # 4. Financial Data (Last 3 years)
    financials = ticker.financials
    balance_sheet = ticker.balance_sheet
    cashflow = ticker.cashflow
    
    fiscal_years_data = []
    
    # Ensure we have data columns
    if not financials.empty:
        # Limit to 3 years or available columns
        num_years = min(3, len(financials.columns))
        
        for i in range(num_years):
            col_date = financials.columns[i]
            year_str = col_date.strftime('%Y-%m-%d')
            
            # Helper to safely get value
            def get_val(df, row_name, col):
                try:
                    val = df.loc[row_name, col]
                    return float(val) if not math.isnan(val) else 0.0
                except (KeyError, ValueError, TypeError):
                    return 0.0

            # Revenue
            revenue = get_val(financials, 'Total Revenue', col_date)
            
            # Revenue Growth
            revenue_growth = None
            if i < len(financials.columns) - 1:
                prev_col = financials.columns[i+1]
                prev_revenue = get_val(financials, 'Total Revenue', prev_col)
                if prev_revenue != 0:
                    revenue_growth = ((revenue - prev_revenue) / prev_revenue) * 100

            # EBIT, EBITDA
            ebit = get_val(financials, 'EBIT', col_date)
            # If EBIT is missing, try Operating Income
            if ebit == 0:
                 ebit = get_val(financials, 'Operating Income', col_date)

            ebitda = get_val(financials, 'EBITDA', col_date)
            # If EBITDA missing, approximate: EBIT + Depreciation
            if ebitda == 0:
                # Try to find depreciation
                depreciation = 0
                # Check Cash Flow for depreciation
                try:
                    # Common keys for depreciation in cashflow
                    dep_keys = ['Depreciation', 'Depreciation And Amortization']
                    for key in dep_keys:
                        if key in cashflow.index:
                            depreciation = get_val(cashflow, key, col_date)
                            break
                except:
                    pass
                ebitda = ebit + depreciation

            # FCF = Operating CF + Investing CF
            operating_cf = get_val(cashflow, 'Operating Cash Flow', col_date)
            investing_cf = get_val(cashflow, 'Investing Cash Flow', col_date)
            fcf = operating_cf + investing_cf
            
            # Balance Sheet Items
            total_assets = get_val(balance_sheet, 'Total Assets', col_date)
            cash = get_val(balance_sheet, 'Cash And Cash Equivalents', col_date)
            debt = get_val(balance_sheet, 'Total Debt', col_date)
            
            fiscal_years_data.append({
                'year': year_str,
                'revenue': revenue,
                'revenue_growth': revenue_growth,
                'ebit': ebit,
                'ebitda': ebitda,
                'fcf': fcf,
                'total_assets': total_assets,
                'cash': cash,
                'debt': debt
            })

    # 6. Estimate Fiscal Year Start Month
    fiscal_year_start_month = None
    if not financials.empty:
        fiscal_year_end_month = financials.columns[0].month
        fiscal_year_start_month = (fiscal_year_end_month % 12) + 1

    # 7. Create Snapshot Object
    snapshot_data = {
        "ticker_symbol": ticker_symbol,
        "company_name": company_name,
        "sector": sector,
        "fiscal_year_start_month": fiscal_year_start_month,
        "market_cap": market_cap,
        "roe": roe,
        "pbr": pbr,
        "financial_data": {"fiscal_years": fiscal_years_data},
        "data_fetched_at": datetime.now()
    }
    
    # 8. Save to DB (Upsert: Update if exists, Insert if new)
    existing_snapshot = db.query(CompanyFinancialSnapshot)\
                          .filter(CompanyFinancialSnapshot.ticker_symbol == ticker_symbol)\
                          .first()
    
    if existing_snapshot:
        # Update existing record
        for key, value in snapshot_data.items():
            setattr(existing_snapshot, key, value)
        db.commit()
        db.refresh(existing_snapshot)
        return existing_snapshot
    else:
        # Create new record
        db_snapshot = CompanyFinancialSnapshot(**snapshot_data)
        db.add(db_snapshot)
        db.commit()
        db.refresh(db_snapshot)
        return db_snapshot

def get_company_data(db: Session, ticker_symbol: str):
    # Get the latest snapshot for the ticker
    return db.query(CompanyFinancialSnapshot)\
             .filter(CompanyFinancialSnapshot.ticker_symbol == ticker_symbol)\
             .order_by(CompanyFinancialSnapshot.data_fetched_at.desc())\
             .first()

def get_all_companies(db: Session):
    # Get all companies, ordered by most recently updated
    return db.query(CompanyFinancialSnapshot)\
             .order_by(CompanyFinancialSnapshot.data_fetched_at.desc())\
             .all()

def delete_company(db: Session, company_id: int):
    # Delete a company by ID
    snapshot = db.query(CompanyFinancialSnapshot)\
                 .filter(CompanyFinancialSnapshot.id == company_id)\
                 .first()
    if snapshot:
        db.delete(snapshot)
        db.commit()
        return True
    return False
