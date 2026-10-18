from fastapi import APIRouter,Depends
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.api.dependencies import current_user
from app.models import Candidate,Application,Stage,ApplicationStageHistory,User,Job
router=APIRouter(prefix="/dashboard",tags=["Dashboard"])
@router.get("/summary")
def summary(job_id:int|None=None,date_from:datetime|None=None,date_to:datetime|None=None,db:Session=Depends(get_db),_:User=Depends(current_user)):
 q=db.query(Application)
 if job_id:q=q.filter(Application.job_id==job_id)
 if date_from:q=q.filter(Application.applied_at>=date_from)
 if date_to:q=q.filter(Application.applied_at<=date_to)
 counts=dict(q.with_entities(Application.stage,func.count(Application.id)).group_by(Application.stage).all())
 total_candidates=q.with_entities(func.count(func.distinct(Application.candidate_id))).scalar() if (job_id or date_from or date_to) else db.query(Candidate).count()
 count=lambda s:counts.get(s,0)
 return {"total_candidates":total_candidates,"active_applications":sum(count(s) for s in (Stage.applied,Stage.screening,Stage.interview,Stage.offer)),"screening":count(Stage.screening),"interviews":count(Stage.interview),"offers":count(Stage.offer),"hired":count(Stage.hired),"rejected":count(Stage.rejected),"conversion_rate":round((count(Stage.hired)/q.count()*100),1) if q.count() else 0}
@router.get("/stage-distribution")
def distribution(job_id:int|None=None,date_from:datetime|None=None,date_to:datetime|None=None,db:Session=Depends(get_db),_:User=Depends(current_user)):
 q=db.query(Application.stage,func.count(Application.id)).group_by(Application.stage)
 if job_id:q=q.filter(Application.job_id==job_id)
 if date_from:q=q.filter(Application.applied_at>=date_from)
 if date_to:q=q.filter(Application.applied_at<=date_to)
 values=dict(q.all());return [{"stage":s.value,"count":values.get(s,0)} for s in Stage]
@router.get("/application-trends")
def trends(job_id:int|None=None,date_from:datetime|None=None,date_to:datetime|None=None,db:Session=Depends(get_db),_:User=Depends(current_user)):
 q=db.query(func.strftime('%Y-%m',Application.applied_at).label('period'),func.count(Application.id))
 if job_id:q=q.filter(Application.job_id==job_id)
 if date_from:q=q.filter(Application.applied_at>=date_from)
 if date_to:q=q.filter(Application.applied_at<=date_to)
 rows=q.group_by('period').order_by('period').all();return [{"period":p,"applications":n} for p,n in rows]
@router.get("/recent-activity")
def activity(db:Session=Depends(get_db),_:User=Depends(current_user)):
 rows=db.query(ApplicationStageHistory,Application,Candidate,Job).join(Application,Application.id==ApplicationStageHistory.application_id).join(Candidate,Candidate.id==Application.candidate_id).join(Job,Job.id==Application.job_id).order_by(ApplicationStageHistory.changed_at.desc()).limit(10).all()
 return [{"id":h.id,"candidate":c.full_name,"job":j.title,"from_stage":h.previous_stage.value if h.previous_stage else None,"to_stage":h.new_stage.value,"changed_at":h.changed_at} for h,a,c,j in rows]
