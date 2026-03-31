from flask import Flask, send_from_directory
from flask_cors import CORS
import os
import sys

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

# Get the root directory (where frontend folder is located)
root_dir = os.path.dirname(backend_dir)

from config import get_db_connection

# Import Blueprints
from routes.user import users_bp
from routes.medicine import medicines_bp
from routes.doctors import doctors_bp
from routes.appointments import appointments_blueprint

# Initialize Flask app with correct static folder
app = Flask(__name__, 
           static_folder=os.path.join(root_dir, 'frontend'),
           static_url_path='')

# Enable CORS for all routes
CORS(app)

# Register Blueprints
app.register_blueprint(users_bp, url_prefix='/users')
app.register_blueprint(medicines_bp, url_prefix='/medicines')
app.register_blueprint(doctors_bp, url_prefix='/doctors')
app.register_blueprint(appointments_blueprint, url_prefix='/appointments')

# ---------------------------
# Serve Frontend Files
# ---------------------------
@app.route('/')
def serve_index():
    """Serve the main index page"""
    frontend_path = os.path.join(root_dir, 'frontend')
    return send_from_directory(frontend_path, 'index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    """
    Serve all frontend files (HTML, CSS, JS, images, etc.)
    If file doesn't exist, serve index.html (for client-side routing)
    """
    frontend_path = os.path.join(root_dir, 'frontend')
    full_path = os.path.join(frontend_path, path)
    
    # Check if the requested file exists
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory(frontend_path, path)
    else:
        # For client-side routing, serve index.html
        return send_from_directory(frontend_path, 'index.html')

# ---------------------------
# Test Database Connection
# ---------------------------
@app.route('/test-db')
def test_db():
    """Test endpoint to verify database connection"""
    try:
        conn = get_db_connection()
        # Test query to verify connection works
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return "✅ Database connection successful!", 200
    except Exception as e:
        return f"❌ Database connection failed: {str(e)}", 500

# ---------------------------
# Health Check Endpoint (for Render)
# ---------------------------
@app.route('/health')
def health_check():
    """Health check endpoint for Render monitoring"""
    return {"status": "healthy", "message": "Server is running"}, 200

# ---------------------------
# API Info Endpoint
# ---------------------------
@app.route('/api/info')
def api_info():
    """Information about available API endpoints"""
    return {
        "name": "Medical Reminder System API",
        "version": "1.0.0",
        "endpoints": {
            "users": "/users/",
            "medicines": "/medicines/all",
            "doctors": "/doctors/all",
            "appointments": "/appointments/doctors/all",
            "test_db": "/test-db",
            "health": "/health"
        }
    }, 200

# ---------------------------
# Error Handlers
# ---------------------------
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors - serve index.html for client-side routes"""
    frontend_path = os.path.join(root_dir, 'frontend')
    return send_from_directory(frontend_path, 'index.html'), 200

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return {"error": "Internal server error"}, 500

# ---------------------------
# Run the Application
# ---------------------------
if __name__ == '__main__':
    # Get port from environment variable (for Render) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    
    # Run the app
    app.run(
        debug=True, 
        host='0.0.0.0', 
        port=port
    )