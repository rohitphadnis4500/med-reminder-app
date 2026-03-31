from flask import Blueprint, jsonify
from config import get_db_connection  # ✅ Import shared database connection

appointments_blueprint = Blueprint("appointments", __name__)

@appointments_blueprint.route("/doctors/all", methods=["GET"])
def get_all_doctors():
    """
    Fetch all doctors from the database
    Returns JSON list of doctors with id, name, specialization, hospital_name, contact_no
    """
    try:
        # ✅ Use the same database connection as other files
        conn = get_db_connection()
        cursor = conn.cursor()  # PyMySQL cursor returns dictionaries by default
        
        # Execute query
        cursor.execute("SELECT id, name, specialization, hospital_name, contact_no FROM doctors")
        doctors = cursor.fetchall()
        
        # Close connections
        cursor.close()
        conn.close()
        
        # Return JSON response
        return jsonify(doctors)
    
    except Exception as e:
        # Log error and return error response
        print(f"Error fetching doctors: {e}")
        return jsonify({"error": "Failed to fetch doctors"}), 500