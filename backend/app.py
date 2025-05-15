import os
from flask import Flask
from flask_cors import CORS
from models import db
from routes import auth_bp
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.config['SECRET_KEY'] = 'teamigo-secret'
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'database', 'teamigo.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)
app.register_blueprint(auth_bp)

@app.route('/')
def home():
    return {'message': 'Teamigo backend is working'}

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5002, host='0.0.0.0')

