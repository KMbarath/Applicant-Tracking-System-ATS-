from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, HttpUrl, ConfigDict
from app.models import Stage, JobStatus
class ORM(BaseModel): model_config=ConfigDict(from_attributes=True)
class UserRegister(BaseModel): name:str=Field(min_length=2,max_length=120); email:EmailStr; password:str=Field(min_length=8,max_length=128)
class UserOut(ORM): id:int; name:str; email:EmailStr; created_at:datetime
class Login(BaseModel): email:EmailStr; password:str
class Token(BaseModel): access_token:str; token_type:str="bearer"; user:UserOut
class CandidateIn(BaseModel): full_name:str=Field(min_length=2,max_length=160); email:EmailStr; phone:str=Field(min_length=7,max_length=30); skills:str=""; years_experience:int=Field(default=0,ge=0,le=80); current_title:str|None=None; resume_url:HttpUrl|None=None
class CandidatePatch(BaseModel): full_name:str|None=Field(default=None,min_length=2,max_length=160); email:EmailStr|None=None; phone:str|None=Field(default=None,min_length=7,max_length=30); skills:str|None=None; years_experience:int|None=Field(default=None,ge=0,le=80); current_title:str|None=None; resume_url:HttpUrl|None=None
class CandidateOut(ORM): id:int; full_name:str; email:EmailStr; phone:str; skills:str; years_experience:int; current_title:str|None; resume_url:str|None; created_at:datetime; updated_at:datetime
class JobIn(BaseModel): title:str=Field(min_length=2,max_length=160); department:str=Field(min_length=2,max_length=120); description:str=Field(min_length=5); required_skills:str=""; location:str=Field(min_length=2,max_length=120); employment_type:str=Field(min_length=2,max_length=80)
class JobPatch(JobIn): status:JobStatus|None=None
class JobOut(ORM): id:int; title:str; department:str; description:str; required_skills:str; location:str; employment_type:str; status:JobStatus; created_at:datetime; updated_at:datetime
class ApplicationIn(BaseModel): candidate_id:int; job_id:int; assigned_recruiter_id:int|None=None
class ApplicationOut(ORM): id:int; candidate_id:int; job_id:int; stage:Stage; assigned_recruiter_id:int|None; applied_at:datetime; updated_at:datetime; rejection_reason:str|None; offer_information:str|None; candidate:CandidateOut|None=None; job:JobOut|None=None
class StageUpdate(BaseModel): stage:Stage; rejection_reason:str|None=None; offer_information:str|None=None
class HistoryOut(ORM): id:int; application_id:int; previous_stage:Stage|None; new_stage:Stage; changed_by_id:int; changed_at:datetime
class NoteIn(BaseModel): body:str=Field(min_length=1,max_length=5000)
class NoteOut(ORM): id:int; candidate_id:int; recruiter_id:int; body:str; created_at:datetime
class Paginated(BaseModel): items:list; total:int; page:int; page_size:int
