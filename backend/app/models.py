from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.sql.sqltypes import Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class UserInfo(Base):
    __tablename__ = "user_info"

    user_id = Column(Integer, primary_key=True, index=True)
    is_student = Column(Boolean, default=False)
    is_teacher = Column(Boolean, default=False)
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship to payments
    payments = relationship("Payment", back_populates="student")


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("user_info.user_id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=False)
    payment_method = Column(String(50), nullable=True)  # Cash, UPI, Card, Bank Transfer, Cheque
    status = Column(String(20), default="Pending")  # Paid, Pending, Overdue
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship to student
    student = relationship("UserInfo", back_populates="payments")  