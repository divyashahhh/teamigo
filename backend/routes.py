from flask import Blueprint, request, jsonify
from models import db, User, Chat, Message, CalendarEvent
from flask_bcrypt import Bcrypt
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

        # Does user exist
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

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
        # does user exist
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        events = CalendarEvent.query.filter_by(user_id=user_id).all()
        return jsonify([event.to_dict() for event in events]), 200
    except Exception as e:
        print("Get Events error:", e)
        return jsonify({'error': 'Server error'}), 500

@auth_bp.route('/events/<int:event_id>', methods=['PUT'])
@cross_origin()
def update_event(event_id):
    try:
        data = request.get_json()
        event = CalendarEvent.query.get(event_id)
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        # Verify event ownership
        user_id = data.get('user_id')
        if user_id and event.user_id != user_id:
            return jsonify({'error': 'Unauthorized to modify this event'}), 403

        event.content = data.get('content', event.content)
        event.color = data.get('color', event.color)
        db.session.commit()
        return jsonify({'message': 'Event updated', 'event': event.to_dict()}), 200
    except Exception as e:
        print("Update Event error:", e)
        return jsonify({'error': 'Server error'}), 500

@auth_bp.route('/events/<int:event_id>', methods=['DELETE'])
@cross_origin()
def delete_event(event_id):
    try:
        event = CalendarEvent.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        # Verify event ownership
        user_id = request.args.get('user_id')
        if user_id and int(user_id) != event.user_id:
            return jsonify({'error': 'Unauthorized to delete this event'}), 403

        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted'}), 200
    except Exception as e:
        print("Delete Event error:", e)
        return jsonify({'error': 'Server error'}), 500

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
    print(f"[DEBUG] /chats called with user_id={user_id}")

    if not user_id:
        return jsonify({'error': 'User ID required'}), 400

    user = User.query.get(user_id)
    if not user:
        print(f"[404] No user found with ID: {user_id}")
        return jsonify({'error': 'User not found'}), 404

    chats = user.chats.order_by(Chat.updated_at.desc()).all()
    return jsonify([chat.to_dict() for chat in chats]), 200

@auth_bp.route('/chats', methods=['POST'])
@cross_origin()
def create_chat():
    try:
        data = request.get_json()
        user_ids = data.get('user_ids', [])

        if len(user_ids) < 2:
            return jsonify({'error': 'At least 2 participants required'}), 400

        existing_chats = Chat.query.all()
        for chat in existing_chats:
            if set(p.id for p in chat.participants) == set(user_ids):
                return jsonify(chat.to_dict()), 200

        chat = Chat()
        participants = User.query.filter(User.id.in_(user_ids)).all()
        chat.participants = participants
        db.session.add(chat)
        db.session.commit()

        return jsonify(chat.to_dict()), 201

    except Exception as e:
        print(f"[500] Chat creation error: {e}")
        return jsonify({'error': 'Server error creating chat'}), 500

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


@auth_bp.route('/save-event', methods=['POST'])
@cross_origin()
def save_event():
    data = request.get_json()

    required_fields = ['id', 'date', 'text', 'color']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    print(f"[INFO] /save-event received: {data}")
    return jsonify({'success': True, 'message': 'Event received'}), 200

@auth_bp.route('/apple-login', methods=['POST'])
@cross_origin()
def apple_login():
    try:
        data = request.get_json()
        email = data.get('email')
        name = data.get('name') or "Apple User"
        apple_user_id = data.get('apple_user_id')

        if not email:
            return jsonify({'error': 'Email is required for Apple login'}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            user = User(
                email=email,
                name=name,
                password=None,
                role='member'
            )
            db.session.add(user)
            db.session.commit()

        return jsonify(user.to_dict()), 200

    except Exception as e:
        print(f"[500] Apple login error: {e}")
        return jsonify({'error': 'Server error during Apple login'}), 500
    
@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@cross_origin()
def update_user(user_id):
    try:
        print(f"🔍 PUT /users/{user_id}")
        user = User.query.get(user_id)
        if not user:
            print(f"[404] No user found with ID: {user_id}")
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        new_name = data.get('name')

        if not new_name:
            return jsonify({'error': 'Missing name'}), 400

        user.name = new_name
        db.session.commit()

        print(f"[200] Updated name for user {user_id} to {new_name}")
        return jsonify({'message': 'User updated successfully', 'user': user.to_dict()}), 200

    except Exception as e:
        print(f"[500] Error updating user: {e}")
        return jsonify({'error': 'Server error updating user'}), 500