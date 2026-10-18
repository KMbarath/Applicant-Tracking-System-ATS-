from fastapi import APIRouter,Depends,HTTPException,Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import current_user
from app.models import Job,JobStatus,User
from app.schemas import JobIn,JobPatch,JobOut,Paginated
router=APIRouter(prefix="/jobs",tags=["Jobs"])
def get_job(i,db):
 o=db.get(Job,i)
 if not o:raise HTTPException(404,"Job not found")
 return o
@router.get("")
def list_jobs(status:JobStatus|None=None,search:str|None=None,page:int=Query(1,ge=1),page_size:int=Query(50,ge=1,le=100),db:Session=Depends(get_db),_:User=Depends(current_user)):
 q=db.query(Job)
 if status:q=q.filter(Job.status==status)
 if search:q=q.filter(Job.title.ilike(f"%{search}%"))
 return {"items":q.order_by(Job.created_at.desc()).offset((page-1)*page_size).limit(page_size).all(),"total":q.count(),"page":page,"page_size":page_size}
@router.post("",response_model=JobOut,status_code=201)
def create(data:JobIn,db:Session=Depends(get_db),_:User=Depends(current_user)):
 o=Job(**data.model_dump());db.add(o);db.commit();db.refresh(o);return o
@router.get("/{job_id}",response_model=JobOut)
def read(job_id:int,db:Session=Depends(get_db),_:User=Depends(current_user)):return get_job(job_id,db)
@router.patch("/{job_id}",response_model=JobOut)
def patch(job_id:int,data:JobPatch,db:Session=Depends(get_db),_:User=Depends(current_user)):
 o=get_job(job_id,db)
 for k,v in data.model_dump(exclude_unset=True).items():setattr(o,k,v)
 db.commit();db.refresh(o);return o
@router.patch("/{job_id}/close",response_model=JobOut)
def close(job_id:int,db:Session=Depends(get_db),_:User=Depends(current_user)):
 o=get_job(job_id,db);o.status=JobStatus.closed;db.commit();db.refresh(o);return o
