from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import models, schemas


# ============ User/Student CRUD Operations ============

def get_user_by_username(db: Session, name: str):
    return db.query(models.UserInfo).filter(models.UserInfo.name == name).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(models.UserInfo).filter(models.UserInfo.user_id == user_id).first()


def create_user(db: Session, user: schemas.UserInfoBase):
    db_user = models.UserInfo(
        is_student=user.is_student,
        is_teacher=user.is_teacher,
        name=user.name,
        email=user.email,
        phone=user.phone
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        print(f"Create User Failed: {e}")
        db.rollback()
        return None
    return db_user


def update_user(db: Session, user_id: int, user_update: schemas.UserInfoUpdate):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    try:
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        print(f"Update User Failed: {e}")
        db.rollback()
        return None
    return db_user


def delete_user(db: Session, user_id: int):
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False
    
    try:
        db.delete(db_user)
        db.commit()
    except Exception as e:
        print(f"Delete User Failed: {e}")
        db.rollback()
        return False
    return True


def get_students(db: Session):
    return db.query(models.UserInfo).all()


def get_students_only(db: Session):
    return db.query(models.UserInfo).filter(models.UserInfo.is_student == True).all()


def get_teachers_only(db: Session):
    return db.query(models.UserInfo).filter(models.UserInfo.is_teacher == True).all()


# ============ Payment CRUD Operations ============

def create_payment(db: Session, payment: schemas.PaymentCreate):
    db_payment = models.Payment(
        student_id=payment.student_id,
        amount=payment.amount,
        due_date=payment.due_date,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        status=payment.status or "Pending",
        notes=payment.notes
    )
    
    try:
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
    except Exception as e:
        print(f"Create Payment Failed: {e}")
        db.rollback()
        return None
    return db_payment


def get_payment_by_id(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.payment_id == payment_id).first()


def get_all_payments(db: Session):
    return db.query(models.Payment).all()


def get_payments_by_student(db: Session, student_id: int):
    return db.query(models.Payment).filter(models.Payment.student_id == student_id).all()


def get_payments_by_status(db: Session, status: str):
    return db.query(models.Payment).filter(models.Payment.status == status).all()


def update_payment(db: Session, payment_id: int, payment_update: schemas.PaymentUpdate):
    db_payment = get_payment_by_id(db, payment_id)
    if not db_payment:
        return None
    
    update_data = payment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payment, key, value)
    
    try:
        db.commit()
        db.refresh(db_payment)
    except Exception as e:
        print(f"Update Payment Failed: {e}")
        db.rollback()
        return None
    return db_payment


def delete_payment(db: Session, payment_id: int):
    db_payment = get_payment_by_id(db, payment_id)
    if not db_payment:
        return False
    
    try:
        db.delete(db_payment)
        db.commit()
    except Exception as e:
        print(f"Delete Payment Failed: {e}")
        db.rollback()
        return False
    return True


def mark_payment_as_paid(db: Session, payment_id: int, payment_method: str, payment_date: date = None):
    db_payment = get_payment_by_id(db, payment_id)
    if not db_payment:
        return None
    
    db_payment.status = "Paid"
    db_payment.payment_method = payment_method
    db_payment.payment_date = payment_date or date.today()
    
    try:
        db.commit()
        db.refresh(db_payment)
    except Exception as e:
        print(f"Mark Payment as Paid Failed: {e}")
        db.rollback()
        return None
    return db_payment


# ============ Dashboard/Stats Operations ============

def get_dashboard_stats(db: Session):
    total_students = db.query(models.UserInfo).filter(models.UserInfo.is_student == True).count()
    total_teachers = db.query(models.UserInfo).filter(models.UserInfo.is_teacher == True).count()
    total_payments = db.query(models.Payment).count()
    
    total_revenue = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "Paid"
    ).scalar() or 0.0
    
    pending_amount = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "Pending"
    ).scalar() or 0.0
    
    overdue_amount = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "Overdue"
    ).scalar() or 0.0
    
    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_payments": total_payments,
        "total_revenue": total_revenue,
        "pending_amount": pending_amount,
        "overdue_amount": overdue_amount
    }