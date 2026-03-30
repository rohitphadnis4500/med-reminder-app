from flask import Blueprint, request, jsonify
import MySQLdb
from config import get_db_connection

doctors_bp = Blueprint('doctors_bp', __name__)


# ----------------------------
# ✅ Add a new doctor
# ----------------------------
@doctors_bp.route('/add', methods=['POST'])
def add_doctor():
    data = request.get_json()
    name = data.get('name')
    specialization = data.get('specialization')
    hospital_name = data.get('hospital_name')
    contact_no = data.get('contact_no')
    available_from = data.get('available_from')
    available_to = data.get('available_to')

    if not name or not specialization:
        return jsonify({"error": "Name and specialization are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO doctors (name, specialization, hospital_name, contact_no, available_from, available_to)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (name, specialization, hospital_name, contact_no, available_from, available_to))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Doctor added successfully!"}), 201


# ----------------------------
# ✅ Fetch all doctors (Fixed)
# ----------------------------
@doctors_bp.route('/all', methods=['GET'])
def get_all_doctors():
    conn = get_db_connection()
    cur = conn.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT * FROM doctors ORDER BY name;")
    doctors = cur.fetchall()
    cur.close()
    conn.close()

    # ✅ Convert any datetime or timedelta objects
    for doc in doctors:
        for key, value in doc.items():
            if hasattr(value, 'isoformat'):  # datetime/date
                doc[key] = value.isoformat()
            elif str(type(value)) == "<class 'datetime.timedelta'>":  # time field
                total_seconds = int(value.total_seconds())
                hours = total_seconds // 3600
                minutes = (total_seconds % 3600) // 60
                seconds = total_seconds % 60
                doc[key] = f"{hours:02}:{minutes:02}:{seconds:02}"

    return jsonify(doctors)


# ----------------------------
# ✅ Get doctor by ID
# ----------------------------
@doctors_bp.route('/<int:id>', methods=['GET'])
def get_doctor(id):
    conn = get_db_connection()
    cur = conn.cursor(MySQLdb.cursors.DictCursor)
    cur.execute("SELECT * FROM doctors WHERE id = %s;", (id,))
    doctor = cur.fetchone()
    cur.close()
    conn.close()

    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    return jsonify(doctor)


# ----------------------------
# ✅ Update doctor
# ----------------------------
@doctors_bp.route('/update/<int:id>', methods=['PUT'])
def update_doctor(id):
    data = request.get_json()
    fields = []
    values = []

    for key in ['name', 'specialization', 'hospital_name', 'contact_no', 'available_from', 'available_to','gender']:
        if key in data:
            fields.append(f"{key} = %s")
            values.append(data[key])

    if not fields:
        return jsonify({"error": "No fields to update"}), 400

    values.append(id)

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(f"UPDATE doctors SET {', '.join(fields)} WHERE id = %s;", values)
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Doctor updated successfully!"})


# ----------------------------
# ✅ Delete doctor
# ----------------------------
@doctors_bp.route('/delete/<int:id>', methods=['DELETE'])
def delete_doctor(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM doctors WHERE id = %s;", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Doctor deleted successfully!"})
