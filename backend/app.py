import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from models import db
from routes import auth_bp 
from flask_bcrypt import Bcrypt

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'teamigo-secret')

# Database Configuration
if os.environ.get('DATABASE_URL'):
    # Use PostgreSQL on Render
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL').replace('postgres://', 'postgresql://')
else:
    # Use SQLite locally
    basedir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(basedir, 'database', 'teamigo.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CORS Configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:19006",  
            "http://localhost:19000", 
            "exp://localhost:19000",   
            os.environ.get('FRONTEND_URL', '*')  
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
app.register_blueprint(auth_bp)

@app.route('/')
def home():
    return {'message': 'Teamigo backend is working'}
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port)

