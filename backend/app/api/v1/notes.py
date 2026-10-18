from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import current_user
from app.models import Candidate,RecruiterNote,User
from app.schemas import NoteIn,NoteOut
router=APIRouter(prefix="/candidates/{candidate_id}/notes",tags=["Recruiter notes"])
def exists(i,db):
 if not db.get(Candidate,i):raise HTTPException(404,"Candidate not found")
@router.get("",response_model=list[NoteOut])
def list_notes(candidate_id:int,db:Session=Depends(get_db),_:User=Depends(current_user)):
 exists(candidate_id,db);return db.query(RecruiterNote).filter_by(candidate_id=candidate_id).order_by(RecruiterNote.created_at.desc()).all()
@router.post("",response_model=NoteOut,status_code=201)
def create_note(candidate_id:int,data:NoteIn,db:Session=Depends(get_db),user:User=Depends(current_user)):
 exists(candidate_id,db);o=RecruiterNote(candidate_id=candidate_id,recruiter_id=user.id,body=data.body);db.add(o);db.commit();db.refresh(o);return o
