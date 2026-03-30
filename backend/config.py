import MySQLdb

# Database connection details
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = 'rohit@4500'
DB_NAME = 'med_reminder'

def get_db_connection():
    conn = MySQLdb.connect(
        host=DB_HOST,
        user=DB_USER,
        passwd=DB_PASSWORD,
        db=DB_NAME
    )
    return conn