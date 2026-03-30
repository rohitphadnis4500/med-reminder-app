from flask import Blueprint, jsonify
import MySQLdb
from config import get_db_connection

users_bp = Blueprint('users', __name__)


@users_bp.route('/', methods=['GET'])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users;")
    users = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(users)
