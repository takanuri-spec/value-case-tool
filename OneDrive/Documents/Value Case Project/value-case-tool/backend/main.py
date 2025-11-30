from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base
import models
import schemas
import services

# Create DB tables (temporarily drop to recreate with new schema)
models.Base.metadata.drop_all(bind=engine)  # TEMPORARY: Remove after first successful deploy
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS設定（本番環境とローカル開発環境の両方を許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://value-case-tool.web.app",
        "https://value-case-tool.firebaseapp.com",
        "http://localhost:5173",  # ローカル開発用
        "http://127.0.0.1:5173",  # ローカル開発用
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/api/fetch-financial-data", response_model=schemas.CompanySnapshot)
def fetch_financial_data(request: schemas.FetchRequest, db: Session = Depends(get_db)):
    try:
        snapshot = services.fetch_company_data(db, request.ticker)
        return snapshot
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/companies/{ticker}", response_model=schemas.CompanySnapshot)
def get_company(ticker: str, db: Session = Depends(get_db)):
    snapshot = services.get_company_data(db, ticker)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return snapshot

@app.get("/api/companies", response_model=list[schemas.CompanySummary])
def get_companies(db: Session = Depends(get_db)):
    companies = services.get_all_companies(db)
    return companies

@app.delete("/api/companies/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    success = services.delete_company(db, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted successfully"}

@app.get("/")
def read_root():
    return {"message": "Value Case Tool API is running"}
