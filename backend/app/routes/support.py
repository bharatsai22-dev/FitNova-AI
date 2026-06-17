import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter()

class SupportTicketSchema(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    category: str  # e.g., "Hardware", "Subscription", "AI Feedback Error"
    message: str

def dispatch_support_email(ticket: SupportTicketSchema):
    """
    SMTP Worker Task run asynchronously in the background.
    """
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SENDER_EMAIL = os.getenv("SUPPORT_EMAIL", "support@fitnova-dev.com")
    SENDER_PASSWORD = os.getenv("SUPPORT_PASSWORD", "your_email_app_password")

    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = SENDER_EMAIL  # Mails route directly to your operations inbox
        msg['Subject'] = f"🚨 FitNova Help Ticket [{ticket.category}] - From {ticket.name}"

        body = f"""
        FitNova Help Desk - New Ticket Received
        -----------------------------------------------
        User ID:       {ticket.user_id}
        User Name:     {ticket.name}
        User Email:    {ticket.email}
        Issue Area:    {ticket.category}
        
        Message Details:
        {ticket.message}
        -----------------------------------------------
        """
        msg.attach(MIMEText(body, 'plain'))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"📬 Support ticket email sent successfully for user {ticket.user_id}")
        
    except Exception as smtp_err:
        # Logs the error but doesn't crash the frontend user session response
        print(f"❌ Background Mailer Error: {str(smtp_err)}")


@router.post("/support/ticket", status_code=status.HTTP_202_ACCEPTED)
async def submit_support_ticket(payload: SupportTicketSchema, background_tasks: BackgroundTasks):
    """
    Receives the ticket, pushes the email logic to a background worker, and returns immediately.
    """
    try:
        background_tasks.add_task(dispatch_support_email, payload)
        return {
            "status": "success", 
            "message": "Ticket submitted successfully. Our support desk has been notified."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mailer submission engine failure: {str(e)}")