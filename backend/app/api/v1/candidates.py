from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import or_, func
from sqlalchemy.orm import Session, selectinload
from app.db.session import get_db
from app.api.dependencies import current_user
from app.models import Candidate, User
from app.schemas import CandidateIn,CandidatePatch,CandidateOut,Paginated
router=APIRouter(prefix="/candidates",tags=["Candidates"])
def get_candidate(cid,db):
    item=db.query(Candidate).options(selectinload(Candidate.applications)).filter(Candidate.id==cid).first()
    if not item: raise HTTPException(404,"Candidate not found")
    return item
@router.get("")
def list_candidates(search:str|None=None,skills:str|None=None,min_experience:int|None=None,max_experience:int|None=None,sort_by:str="created_at",order:str="desc",page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),db:Session=Depends(get_db),_:User=Depends(current_user)):
    q=db.query(Candidate)
    if search: q=q.filter(or_(Candidate.full_name.ilike(f"%{search}%"),Candidate.email.ilike(f"%{search}%")))
    if skills: q=q.filter(Candidate.skills.ilike(f"%{skills}%"))
    if min_experience is not None:q=q.filter(Candidate.years_experience>=min_experience)
    if max_experience is not None:q=q.filter(Candidate.years_experience<=max_experience)
    total=q.count(); column=getattr(Candidate,sort_by,Candidate.created_at); column=column.asc() if order=="asc" else column.desc()
    return {"items":q.order_by(column).offset((page-1)*page_size).limit(page_size).all(),"total":total,"page":page,"page_size":page_size}
@router.post("",response_model=CandidateOut,status_code=201)
def create(data:CandidateIn,db:Session=Depends(get_db),_:User=Depends(current_user)):
    if db.query(Candidate).filter(Candidate.email==data.email.lower()).first():raise HTTPException(409,"A candidate with this email already exists")
    values=data.model_dump(exclude={"resume_url", "email"}); values["email"]=data.email.lower(); values["resume_url"]=str(data.resume_url) if data.resume_url else None
    obj=Candidate(**values); db.add(obj);db.commit();db.refresh(obj);return obj
@router.get("/{candidate_id}",response_model=CandidateOut)
def read(candidate_id:int,db:Session=Depends(get_db),_:User=Depends(current_user)):return get_candidate(candidate_id,db)
@router.patch("/{candidate_id}",response_model=CandidateOut)
def patch(candidate_id:int,data:CandidatePatch,db:Session=Depends(get_db),_:User=Depends(current_user)):
    obj=get_candidate(candidate_id,db); values=data.model_dump(exclude_unset=True)
    if "email" in values:
      values["email"]=str(values["email"]).lower(); existing=db.query(Candidate).filter(Candidate.email==values["email"],Candidate.id!=candidate_id).first()
      if existing: raise HTTPException(409,"A candidate with this email already exists")
    if "resume_url" in values: values["resume_url"]=str(values["resume_url"]) if values["resume_url"] else None
    for k,v in values.items():setattr(obj,k,v)
    db.commit();db.refresh(obj);return obj
@router.delete("/{candidate_id}",status_code=204)
def delete(candidate_id:int,db:Session=Depends(get_db),_:User=Depends(current_user)):
    db.delete(get_candidate(candidate_id,db));db.commit();return Response(status_code=204)
