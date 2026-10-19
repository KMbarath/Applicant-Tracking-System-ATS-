import os
os.environ["DATABASE_URL"]="sqlite:///./test_ats.db"
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import Base,engine
from app.models import User
from app.core.security import hash_password
Base.metadata.drop_all(engine);Base.metadata.create_all(engine)
client=TestClient(app)
def token():
 client.post('/api/v1/auth/register',json={'name':'Tester','email':'test-user@example.com','password':'SecurePass123!'})
 return {'Authorization':'Bearer '+client.post('/api/v1/auth/login',json={'email':'test-user@example.com','password':'SecurePass123!'}).json()['access_token']}
def test_protected_and_candidate_crud():
 assert client.get('/api/v1/candidates').status_code==401
 h=token();data={'full_name':'Test Candidate','email':'candidate@example.com','phone':'+919999999999','skills':'Python','years_experience':2}
 r=client.post('/api/v1/candidates',json=data,headers=h);assert r.status_code==201
 assert client.post('/api/v1/candidates',json=data,headers=h).status_code==409
 assert client.get('/api/v1/candidates',headers=h).json()['total']==1
def test_job_application_history():
 h=token();c=client.post('/api/v1/candidates',json={'full_name':'Another Candidate','email':'another@example.com','phone':'+918888888888'},headers=h).json();j=client.post('/api/v1/jobs',json={'title':'QA Engineer','department':'Engineering','description':'Test application quality','location':'Remote','employment_type':'Full-time'},headers=h).json();a=client.post('/api/v1/applications',json={'candidate_id':c['id'],'job_id':j['id']},headers=h).json()
 assert client.patch(f"/api/v1/applications/{a['id']}/stage",json={'stage':'Screening'},headers=h).status_code==200
 assert len(client.get(f"/api/v1/applications/{a['id']}/history",headers=h).json())==2
def test_filters_dashboard_and_terminal_transition():
 h=token(); c=client.post('/api/v1/candidates',json={'full_name':'Filter Person','email':'filter@example.com','phone':'+917777777777','skills':'React, Python','years_experience':7},headers=h).json(); j=client.post('/api/v1/jobs',json={'title':'Filter Engineer','department':'Engineering','description':'A sufficiently detailed filter role','required_skills':'Python','location':'Remote','employment_type':'Full-time'},headers=h).json(); a=client.post('/api/v1/applications',json={'candidate_id':c['id'],'job_id':j['id']},headers=h).json()
 assert client.get('/api/v1/candidates?skills=React&min_experience=6',headers=h).json()['total']>=1
 assert client.get('/api/v1/applications?candidate_search=Filter&job_title=Engineer',headers=h).json()['total']>=1
 assert client.patch(f"/api/v1/applications/{a['id']}/stage",json={'stage':'Hired'},headers=h).status_code==400
 assert client.patch(f"/api/v1/jobs/{j['id']}/close",headers=h).status_code==200
 assert client.get('/api/v1/dashboard/summary',headers=h).status_code==200
 trends=client.get('/api/v1/dashboard/application-trends',headers=h)
 assert trends.status_code==200
 assert trends.json()[0]['applications']>=1
