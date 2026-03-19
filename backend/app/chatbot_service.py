"""
AI Chatbot Service - Supports Google Gemini (free) and Azure OpenAI
"""
import os
import json
import re
from typing import Optional, Dict, Any

# AI Provider configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")  # "gemini" or "azure_openai"

# Gemini configuration (FREE)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Azure OpenAI configuration (if using Azure)
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY", "")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")

# System prompt for the AI
SYSTEM_PROMPT = """You are a helpful assistant for a Music Academy fee management system. 
Your job is to help users add students and payments to the database.

When the user wants to add a student, extract the following information and return it in JSON format:
- name (required): The student's full name
- email (required): The student's email address
- phone (required): The student's phone number (10 digits)
- is_student (default: true): Whether this person is a student
- is_teacher (default: false): Whether this person is a teacher

When the user wants to add a payment, extract:
- student_name (required): The name of the student
- amount (required): The payment amount in dollars
- due_date (required): The due date in YYYY-MM-DD format
- status (default: "Pending"): Payment status (Pending, Paid, Overdue)
- notes (optional): Any additional notes

When the user wants to delete a student, extract:
- name (required): The student's full name to delete

When the user wants to delete a payment, extract:
- payment_id (required if known): The payment ID number
- student_name (optional): The student's name (used to find payments if no ID given)
- amount (optional): The payment amount (to help identify the payment)

IMPORTANT: Always respond with valid JSON in this format:
{
    "action": "add_student" | "add_payment" | "delete_student" | "delete_payment" | "help" | "unknown",
    "data": { ... extracted fields ... },
    "message": "A friendly message to the user",
    "missing_fields": ["list of missing required fields if any"]
}

If the user's request is unclear or missing information, set action to the detected intent and list the missing_fields.
If you can't determine the intent, set action to "help" and provide guidance.

Examples:
User: "Add student John Doe, email john@test.com, phone 1234567890"
Response: {"action": "add_student", "data": {"name": "John Doe", "email": "john@test.com", "phone": "1234567890", "is_student": true, "is_teacher": false}, "message": "I'll add John Doe as a student.", "missing_fields": []}

User: "Create payment for John Doe, $500, due 2025-03-15"
Response: {"action": "add_payment", "data": {"student_name": "John Doe", "amount": 500, "due_date": "2025-03-15", "status": "Pending"}, "message": "I'll create a payment of $500 for John Doe due on 2025-03-15.", "missing_fields": []}

User: "Add a student named Mary"
Response: {"action": "add_student", "data": {"name": "Mary", "is_student": true, "is_teacher": false}, "message": "I'd be happy to add Mary as a student. Could you please provide their email address and phone number?", "missing_fields": ["email", "phone"]}

User: "Delete student John Doe"
Response: {"action": "delete_student", "data": {"name": "John Doe"}, "message": "I'll delete the student John Doe from the system.", "missing_fields": []}

User: "Remove payment 5"
Response: {"action": "delete_payment", "data": {"payment_id": 5}, "message": "I'll delete payment #5.", "missing_fields": []}

User: "Delete payment for John Doe"
Response: {"action": "delete_payment", "data": {"student_name": "John Doe"}, "message": "I'll look up and delete the payment for John Doe.", "missing_fields": []}
"""


def get_gemini_response(user_message: str) -> Dict[str, Any]:
    """Get response from Google Gemini API (FREE)"""
    try:
        import google.generativeai as genai
        
        if not GEMINI_API_KEY:
            return {
                "action": "error",
                "message": "Gemini API key not configured. Please set GEMINI_API_KEY environment variable.",
                "data": None
            }
        
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-pro')
        
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser message: {user_message}\n\nRespond with JSON only:"
        
        response = model.generate_content(full_prompt)
        response_text = response.text.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            return json.loads(json_match.group())
        else:
            return {
                "action": "help",
                "message": response_text,
                "data": None
            }
            
    except Exception as e:
        return {
            "action": "error",
            "message": f"Gemini API error: {str(e)}",
            "data": None
        }


def get_azure_openai_response(user_message: str) -> Dict[str, Any]:
    """Get response from Azure OpenAI API"""
    try:
        from openai import AzureOpenAI
        
        if not AZURE_OPENAI_KEY or not AZURE_OPENAI_ENDPOINT:
            return {
                "action": "error",
                "message": "Azure OpenAI not configured. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY.",
                "data": None
            }
        
        # Configure Azure OpenAI client (v1.x SDK)
        client = AzureOpenAI(
            api_key=AZURE_OPENAI_KEY,
            api_version="2024-02-15-preview",
            azure_endpoint=AZURE_OPENAI_ENDPOINT
        )
        
        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.3
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            return json.loads(json_match.group())
        else:
            return {
                "action": "help",
                "message": response_text,
                "data": None
            }
        
    except Exception as e:
        return {
            "action": "error",
            "message": f"Azure OpenAI error: {str(e)}",
            "data": None
        }


def get_ai_response(user_message: str) -> Dict[str, Any]:
    """Get AI response based on configured provider"""
    if AI_PROVIDER == "azure_openai":
        return get_azure_openai_response(user_message)
    else:
        return get_gemini_response(user_message)


