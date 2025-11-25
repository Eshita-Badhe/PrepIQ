from flask import request, jsonify, session, Flask
from flask_mail import Message, Mail
from flask_login import current_user
import random, time
import os
import pymysql
from werkzeug.security import generate_password_hash
from flask_cors import CORS
import re
import dns.resolver 

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "fallback_dev_key")

app.config['MYSQL_HOST'] = os.getenv('DB_HOST', 'localhost')
app.config['MYSQL_PORT'] = int(os.getenv('DB_PORT', 3306))
app.config['MYSQL_USER'] = os.getenv('DB_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('DB_PASSWORD')
app.config['MYSQL_DB'] =  os.getenv('DB_NAME')
app.config['MYSQL_CURSORCLASS'] = os.getenv('DB_CURSORCLASS', 'DictCursor')

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = os.getenv('MAIL_PORT', 587)
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] =  os.getenv('MAIL_PASSWORD')
mail = Mail(app)

CORS(app, supports_credentials=True)

import re
import dns.resolver  # pip install dnspython

def is_email_valid(email):
    # 1. Format check (simple regex, covers basic emails)
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(pattern, email):
        print("EMAIL CHECK: Invalid format for email:", email)
        return False, "Invalid email format"
    
    # 2. MX record check: Ensure domain is routable by mail
    domain = email.split('@')[1]
    try:
        records = dns.resolver.resolve(domain, 'MX')
        if not records:
            print("EMAIL CHECK: No MX records for domain:", domain)
            return False, "Email domain does not exist"
    except Exception:
        print("EMAIL CHECK: MX lookup failed for domain:", domain)
        return False, "Email domain not reachable"

    # 3. Database existence check
    print(get_db_connection())
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()  # Good to always close connection!

    if user:
        print("EMAIL CHECK: Email already registered:", email)
        return False, "Email already registered"

    print("EMAIL CHECK: Email is valid and available:", email)
    return True, "Email is valid and available"


@app.route('/api/send-otp', methods=['POST'])
def api_send_otp():
    try:
        data = request.get_json()
        email = data.get('email')  
        print("REQUESTED EMAIL FOR OTP:", email)   
        valid, message = is_email_valid(email)
        print("EMAIL VALIDATION:", valid, message)
        if valid:
            otp = str(random.randint(100000, 999999))
            session['otp'] = otp
            session['otp_time'] = time.time()
            # Send email
            msg = Message("Your Exam Buddy OTP", sender=app.config['MAIL_USERNAME'], recipients=[email])
            msg.body = f"Your OTP is: {otp}. It expires in 5 minutes."
            try:
                mail.send(msg)
            except Exception as e:
                print("MAIL SEND ERROR:", e)
                return jsonify({"success": False, "msg": f"Mail send failed: {e}"}), 500
            return jsonify({"success": True, "msg": "OTP sent."})
        else:
            return jsonify({"success": False, "msg": message})
    except Exception as e:
        print("SEND OTP GENERAL ERROR:", e)
        return jsonify({"success": False, "msg": "Internal error: "+str(e)}), 500

@app.route('/api/verify-otp', methods=['POST'])
def api_verify_otp():
    data = request.get_json()
    user_otp = data.get('otp')
    stored_otp = session.get('otp')
    stored_time = session.get('otp_time')
    print("VERIFYING OTP. User OTP:", user_otp, "Stored OTP:", stored_otp)
    # Expiry: 5 mins
    if not stored_otp or not stored_time or time.time() - stored_time > 300:
        print("OTP ERROR: OTP expired or not found")
        return jsonify({"success": False, "msg": "OTP expired"})
    if user_otp == stored_otp:
        session.pop('otp', None)
        print("OTP VERIFIED SUCCESSFULLY")
        return jsonify({"success": True, "msg": "OTP verified"})
    else:
        return jsonify({"success": False, "msg": "OTP does not match"})


# Database Configuration
db_config = {
    'host': app.config['MYSQL_HOST'],
    'port': app.config['MYSQL_PORT'],
    'user': app.config['MYSQL_USER'],
    'password': app.config['MYSQL_PASSWORD'],
    'database': app.config['MYSQL_DB']
}

def get_db_connection():
    print("Connecting to DB with config:", db_config)
    try:    
        print("Attempting DB CONNECTION...")    
        conn = pymysql.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database=db_config['database'],
            connect_timeout=5,
            cursorclass=pymysql.cursors.DictCursor  
        )
        print("DB CONNECTION SUCCESSFUL")
        return conn
    except Exception as e:
        print("DB CONNECTION ERROR:", e)
        return None

@app.route('/api/register', methods=['POST'])
def api_register():
    try:
        # Get data and debug print
        data = request.get_json()
        print("Register received:", data)

        # Parse fields
        username = data.get('username')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        email = data.get('email')
        age = data.get('age')
        account_type = data.get('accountType')
        direct_login = data.get('directLogin')
        terms_agreed = data.get('termsAgreed')

        # Validation
        if not all([username, password, email, terms_agreed]):
            return jsonify({"error": "Missing required fields"}), 400
        if password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400

        # Hash password
        hashed_password = generate_password_hash(password)

        # Insert into DB
        conn = get_db_connection()  # Replace with your pymysql setup
        cursor = conn.cursor()

        query = """
        INSERT INTO users 
        (username, password, email, age, account_type, direct_login, terms_agreed)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            username,
            hashed_password,
            email,
            age,
            account_type,
            direct_login,
            terms_agreed
        )

        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "User registered successfully!"}), 201

    except pymysql.Error as err:
        return jsonify({"error": f"Database Error: {err}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/direct-login-status')
def direct_login_status():
    # Only logged-in sessions get direct login
    if current_user.is_authenticated:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT direct_login FROM users WHERE id=%s", (current_user.id,))
        res = cursor.fetchone()
        cursor.close()
        if res and res['direct_login']:
            return jsonify({"status": "direct"})
        else:
            return jsonify({"status": "normal"})
    # Not logged in
    return jsonify({"status": "login"})



if __name__ == '__main__':
    app.run(debug=True)
