from flask import Blueprint, jsonify
from config import get_db_connection

users_bp = Blueprint('users', __name__)


@users_bp.route('/', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cur = conn.cursor()  # PyMySQL cursor returns dictionaries by default
        
        # Don't return passwords for security (select only needed fields)
        cur.execute("SELECT id, name, email, created_at FROM users;")
        users = cur.fetchall()
        
        cur.close()
        conn.close()
        
        # Convert datetime objects to strings for JSON serialization
        for user in users:
            if 'created_at' in user and hasattr(user['created_at'], 'isoformat'):
                user['created_at'] = user['created_at'].isoformat()
        
        return jsonify(users)
    
    except Exception as e:
        print("Error fetching users:", e)
        return jsonify({'error': 'Failed to fetch users'}), 500