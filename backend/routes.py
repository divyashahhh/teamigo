from flask import Blueprint, request, jsonify
from models import db, User, Chat, Message
from flask_bcrypt import Bcrypt
from models import CalendarEvent 
from flask_cors import cross_origin
from datetime import datetime

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        if not email or not password or not role:
            return jsonify({'error': 'Missing fields'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(name=name, email=email, password=hashed_pw, role=role)
        db.session.add(user)
        db.session.commit()

        return jsonify({'message': 'User created'}), 201
    except Exception as e:
        print("Signup error:", e)
        return jsonify({'error': 'Server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            return jsonify(user.to_dict()), 200

        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Server error'}), 500
    
@auth_bp.route('/events', methods=['POST'])
@cross_origin()
def create_event():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        date = data.get('date')
        content = data.get('content')
        color = data.get('color')

        if not user_id or not date or not content:
            return jsonify({'error': 'Missing fields'}), 400

        event = CalendarEvent(
            user_id=user_id,
            date=date,
            content=content,
            color=color
        )
        db.session.add(event)
        db.session.commit()

        return jsonify({'message': 'Event created', 'event': event.to_dict()}), 201
    except Exception as e:
        print("Create Event error:", e)
        return jsonify({'error': 'Server error'}), 500

@auth_bp.route('/events/<int:user_id>', methods=['GET'])
@cross_origin()
def get_events(user_id):
    try:
        events = CalendarEvent.query.filter_by(user_id=user_id).all()
        return jsonify([event.to_dict() for event in events]), 200
    except Exception as e:
        print("Get Events error:", e)
        return jsonify({'error': 'Server error'}), 500\
        

@auth_bp.route('/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    data = request.get_json()
    event = CalendarEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    event.content = data.get('content', event.content)
    event.color = data.get('color', event.color)
    db.session.commit()
    return jsonify({'message': 'Event updated', 'event': event.to_dict()}), 200


@auth_bp.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    event = CalendarEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Event deleted'}), 200

@auth_bp.route('/users/search', methods=['GET'])
@cross_origin()
def search_users():
    query = request.args.get('q', '')
    if not query:
        return jsonify([]), 200
    
    users = User.query.filter(
        (User.name.ilike(f'%{query}%')) | 
        (User.email.ilike(f'%{query}%'))
    ).limit(20).all()
    
    return jsonify([user.to_dict() for user in users]), 200

@auth_bp.route('/chats', methods=['GET'])
@cross_origin()
def get_user_chats():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    chats = user.chats.order_by(Chat.updated_at.desc()).all()
    return jsonify([chat.to_dict() for chat in chats]), 200

@auth_bp.route('/chats', methods=['POST'])
@cross_origin()
def create_chat():
    data = request.get_json()
    user_ids = data.get('user_ids', [])
    
    if len(user_ids) < 2:
        return jsonify({'error': 'At least 2 participants required'}), 400
    
    # Check if chat already exists between these users
    existing_chats = Chat.query.all()
    for chat in existing_chats:
        if set(p.id for p in chat.participants) == set(user_ids):
            return jsonify(chat.to_dict()), 200
    
    # Create new chat
    chat = Chat()
    participants = User.query.filter(User.id.in_(user_ids)).all()
    chat.participants = participants
    
    db.session.add(chat)
    db.session.commit()
    
    return jsonify(chat.to_dict()), 201

@auth_bp.route('/chats/<int:chat_id>/messages', methods=['GET'])
@cross_origin()
def get_messages(chat_id):
    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({'error': 'Chat not found'}), 404
    
    messages = chat.messages.order_by(Message.created_at.desc()).all()
    return jsonify([message.to_dict() for message in messages]), 200

@auth_bp.route('/messages', methods=['POST'])
@cross_origin()
def send_message():
    data = request.get_json()
    chat_id = data.get('chat_id')
    sender_id = data.get('sender_id')
    content = data.get('content')
    
    if not all([chat_id, sender_id, content]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    message = Message(
        chat_id=chat_id,
        sender_id=sender_id,
        content=content
    )
    
    chat = Chat.query.get(chat_id)
    if chat:
        chat.updated_at = datetime.utcnow()
    
    db.session.add(message)
    db.session.commit()
    
    return jsonify(message.to_dict()), 201

@auth_bp.route('/messages/<int:message_id>/read', methods=['POST'])
@cross_origin()
def mark_as_read(message_id):
    message = Message.query.get(message_id)
    if not message:
        return jsonify({'error': 'Message not found'}), 404
    
    message.is_read = True
    db.session.commit()
    
    return jsonify(message.to_dict()), 200
    