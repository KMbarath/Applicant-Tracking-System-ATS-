from datetime import datetime, timedelta, timezone
import jwt
from pwdlib import PasswordHash
from app.core.config import get_settings
password_hash=PasswordHash.recommended(); settings=get_settings()
def hash_password(password): return password_hash.hash(password)
def verify_password(password, hashed): return password_hash.verify(password, hashed)
def create_access_token(subject):
    payload={"sub":str(subject),"exp":datetime.now(timezone.utc)+timedelta(minutes=settings.access_token_expire_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
