import os
import pymysql
from dotenv import load_dotenv

# Load environment variables from .env file (for local development)
load_dotenv()

# Database configuration - will use environment variables on Render
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'med_reminder')
DB_PORT = int(os.getenv('DB_PORT', 3306))

# Connection pool settings (optional, improves performance)
DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', 5))
DB_POOL_RECYCLE = int(os.getenv('DB_POOL_RECYCLE', 3600))  # Recycle connections after 1 hour

# Print database configuration (without password) for debugging
print(f"📊 Database Configuration:")
print(f"   Host: {DB_HOST}")
print(f"   Port: {DB_PORT}")
print(f"   Database: {DB_NAME}")
print(f"   User: {DB_USER}")
print(f"   Password: {'*' * len(DB_PASSWORD) if DB_PASSWORD else 'Not set'}")


def get_db_connection():
    """
    Create and return a database connection
    
    Returns:
        pymysql.Connection: Database connection object
    
    Raises:
        Exception: If connection fails
    """
    try:
        # Create connection with timeout and retry settings
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            port=DB_PORT,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=30,  # 30 seconds timeout
            read_timeout=30,     # 30 seconds read timeout
            write_timeout=30,    # 30 seconds write timeout
            autocommit=False     # Manual commit for better control
        )
        
        # Test the connection
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        print(f"✅ Database connection successful to {DB_HOST}:{DB_PORT}/{DB_NAME}")
        return conn
        
    except pymysql.err.OperationalError as e:
        print(f"❌ Database operational error: {e}")
        print("   Please check:")
        print(f"   1. Host '{DB_HOST}' is reachable")
        print(f"   2. Port {DB_PORT} is open")
        print(f"   3. Username '{DB_USER}' is correct")
        print(f"   4. Password is correct")
        raise
        
    except pymysql.err.ProgrammingError as e:
        print(f"❌ Database programming error: {e}")
        print("   Please check:")
        print(f"   1. Database '{DB_NAME}' exists")
        print(f"   2. User '{DB_USER}' has permissions")
        raise
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise


def test_db_connection():
    """
    Test database connection without raising exceptions
    
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        conn = get_db_connection()
        
        # Try to execute a simple query
        with conn.cursor() as cursor:
            cursor.execute("SELECT VERSION() as version, NOW() as current_time")
            result = cursor.fetchone()
            
        conn.close()
        
        return True, f"Connected to MySQL {result['version']}"
        
    except Exception as e:
        return False, str(e)


def get_db_status():
    """
    Get detailed database status information
    
    Returns:
        dict: Database status information
    """
    try:
        conn = get_db_connection()
        status = {}
        
        with conn.cursor() as cursor:
            # Get MySQL version
            cursor.execute("SELECT VERSION() as version")
            status['mysql_version'] = cursor.fetchone()['version']
            
            # Get database size
            cursor.execute("""
                SELECT 
                    table_schema AS 'database',
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb'
                FROM information_schema.tables 
                WHERE table_schema = %s
                GROUP BY table_schema
            """, (DB_NAME,))
            result = cursor.fetchone()
            status['database_size_mb'] = result['size_mb'] if result else 0
            
            # Get table counts
            cursor.execute("""
                SELECT 
                    table_name,
                    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
                FROM information_schema.tables 
                WHERE table_schema = %s
                ORDER BY (data_length + index_length) DESC
            """, (DB_NAME,))
            status['tables'] = cursor.fetchall()
            
            # Get total record counts
            tables_count = {}
            for table in status['tables']:
                cursor.execute(f"SELECT COUNT(*) as count FROM {table['table_name']}")
                tables_count[table['table_name']] = cursor.fetchone()['count']
            status['record_counts'] = tables_count
        
        conn.close()
        return status
        
    except Exception as e:
        return {'error': str(e)}


# Optional: Create a connection pool (for advanced usage)
class DatabasePool:
    """Simple connection pool manager"""
    
    def __init__(self):
        self.connections = []
        
    def get_connection(self):
        """Get a connection from the pool or create new one"""
        if self.connections:
            return self.connections.pop()
        return get_db_connection()
    
    def return_connection(self, conn):
        """Return connection to the pool"""
        if len(self.connections) < DB_POOL_SIZE:
            # Ensure connection is still alive
            try:
                conn.ping(reconnect=True)
                self.connections.append(conn)
            except:
                conn.close()
        else:
            conn.close()
    
    def close_all(self):
        """Close all connections in the pool"""
        for conn in self.connections:
            try:
                conn.close()
            except:
                pass
        self.connections.clear()


# Create a global pool instance (optional)
db_pool = DatabasePool()


# For backward compatibility, keep the original function name
# This ensures existing code doesn't break
get_db = get_db_connection