from fastapi import APIRouter,Depends,HTTPException,Query
from sqlalchemy.orm import Session,selectinload
from sqlalchemy import and_
from datetime import datetime
from app.db.session import get_db
from app.api.dependencies import current_user
from app.models import Application,Candidate,Job,Stage,ApplicationStageHistory,User,JobStatus
from app.schemas import ApplicationIn,ApplicationOut,StageUpdate,HistoryOut,Paginated
router=APIRouter(prefix="/applications",tags=["Applications"])
terminal={Stage.hired,Stage.rejected}
allowed={Stage.applied:{Stage.screening,Stage.rejected},Stage.screening:{Stage.interview,Stage.rejected,Stage.applied},Stage.interview:{Stage.offer,Stage.rejected,Stage.screening},Stage.offer:{Stage.hired,Stage.rejected,Stage.interview},Stage.hired:set(),Stage.rejected:set()}
def detail(i,db):
 o=db.query(Application).options(selectinload(Application.candidate),selectinload(Application.job)).filter(Application.id==i).first()
 if not o:raise HTTPException(404,"Application not found")
 return o
@router.get("")
def list_apps(stage:Stage|None=None,job_id:int|None=None,candidate_id:int|None=None,candidate_search:str|None=None,skills:str|None=None,job_title:str|None=None,min_experience:int|None=None,max_experience:int|None=None,job_status:JobStatus|None=None,date_from:datetime|None=None,date_to:datetime|None=None,page:int=Query(1,ge=1),page_size:int=Query(100,ge=1,le=200),db:Session=Depends(get_db),_:User=Depends(current_user)):
 q=db.query(Application).join(Candidate).join(Job).options(selectinload(Application.candidate),selectinload(Application.job))
 if stage:q=q.filter(Application.stage==stage)
 if job_id:q=q.filter(Application.job_id==job_id)
 if candidate_id:q=q.filter(Application.candidate_id==candidate_id)
 if candidate_search:q=q.filter((Candidate.full_name.ilike(f"%{candidate_search}%")) | (Candidate.email.ilike(f"%{candidate_search}%")))
 if skills:q=q.filter(Candidate.skills.ilike(f"%{skills}%"))
 if job_title:q=q.filter(Job.title.ilike(f"%{job_title}%"))
 if min_experience is not None:q=q.filter(Candidate.years_experience>=min_experience)
 if max_experience is not None:q=q.filter(Candidate.years_experience<=max_experience)
 if job_status:q=q.filter(Job.status==job_status)
 if date_from:q=q.filter(Application.applied_at>=date_from)
 if date_to:q=q.filter(Application.applied_at<=date_to)
 total=q.count();return {"items":q.order_by(Application.updated_at.desc()).offset((page-1)*page_size).limit(page_size).all(),"total":total,"page":page,"page_size":page_size}
@router.post("",response_model=ApplicationOut,status_code=201)
def create(data:ApplicationIn,db:Session=Depends(get_db),user:User=Depends(current_user)):
 if not db.get(Candidate,data.candidate_id):raise HTTPException(404,"Candidate not found")
 job=db.get(Job,data.job_id)
 if not job:raise HTTPException(404,"Job not found")
 if job.status.value=="closed":raise HTTPException(400,"Applications cannot be created for a closed job")
 if db.query(Application).filter_by(candidate_id=data.candidate_id,job_id=data.job_id).first():raise HTTPException(409,"Candidate already has an application for this job")
 values=data.model_dump(exclude={"assigned_recruiter_id"}); values["assigned_recruiter_id"]=data.assigned_recruiter_id or user.id
 o=Application(**values);db.add(o);db.flush();db.add(ApplicationStageHistory(application_id=o.id,previous_stage=None,new_stage=Stage.applied,changed_by_id=user.id));db.commit();return detail(o.id,db)
@router.get("/{application_id}",response_model=ApplicationOut)
def read(application_id:int,db:Session=Depends(get_db),_:User=Depends(current_user)):return detail(application_id,db)
@router.patch("/{application_id}/stage",response_model=ApplicationOut)
def move(application_id:int,data:StageUpdate,db:Session=Depends(get_db),user:User=Depends(current_user)):
 o=detail(application_id,db)
 if o.stage==data.stage:return o
 if data.stage not in allowed[o.stage]:raise HTTPException(400,f"Transition from {o.stage.value} to {data.stage.value} is not permitted")
 previous=o.stage;o.stage=data.stage;o.rejection_reason=data.rejection_reason if data.stage==Stage.rejected else None;o.offer_information=data.offer_information if data.stage==Stage.offer else o.offer_information
 db.add(ApplicationStageHistory(application_id=o.id,previous_stage=previous,new_stage=data.stage,changed_by_id=user.id));db.commit();return detail(o.id,db)
@router.get("/{application_id}/history",response_model=list[HistoryOut])
def history(application_id:int,db:Session=Depends(get_db),_:User=Depends(current_user)):
 detail(application_id,db);return db.query(ApplicationStageHistory).filter_by(application_id=application_id).order_by(ApplicationStageHistory.changed_at.desc()).all()
