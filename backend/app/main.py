from typing import List, Optional
from datetime import date

import uvicorn
from sqlalchemy.orm import Session
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, crud
from database import engine, SessionLocal
from utils import check_phone, check_email

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Music Academy Fee Management API",
    description="API for managing students, teachers, and fee payments",
    version="1.0.0"
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency
def get_db():
    db = None
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


# ============ Root Endpoint ============

@app.get('/')
def index():
    return {"message": "Music Academy Fee Management API", "version": "1.0.0"}


# ============ Dashboard Endpoints ============

@app.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics including total students, revenue, and payment summaries"""
    return crud.get_dashboard_stats(db=db)


# ============ Student/User Endpoints ============

@app.post("/user", response_model=schemas.UserInfo)
def create_user(user: schemas.UserInfoBase, db: Session = Depends(get_db)):
    """Create a new student or teacher"""
    db_user = crud.get_user_by_username(db, name=user.name)
    if db_user:
        print("Error: Duplicate user creation")
        raise HTTPException(status_code=400, detail="Username already registered")
    
    phone = check_phone(user.phone)
    print(phone)
    if phone is None:
        print("Error: Invalid phone number format")
        raise HTTPException(status_code=400, detail="Invalid Phone Number")
    else:
        user.phone = phone

    email = check_email(user.email)
    if email is None:
        print("Error: Invalid email id format")
        raise HTTPException(status_code=400, detail="Invalid email id")
    else:
        user.email = email

    result = crud.create_user(db=db, user=user)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to create user")
    return result


@app.get("/students/")
def get_students(db: Session = Depends(get_db)):
    """Get all users (students and teachers)"""
    data = crud.get_students(db=db)
    response = {"data": data}
    return response


@app.get("/students/list")
def get_students_only(db: Session = Depends(get_db)):
    """Get only students (is_student=True)"""
    data = crud.get_students_only(db=db)
    response = {"data": data}
    return response


@app.get("/teachers/list")
def get_teachers_only(db: Session = Depends(get_db)):
    """Get only teachers (is_teacher=True)"""
    data = crud.get_teachers_only(db=db)
    response = {"data": data}
    return response


@app.get("/students/{user_id}", response_model=schemas.UserInfo)
def get_student_by_id(user_id: int, db: Session = Depends(get_db)):
    """Get a specific student/user by ID"""
    db_user = crud.get_user_by_id(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.put("/students/{user_id}", response_model=schemas.UserInfo)
def update_student(user_id: int, user_update: schemas.UserInfoUpdate, db: Session = Depends(get_db)):
    """Update a student/user's information"""
    # Validate phone if provided
    if user_update.phone:
        phone = check_phone(user_update.phone)
        if phone is None:
            raise HTTPException(status_code=400, detail="Invalid Phone Number")
        user_update.phone = phone
    
    # Validate email if provided
    if user_update.email:
        email = check_email(user_update.email)
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid email id")
        user_update.email = email
    
    db_user = crud.update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.delete("/students/{user_id}")
def delete_student(user_id: int, db: Session = Depends(get_db)):
    """Delete a student/user"""
    success = crud.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully", "user_id": user_id}


# ============ Payment Endpoints ============

@app.post("/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    """Create a new payment record"""
    # Verify student exists
    student = crud.get_user_by_id(db, user_id=payment.student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    result = crud.create_payment(db=db, payment=payment)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to create payment")
    return result


@app.get("/payments")
def get_all_payments(
    status: Optional[str] = Query(None, description="Filter by payment status"),
    db: Session = Depends(get_db)
):
    """Get all payments, optionally filtered by status"""
    if status:
        data = crud.get_payments_by_status(db=db, status=status)
    else:
        data = crud.get_all_payments(db=db)
    response = {"data": data}
    return response


@app.get("/payments/{payment_id}", response_model=schemas.Payment)
def get_payment_by_id(payment_id: int, db: Session = Depends(get_db)):
    """Get a specific payment by ID"""
    db_payment = crud.get_payment_by_id(db, payment_id=payment_id)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


@app.get("/students/{user_id}/payments")
def get_student_payments(user_id: int, db: Session = Depends(get_db)):
    """Get all payments for a specific student"""
    # Verify student exists
    student = crud.get_user_by_id(db, user_id=user_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    data = crud.get_payments_by_student(db=db, student_id=user_id)
    response = {"data": data, "student": student}
    return response


@app.put("/payments/{payment_id}", response_model=schemas.Payment)
def update_payment(payment_id: int, payment_update: schemas.PaymentUpdate, db: Session = Depends(get_db)):
    """Update a payment record"""
    db_payment = crud.update_payment(db, payment_id=payment_id, payment_update=payment_update)
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


@app.delete("/payments/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    """Delete a payment record"""
    success = crud.delete_payment(db, payment_id=payment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully", "payment_id": payment_id}


@app.post("/payments/{payment_id}/mark-paid", response_model=schemas.Payment)
def mark_payment_as_paid(
    payment_id: int,
    payment_method: str = Query(..., description="Payment method used"),
    payment_date: Optional[date] = Query(None, description="Date of payment (defaults to today)"),
    db: Session = Depends(get_db)
):
    """Mark a payment as paid"""
    db_payment = crud.mark_payment_as_paid(
        db, 
        payment_id=payment_id, 
        payment_method=payment_method,
        payment_date=payment_date
    )
    if db_payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8081)
