import os
from datetime import datetime

SMS_LOG_FILE = os.path.join(os.path.dirname(__file__), "..", "sms_logs.json")

def send_sms_notification(phone_number: str, student_name: str, roll_number: str):
    """
    Mock SMS service. In a real application, this would use Twilio, AWS SNS, etc.
    Logs the SMS to a local file for the Enterprise UI to display in 'SMS Logs'.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    message = f"Dear Parent, your ward {student_name} ({roll_number}) was ABSENT for today's session at Vignan Institute. Please check."
    
    log_entry = {
        "timestamp": timestamp,
        "phone": phone_number,
        "student": student_name,
        "rollNo": roll_number,
        "message": message,
        "status": "Delivered ✅"
    }
    
    # Read existing logs
    import json
    logs = []
    if os.path.exists(SMS_LOG_FILE):
        try:
            with open(SMS_LOG_FILE, "r") as f:
                logs = json.load(f)
        except:
            logs = []
            
    logs.insert(0, log_entry) # Most recent first
    
    # Keep only last 100 logs
    logs = logs[:100]
    
    with open(SMS_LOG_FILE, "w") as f:
        json.dump(logs, f, indent=4)
        
    print(f"SMS SENT to {phone_number}: {message}")
    return True
