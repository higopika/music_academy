from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime


# ============ User/Student Schemas ============

class UserInfoBase(BaseModel):
    is_student: bool
    is_teacher: bool
    name: str
    email: str
    phone: str


class UserInfo(UserInfoBase):
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class UserInfoUpdate(BaseModel):
    is_student: Optional[bool] = None
    is_teacher: Optional[bool] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


# ============ Payment Schemas ============

class PaymentBase(BaseModel):
    student_id: int
    amount: float
    due_date: date
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    status: Optional[str] = "Pending"
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class Payment(PaymentBase):
    payment_id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class PaymentWithStudent(Payment):
    student_name: Optional[str] = None

    class Config:
        orm_mode = True


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


# ============ Dashboard/Stats Schemas ============

class DashboardStats(BaseModel):
    total_students: int
    total_teachers: int
    total_payments: int
    total_revenue: float
    pending_amount: float
    overdue_amount: float