def get_fallback_response(user_message: str) -> Dict[str, Any]:
    """Fallback regex-based parsing when AI is not available"""
    text = user_message.lower()
    
    # Detect intent - adding a student
    if any(phrase in text for phrase in ['add student', 'create student', 'new student', 'register student']):
        name_match = re.search(r'(?:student|name)[:\s]+([a-zA-Z\s]+?)(?:,|email|phone|$)', text, re.IGNORECASE)
        if not name_match:
            name_match = re.search(r'(?:add|create|new|register)\s+student\s+([a-zA-Z\s]+?)(?:,|email|phone|$)', text, re.IGNORECASE)
        
        email_match = re.search(r'email[:\s]+([^\s,]+)', text, re.IGNORECASE)
        phone_match = re.search(r'phone[:\s]+([0-9+\-\s]+)', text, re.IGNORECASE)
        
        name = name_match.group(1).strip().title() if name_match else None
        email = email_match.group(1).strip() if email_match else None
        phone = phone_match.group(1).strip().replace(" ", "").replace("-", "") if phone_match else None
        
        missing = []
        if not name:
            missing.append("name")
        if not email:
            missing.append("email")
        if not phone:
            missing.append("phone")
        
        return {
            "action": "add_student",
            "data": {
                "name": name,
                "email": email,
                "phone": phone,
                "is_student": True,
                "is_teacher": False
            },
            "message": f"I'll add {name or 'the student'} to the system." if not missing else f"Please provide: {', '.join(missing)}",
            "missing_fields": missing
        }
    
    # Detect intent - adding a payment
    elif any(phrase in text for phrase in ['add payment', 'create payment', 'new payment', 'record payment']):
        student_match = re.search(r'(?:for|student)[:\s]+([a-zA-Z\s]+?)(?:,|amount|\$|due|$)', text, re.IGNORECASE)
        amount_match = re.search(r'(?:amount[:\s]+)?\$?([0-9.]+)', text, re.IGNORECASE)
        due_match = re.search(r'due[:\s]+([0-9\-]+)', text, re.IGNORECASE)
        
        student_name = student_match.group(1).strip().title() if student_match else None
        amount = float(amount_match.group(1)) if amount_match else None
        due_date = due_match.group(1).strip() if due_match else None
        
        missing = []
        if not student_name:
            missing.append("student_name")
        if not amount:
            missing.append("amount")
        if not due_date:
            missing.append("due_date")
        
        return {
            "action": "add_payment",
            "data": {
                "student_name": student_name,
                "amount": amount,
                "due_date": due_date,
                "status": "Pending"
            },
            "message": f"I'll create a payment for {student_name or 'the student'}." if not missing else f"Please provide: {', '.join(missing)}",
            "missing_fields": missing
        }
    
    # Detect intent - deleting a student
    elif any(phrase in text for phrase in ['delete student', 'remove student', 'drop student']):
        name_match = re.search(r'(?:delete|remove|drop)\s+student\s+([a-zA-Z\s]+?)(?:,|$)', text, re.IGNORECASE)
        name = name_match.group(1).strip().title() if name_match else None
        
        missing = []
        if not name:
            missing.append("name")
        
        return {
            "action": "delete_student",
            "data": {"name": name},
            "message": f"I'll delete the student {name} from the system." if not missing else "Please provide the student name to delete.",
            "missing_fields": missing
        }
    
    # Detect intent - deleting a payment
    elif any(phrase in text for phrase in ['delete payment', 'remove payment', 'cancel payment']):
        id_match = re.search(r'(?:payment)\s*#?\s*(\d+)', text, re.IGNORECASE)
        student_match = re.search(r'(?:for|student)[:\s]+([a-zA-Z\s]+?)(?:,|$)', text, re.IGNORECASE)
        
        payment_id = int(id_match.group(1)) if id_match else None
        student_name = student_match.group(1).strip().title() if student_match else None
        
        missing = []
        if not payment_id and not student_name:
            missing.append("payment_id or student_name")
        
        return {
            "action": "delete_payment",
            "data": {"payment_id": payment_id, "student_name": student_name},
            "message": f"I'll delete payment #{payment_id}." if payment_id else f"I'll delete the payment for {student_name}." if student_name else "Please provide the payment ID or student name.",
            "missing_fields": missing
        }
    
    return {
        "action": "help",
        "message": """I can help you with:
• **Add a student**: "Add student John Doe, email john@email.com, phone 1234567890"
• **Add a payment**: "Add payment for John Doe, amount 500, due 2025-03-15"
• **Delete a student**: "Delete student John Doe"
• **Delete a payment**: "Delete payment 5" or "Delete payment for John Doe"
• **Upload Excel file**: Use the upload button to import bulk data

What would you like to do?""",
        "data": None,
        "missing_fields": []
    }


def process_message(user_message: str, use_ai: bool = True) -> Dict[str, Any]:
    """Process user message with AI or fallback to regex"""
    if use_ai and (GEMINI_API_KEY or (AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT)):
        return get_ai_response(user_message)
    else:
        return get_fallback_response(user_message)
