from fastapi import APIRouter, Depends, HTTPException, status, Request
from collections import defaultdict, deque
from time import monotonic
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import User
from app.schemas import UserRegister, UserOut, Login, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.api.dependencies import current_user
router=APIRouter(prefix="/auth",tags=["Authentication"])
attempts=defaultdict(deque)
def throttle(request:Request):
    key=request.client.host if request.client else "unknown"; now=monotonic(); bucket=attempts[key]
    while bucket and now-bucket[0]>60: bucket.popleft()
    if len(bucket)>=10: raise HTTPException(429,"Too many sign-in attempts. Try again in a minute.")
    bucket.append(now)
@router.post("/register",response_model=UserOut,status_code=201)
def register(data:UserRegister,db:Session=Depends(get_db)):
    if db.query(User).filter(User.email==data.email.lower()).first(): raise HTTPException(409,"An account with this email already exists")
    user=User(name=data.name,email=data.email.lower(),password_hash=hash_password(data.password)); db.add(user); db.commit(); db.refresh(user); return user
@router.post("/login",response_model=Token)
def login(data:Login,request:Request,db:Session=Depends(get_db)):
    throttle(request)
    user=db.query(User).filter(User.email==data.email.lower()).first()
    if not user or not verify_password(data.password,user.password_hash): raise HTTPException(status.HTTP_401_UNAUTHORIZED,"Incorrect email or password")
    attempts.pop(request.client.host if request.client else "unknown", None)
    return Token(access_token=create_access_token(user.id),user=user)
@router.get("/me",response_model=UserOut)
def me(user:User=Depends(current_user)): return user
