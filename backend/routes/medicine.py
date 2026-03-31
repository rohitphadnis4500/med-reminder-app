from flask import Blueprint, request, jsonify
from config import get_db_connection 
from datetime import date, timedelta, datetime

medicines_bp = Blueprint('medicines', __name__)


# ---------------------------
# Fetch all medicines
# ---------------------------
@medicines_bp.route('/all', methods=['GET'])
def get_all_medicines():
    try:
        conn = get_db_connection()
        cur = conn.cursor()  # PyMySQL returns dictionaries by default
        cur.execute("SELECT * FROM medicines;")
        medicines = cur.fetchall()
        cur.close()
        conn.close()

        # Convert datetime/timedelta to string for JSON
        for med in medicines:
            for key, value in med.items():
                if hasattr(value, 'isoformat'):  # for date/datetime
                    med[key] = value.isoformat()
                elif hasattr(value, 'total_seconds'):  # for time/timedelta
                    total_seconds = int(value.total_seconds())
                    hours = total_seconds // 3600
                    minutes = (total_seconds % 3600) // 60
                    seconds = total_seconds % 60
                    med[key] = f"{hours:02}:{minutes:02}:{seconds:02}"

        return jsonify(medicines)
    
    except Exception as e:
        print("Error fetching medicines:", e)
        return jsonify({'error': 'Failed to fetch medicines'}), 500


# ---------------------------
# Add new medicine
# ---------------------------
@medicines_bp.route('/add', methods=['POST'])
def add_medicine():
    data = request.get_json()

    name = data.get('name')
    dosage = data.get('dosage')
    frequency = data.get('frequency')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    # Only up to time3
    time1 = data.get('time1')
    time2 = data.get('time2')
    time3 = data.get('time3')

    # Automatically use today's date if not provided
    today = data.get('today') or str(date.today())

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO medicines 
            (name, dosage, frequency, time1, time2, time3, start_date, end_date, today)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (name, dosage, frequency, time1, time2, time3, start_date, end_date, today))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'message': 'Medicine added successfully!',
            'today': today
        }), 201

    except Exception as e:
        print("Error adding medicine:", e)
        return jsonify({
            'message': 'Failed to add medicine',
            'error': str(e)
        }), 500


# ---------------------------
# Update existing medicine
# ---------------------------
@medicines_bp.route('/update/<int:med_id>', methods=['PUT'])
def update_medicine(med_id):
    data = request.get_json()
    name = data.get('name')
    dosage = data.get('dosage')
    frequency = data.get('frequency')
    time1 = data.get('time1')
    time2 = data.get('time2')
    time3 = data.get('time3')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    today = data.get('today')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get existing medicine
        cur.execute("SELECT * FROM medicines WHERE id = %s", (med_id,))
        existing = cur.fetchone()
        
        if not existing:
            cur.close()
            conn.close()
            return jsonify({'message': 'Medicine not found!'}), 404

        # If front-end tells to move to next day's schedule
        if data.get("move_to_next_day") == True:
            today = (date.fromisoformat(existing["today"]) + timedelta(days=1)).isoformat()

        # Handle move_to_next_time
        elif data.get("move_to_next_time") == True:
            current_time = datetime.now().strftime("%H:%M")
            # if current_time >= time1 and time2 exists → move to time2
            if existing["time2"] and current_time >= str(existing["time1"])[:5] and current_time < str(existing["time2"])[:5]:
                print("Moving to next reminder: time2")
            elif existing["time3"] and current_time >= str(existing["time2"])[:5]:
                print("Moving to next reminder: time3")
            else:
                # All done for today — move to next day
                today = (date.fromisoformat(existing["today"]) + timedelta(days=1)).isoformat()

        # Update medicine
        cur.execute("""
            UPDATE medicines
            SET name=%s, dosage=%s, frequency=%s, time1=%s, time2=%s, time3=%s,
                start_date=%s, end_date=%s, today=%s
            WHERE id=%s
        """, (name, dosage, frequency, time1, time2, time3,
              start_date, end_date, today or existing["today"], med_id))

        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'Medicine updated successfully!', 
            'today': today or existing["today"]
        })

    except Exception as e:
        print("Error while updating medicine:", e)
        return jsonify({'message': 'Failed to update medicine', 'error': str(e)}), 500


# ---------------------------
# Delete medicine
# ---------------------------
@medicines_bp.route('/delete/<int:id>', methods=['DELETE'])
def delete_medicine(id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM medicines WHERE id = %s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Medicine deleted successfully!'})
    
    except Exception as e:
        print("Error deleting medicine:", e)
        return jsonify({'error': 'Failed to delete medicine'}), 500