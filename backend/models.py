from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


chat_participants = db.Table(
    'chat_participants',
    db.Column('chat_id', db.Integer, db.ForeignKey('chat.id'), primary_key=True),
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    password = db.Column(db.String(120), nullable=True)  
    role = db.Column(db.String(20), nullable=False, default='member')
    profile_picture = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    chats = db.relationship('Chat', secondary=chat_participants, back_populates='participants')

    def __repr__(self):
        return f'<User {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    participants = db.relationship('User', secondary=chat_participants, back_populates='chats')
    messages = db.relationship('Message', backref='chat', lazy='dynamic', order_by='Message.created_at')

    def to_dict(self):
        last_msg = self.messages.order_by(Message.created_at.desc()).first()
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'participants': [user.to_dict() for user in self.participants],
            'last_message': last_msg.to_dict() if last_msg else None
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

    sender = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'chat_id': self.chat_id,
            'sender': self.sender.to_dict() if self.sender else None,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read
        }

class CalendarEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.String(10), nullable=False)  # format: 'YYYY-MM-DD'
    content = db.Column(db.Text, nullable=False)
    color = db.Column(db.String(20), nullable=True)  # for storing color hex codes

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date,
            'content': self.content,
            'color': self.color
        }