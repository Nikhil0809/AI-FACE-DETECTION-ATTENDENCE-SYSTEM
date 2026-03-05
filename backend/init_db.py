import os
from app.database import get_db_connection

def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        sql_file_path = os.path.join(os.path.dirname(__file__), 'database_enhanced.sql')
        with open(sql_file_path, 'r') as f:
            sql_script = f.read()
        
        # Split SQL script by semicolons and execute each statement
        statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
        
        for statement in statements:
            try:
                cur.execute(statement)
                print(f"✓ Executed: {statement[:60]}...")
            except Exception as e:
                print(f"⚠ Warning on statement: {statement[:60]}... - {e}")
                conn.rollback()
                cur = conn.cursor()  # Create new cursor after rollback
        
        conn.commit()
        cur.close()
        conn.close()
        print("\n✅ Database initialized successfully with all VIIT departments!")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

if __name__ == "__main__":
    init_db()
