from typing import List, Optional
from datetime import date
import io
import os

import uvicorn
import pandas as pd
from sqlalchemy.orm import Session
from fastapi import Depends, FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, crud
from database import engine, SessionLocal
from utils import check_phone, check_email
from chatbot_service import process_message

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


# ============ AI Chatbot Endpoints ============

@app.post("/chatbot/upload-excel")
async def upload_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload an Excel file to import students or payments.
    Expected columns for students: name, email, phone, is_student, is_teacher
    Expected columns for payments: student_name (or student_id), amount, due_date, status, notes
    """
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="File must be an Excel (.xlsx, .xls) or CSV file")
    
    try:
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Flexible column name mapping - map common variations to expected names
        student_col_aliases = {
            'name': ['name', 'student_name', 'students_name', 'student', 'full_name', 'fullname'],
            'email': ['email', 'e-mail', 'e.m@il', 'email_id', 'mail', 'email_address', 'e_mail'],
            'phone': ['phone', 'mobile', 'mobile_num', 'mobile_number', 'phone_number', 'phone_num', 'contact', 'contact_number', 'tel', 'telephone'],
        }
        payment_col_aliases = {
            'amount': ['amount', 'fee', 'payment', 'payment_amount', 'total', 'price'],
            'due_date': ['due_date', 'due', 'date', 'payment_date', 'deadline'],
            'student_name': ['student_name', 'students_name', 'student', 'name', 'customer_nickname', 'customer_name', 'customer', 'full_name'],
        }
        
        def find_matching_col(columns, aliases):
            """Find matching column from alias list, return first match or None."""
            for alias in aliases:
                if alias in columns:
                    return alias
            return None
        
        def map_columns(df, col_aliases):
            """Map DataFrame columns using aliases. Returns (mapped_df, matched_keys)."""
            col_list = list(df.columns)
            rename_map = {}
            matched_keys = set()
            for standard_name, aliases in col_aliases.items():
                match = find_matching_col(col_list, aliases)
                if match and match != standard_name:
                    rename_map[match] = standard_name
                    matched_keys.add(standard_name)
                elif match:
                    matched_keys.add(standard_name)
            return df.rename(columns=rename_map), matched_keys
        
        results = {"students_added": 0, "payments_added": 0, "errors": [], "records": []}
        
        # Detect if this is a student or payment file using flexible matching
        student_columns = {'name', 'email', 'phone'}
        payment_columns = {'amount', 'due_date'}
        
        # Try mapping columns for both types
        student_df, student_matched = map_columns(df, student_col_aliases)
        payment_df, payment_matched = map_columns(df, payment_col_aliases)
        
        has_student_cols = student_columns.issubset(student_matched)
        has_payment_cols = payment_columns.issubset(payment_matched)
        
        # Use the mapped DataFrames for processing
        if has_student_cols:
            df = student_df
        elif has_payment_cols:
            df = payment_df
        
        if has_student_cols and not has_payment_cols:
            # Process as student data
            for idx, row in df.iterrows():
                try:
                    name = str(row.get('name', '')).strip()
                    email = str(row.get('email', '')).strip()
                    phone = str(row.get('phone', '')).strip()
                    is_student = str(row.get('is_student', 'true')).lower() in ['true', '1', 'yes']
                    is_teacher = str(row.get('is_teacher', 'false')).lower() in ['true', '1', 'yes']
                    
                    if not name:
                        results["errors"].append(f"Row {idx + 2}: Name is required")
                        continue
                    
                    # Check for duplicate
                    existing = crud.get_user_by_username(db, name=name)
                    if existing:
                        results["errors"].append(f"Row {idx + 2}: User '{name}' already exists")
                        continue
                    
                    # Validate and format phone
                    validated_phone = check_phone(phone)
                    if validated_phone is None:
                        results["errors"].append(f"Row {idx + 2}: Invalid phone number for '{name}'")
                        continue
                    
                    # Validate email
                    validated_email = check_email(email)
                    if validated_email is None:
                        results["errors"].append(f"Row {idx + 2}: Invalid email for '{name}'")
                        continue
                    
                    user_data = schemas.UserInfoBase(
                        name=name,
                        email=validated_email,
                        phone=validated_phone,
                        is_student=is_student,
                        is_teacher=is_teacher
                    )
                    
                    new_user = crud.create_user(db=db, user=user_data)
                    if new_user:
                        results["students_added"] += 1
                        results["records"].append({"type": "student", "name": name, "id": new_user.user_id})
                    else:
                        results["errors"].append(f"Row {idx + 2}: Failed to create user '{name}'")
                        
                except Exception as e:
                    results["errors"].append(f"Row {idx + 2}: {str(e)}")
                    
        elif has_payment_cols:
            # Process as payment data
            for idx, row in df.iterrows():
                try:
                    student_name = str(row.get('student_name', '')).strip()
                    student_id = row.get('student_id')
                    amount = float(row.get('amount', 0))
                    due_date_val = row.get('due_date')
                    status = str(row.get('status', 'Pending')).strip()
                    notes = str(row.get('notes', '')).strip() if pd.notna(row.get('notes')) else None
                    
                    # Find student
                    if pd.notna(student_id):
                        student = crud.get_user_by_id(db, user_id=int(student_id))
                    elif student_name:
                        student = crud.get_user_by_username(db, name=student_name)
                    else:
                        results["errors"].append(f"Row {idx + 2}: Student name or ID required")
                        continue
                    
                    if not student:
                        results["errors"].append(f"Row {idx + 2}: Student not found")
                        continue
                    
                    # Parse due date
                    if isinstance(due_date_val, str):
                        due_date_parsed = date.fromisoformat(due_date_val)
                    else:
                        due_date_parsed = pd.to_datetime(due_date_val).date()
                    
                    payment_data = schemas.PaymentCreate(
                        student_id=student.user_id,
                        amount=amount,
                        due_date=due_date_parsed,
                        status=status,
                        notes=notes
                    )
                    
                    new_payment = crud.create_payment(db=db, payment=payment_data)
                    if new_payment:
                        results["payments_added"] += 1
                        results["records"].append({
                            "type": "payment",
                            "student": student.name,
                            "amount": amount,
                            "id": new_payment.payment_id
                        })
                    else:
                        results["errors"].append(f"Row {idx + 2}: Failed to create payment")
                        
                except Exception as e:
                    results["errors"].append(f"Row {idx + 2}: {str(e)}")
        else:
            detected_cols = ', '.join(df.columns.tolist())
            raise HTTPException(
                status_code=400, 
                detail=f"Could not detect file type. Detected columns: [{detected_cols}]. "
                       f"For students, include columns like: name, email, phone (or variations like student_name, mobile_num, e-mail). "
                       f"For payments, include columns like: amount, due_date, student_name."
            )
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@app.post("/chatbot/message")
def chat_message(message: schemas.ChatMessage, db: Session = Depends(get_db)):
    """
    Process a chat message using AI (Gemini or Azure OpenAI) to extract intent and data.
    Set use_ai=false to use regex-based fallback parsing.
    """
    # Get AI response
    ai_response = process_message(message.message, use_ai=message.use_ai)
    
    action = ai_response.get("action")
    data = ai_response.get("data")
    missing_fields = ai_response.get("missing_fields", [])
    
    result = {
        "action": action,
        "ai_response": ai_response.get("message"),
        "success": False,
        "data": None,
        "error": None
    }
    
    # If there are missing fields, return early
    if missing_fields:
        result["error"] = f"Missing required fields: {', '.join(missing_fields)}"
        return result
    
    # Process the action
    if action == "add_student" and data:
        try:
            name = data.get("name")
            email = data.get("email")
            phone = data.get("phone")
            
            if not all([name, email, phone]):
                result["error"] = "Missing required fields for student"
                return result
            
            # Check for duplicate
            existing = crud.get_user_by_username(db, name=name)
            if existing:
                result["error"] = f"Student '{name}' already exists"
                return result
            
            # Validate phone
            validated_phone = check_phone(str(phone))
            if not validated_phone:
                result["error"] = "Invalid phone number format"
                return result
            
            # Validate email
            validated_email = check_email(email)
            if not validated_email:
                result["error"] = "Invalid email format"
                return result
            
            user_data = schemas.UserInfoBase(
                name=name,
                email=validated_email,
                phone=validated_phone,
                is_student=data.get("is_student", True),
                is_teacher=data.get("is_teacher", False)
            )
            
            new_user = crud.create_user(db=db, user=user_data)
            if new_user:
                result["success"] = True
                result["data"] = {
                    "user_id": new_user.user_id,
                    "name": new_user.name,
                    "email": new_user.email
                }
            else:
                result["error"] = "Failed to create student"
                
        except Exception as e:
            result["error"] = str(e)
            
    elif action == "add_payment" and data:
        try:
            student_name = data.get("student_name")
            amount = data.get("amount")
            due_date_str = data.get("due_date")
            
            if not all([student_name, amount, due_date_str]):
                result["error"] = "Missing required fields for payment"
                return result
            
            # Find student
            student = crud.get_user_by_username(db, name=student_name)
            if not student:
                result["error"] = f"Student '{student_name}' not found. Please add the student first."
                return result
            
            # Parse date
            try:
                due_date_parsed = date.fromisoformat(due_date_str)
            except:
                result["error"] = "Invalid date format. Use YYYY-MM-DD"
                return result
            
            payment_data = schemas.PaymentCreate(
                student_id=student.user_id,
                amount=float(amount),
                due_date=due_date_parsed,
                status=data.get("status", "Pending"),
                notes=data.get("notes")
            )
            
            new_payment = crud.create_payment(db=db, payment=payment_data)
            if new_payment:
                result["success"] = True
                result["data"] = {
                    "payment_id": new_payment.payment_id,
                    "student": student_name,
                    "amount": amount,
                    "due_date": due_date_str
                }
            else:
                result["error"] = "Failed to create payment"
                
        except Exception as e:
            result["error"] = str(e)
            
    elif action == "delete_student" and data:
        try:
            name = data.get("name")
            if not name:
                result["error"] = "Missing student name to delete"
                return result
            
            student = crud.get_user_by_username(db, name=name)
            if not student:
                result["error"] = f"Student '{name}' not found"
                return result
            
            # Check if student has payments
            payments = crud.get_payments_by_student(db, student_id=student.user_id)
            if payments:
                # Delete associated payments first
                for payment in payments:
                    crud.delete_payment(db, payment_id=payment.payment_id)
            
            success = crud.delete_user(db, user_id=student.user_id)
            if success:
                result["success"] = True
                result["data"] = {
                    "name": name,
                    "user_id": student.user_id,
                    "payments_deleted": len(payments) if payments else 0
                }
            else:
                result["error"] = f"Failed to delete student '{name}'"
        except Exception as e:
            result["error"] = str(e)
    
    elif action == "delete_payment" and data:
        try:
            payment_id = data.get("payment_id")
            student_name = data.get("student_name")
            
            if payment_id:
                # Delete by payment ID
                payment = crud.get_payment_by_id(db, payment_id=int(payment_id))
                if not payment:
                    result["error"] = f"Payment #{payment_id} not found"
                    return result
                
                student = crud.get_user_by_id(db, user_id=payment.student_id)
                success = crud.delete_payment(db, payment_id=int(payment_id))
                if success:
                    result["success"] = True
                    result["data"] = {
                        "payment_id": payment_id,
                        "student": student.name if student else "Unknown",
                        "amount": payment.amount
                    }
                else:
                    result["error"] = f"Failed to delete payment #{payment_id}"
            elif student_name:
                # Delete most recent payment for student
                student = crud.get_user_by_username(db, name=student_name)
                if not student:
                    result["error"] = f"Student '{student_name}' not found"
                    return result
                
                payments = crud.get_payments_by_student(db, student_id=student.user_id)
                if not payments:
                    result["error"] = f"No payments found for '{student_name}'"
                    return result
                
                # Delete the most recent payment
                latest_payment = sorted(payments, key=lambda p: p.payment_id, reverse=True)[0]
                success = crud.delete_payment(db, payment_id=latest_payment.payment_id)
                if success:
                    result["success"] = True
                    result["data"] = {
                        "payment_id": latest_payment.payment_id,
                        "student": student_name,
                        "amount": latest_payment.amount
                    }
                else:
                    result["error"] = f"Failed to delete payment for '{student_name}'"
            else:
                result["error"] = "Please provide a payment ID or student name"
        except Exception as e:
            result["error"] = str(e)
    
    elif action == "help":
        result["success"] = True
        
    elif action == "error":
        result["error"] = ai_response.get("message")
    
    return result


@app.get("/chatbot/config")
def get_chatbot_config():
    """Get current chatbot configuration status"""
    gemini_configured = bool(os.getenv("GEMINI_API_KEY"))
    azure_configured = bool(os.getenv("AZURE_OPENAI_KEY") and os.getenv("AZURE_OPENAI_ENDPOINT"))
    
    return {
        "ai_provider": os.getenv("AI_PROVIDER", "gemini"),
        "gemini_configured": gemini_configured,
        "azure_openai_configured": azure_configured,
        "ai_available": gemini_configured or azure_configured
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8081)
