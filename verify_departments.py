#!/usr/bin/env python3
from backend.app.database import get_db_connection

try:
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('SELECT COUNT(*) FROM departments')
    count = cur.fetchone()[0]
    print(f'✅ Total departments in database: {count}')
    
    print('\n📋 Departments List:')
    print('-' * 70)
    cur.execute('SELECT id, name, code, specialization FROM departments ORDER BY name')
    
    for dept_id, name, code, spec in cur.fetchall():
        spec_text = f' - {spec}' if spec else ''
        print(f'  {dept_id:2d}. {name:<45} [{code}]{spec_text}')
    
    print('-' * 70)
    print(f'\n✅ All {count} VIIT departments loaded successfully!')
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f'❌ Error: {e}')
