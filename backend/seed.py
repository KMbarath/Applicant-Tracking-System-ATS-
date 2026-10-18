from app.db.session import Base,engine,SessionLocal
from app.models import User,Candidate,Job,Application,ApplicationStageHistory,Stage
from app.core.security import hash_password
Base.metadata.create_all(engine);db=SessionLocal()
try:
 user=db.query(User).filter_by(email="demo@miniats-demo.com").first()
 if not user:user=User(name="Demo Recruiter",email="demo@miniats-demo.com",password_hash=hash_password("DemoPass123!"));db.add(user);db.flush()
 jobs=[("Frontend Engineer","Engineering","React, JavaScript and CSS experience.","React, JavaScript, CSS","Bengaluru","Full-time"),("Backend Engineer","Engineering","Build reliable API services.","Python, FastAPI, SQL","Remote","Full-time"),("Product Designer","Design","Shape simple candidate experiences.","Figma, UX research","Mumbai","Contract")]
 job_objs=[]
 for data in jobs:
  obj=db.query(Job).filter_by(title=data[0]).first()
  if not obj:obj=Job(title=data[0],department=data[1],description=data[2],required_skills=data[3],location=data[4],employment_type=data[5]);db.add(obj);db.flush()
  job_objs.append(obj)
 people=[("Aarav Mehta","aarav.mehta@example.com","+919000000001","React, TypeScript, CSS",3,"Frontend Developer"),("Diya Nair","diya.nair@example.com","+919000000002","Python, FastAPI, SQL",5,"Backend Developer"),("Kabir Shah","kabir.shah@example.com","+919000000003","Figma, UX Research",4,"Product Designer"),("Meera Iyer","meera.iyer@example.com","+919000000004","JavaScript, React",2,"Software Engineer"),("Rohan Das","rohan.das@example.com","+919000000005","Python, Docker",6,"Platform Engineer"),("Sara Khan","sara.khan@example.com","+919000000006","UX, Prototyping",3,"Designer")]
 for i,p in enumerate(people):
  c=db.query(Candidate).filter_by(email=p[1]).first()
  if not c:c=Candidate(full_name=p[0],email=p[1],phone=p[2],skills=p[3],years_experience=p[4],current_title=p[5]);db.add(c);db.flush()
  a=db.query(Application).filter_by(candidate_id=c.id,job_id=job_objs[i%3].id).first()
  if not a:
   stage=list(Stage)[i];a=Application(candidate_id=c.id,job_id=job_objs[i%3].id,stage=stage,assigned_recruiter_id=user.id);db.add(a);db.flush();db.add(ApplicationStageHistory(application_id=a.id,previous_stage=None,new_stage=Stage.applied,changed_by_id=user.id))
   if stage!=Stage.applied:db.add(ApplicationStageHistory(application_id=a.id,previous_stage=Stage.applied,new_stage=stage,changed_by_id=user.id))
 db.commit();print("Seed complete. Demo login: demo@miniats-demo.com / DemoPass123!")
finally:db.close()
