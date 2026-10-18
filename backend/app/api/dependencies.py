from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
from app.db.session import get_db
from app.core.config import get_settings
from app.models import User
oauth2_scheme=OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
def current_user(token:str=Depends(oauth2_scheme), db:Session=Depends(get_db)):
    try: uid=int(jwt.decode(token,get_settings().jwt_secret,algorithms=[get_settings().jwt_algorithm])["sub"])
    except Exception: raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authentication token")
    user=db.get(User,uid)
    if not user: raise HTTPException(status_code=401,detail="User no longer exists")
    return user
