from flask import Flask
from flask_cors import CORS
import config

# Import Blueprints
from routes.user import users_bp
from routes.medicine import medicines_bp
from routes.doctors import doctors_bp

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(users_bp, url_prefix='/users')
app.register_blueprint(medicines_bp, url_prefix='/medicines')
app.register_blueprint(doctors_bp, url_prefix='/doctors')

@app.route('/')
def home():
    print("Database connected")
    return "Flask + MySQL Connected Successfully!"

if __name__ == '__main__':
    app.run(debug=True)
