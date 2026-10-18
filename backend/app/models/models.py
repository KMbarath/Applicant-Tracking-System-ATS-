import enum
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def now(): return datetime.now(timezone.utc)
class Stage(str, enum.Enum):
    applied="Applied"; screening="Screening"; interview="Interview"; offer="Offer"; hired="Hired"; rejected="Rejected"
class JobStatus(str, enum.Enum): open="open"; closed="closed"
class User(Base):
    __tablename__="users"
    id: Mapped[int]=mapped_column(primary_key=True); name: Mapped[str]=mapped_column(String(120)); email: Mapped[str]=mapped_column(String(255), unique=True, index=True); password_hash: Mapped[str]=mapped_column(String(255)); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)
class Candidate(Base):
    __tablename__="candidates"
    id: Mapped[int]=mapped_column(primary_key=True); full_name: Mapped[str]=mapped_column(String(160), index=True); email: Mapped[str]=mapped_column(String(255), unique=True, index=True); phone: Mapped[str]=mapped_column(String(30)); skills: Mapped[str]=mapped_column(Text, default=""); years_experience: Mapped[int]=mapped_column(Integer, default=0, index=True); current_title: Mapped[str|None]=mapped_column(String(160)); resume_url: Mapped[str|None]=mapped_column(String(1000)); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now); updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    applications: Mapped[list["Application"]]=relationship(back_populates="candidate", cascade="all, delete-orphan"); notes: Mapped[list["RecruiterNote"]]=relationship(back_populates="candidate", cascade="all, delete-orphan")
class Job(Base):
    __tablename__="jobs"
    id: Mapped[int]=mapped_column(primary_key=True); title: Mapped[str]=mapped_column(String(160), index=True); department: Mapped[str]=mapped_column(String(120)); description: Mapped[str]=mapped_column(Text); required_skills: Mapped[str]=mapped_column(Text, default=""); location: Mapped[str]=mapped_column(String(120)); employment_type: Mapped[str]=mapped_column(String(80)); status: Mapped[JobStatus]=mapped_column(Enum(JobStatus), default=JobStatus.open, index=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now); updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    applications: Mapped[list["Application"]]=relationship(back_populates="job")
class Application(Base):
    __tablename__="applications"; __table_args__=(UniqueConstraint("candidate_id","job_id",name="uq_candidate_job"), Index("ix_application_stage_date","stage","applied_at"))
    id: Mapped[int]=mapped_column(primary_key=True); candidate_id: Mapped[int]=mapped_column(ForeignKey("candidates.id")); job_id: Mapped[int]=mapped_column(ForeignKey("jobs.id")); stage: Mapped[Stage]=mapped_column(Enum(Stage), default=Stage.applied); assigned_recruiter_id: Mapped[int|None]=mapped_column(ForeignKey("users.id")); applied_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now); updated_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now, onupdate=now); rejection_reason: Mapped[str|None]=mapped_column(Text); offer_information: Mapped[str|None]=mapped_column(Text)
    candidate: Mapped[Candidate]=relationship(back_populates="applications"); job: Mapped[Job]=relationship(back_populates="applications"); history: Mapped[list["ApplicationStageHistory"]]=relationship(back_populates="application", cascade="all, delete-orphan"); assigned_recruiter: Mapped[User|None]=relationship()
class ApplicationStageHistory(Base):
    __tablename__="application_stage_history"
    id: Mapped[int]=mapped_column(primary_key=True); application_id: Mapped[int]=mapped_column(ForeignKey("applications.id"), index=True); previous_stage: Mapped[Stage|None]=mapped_column(Enum(Stage), nullable=True); new_stage: Mapped[Stage]=mapped_column(Enum(Stage)); changed_by_id: Mapped[int]=mapped_column(ForeignKey("users.id")); changed_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)
    application: Mapped[Application]=relationship(back_populates="history"); changed_by: Mapped[User]=relationship()
class RecruiterNote(Base):
    __tablename__="recruiter_notes"
    id: Mapped[int]=mapped_column(primary_key=True); candidate_id: Mapped[int]=mapped_column(ForeignKey("candidates.id"), index=True); recruiter_id: Mapped[int]=mapped_column(ForeignKey("users.id")); body: Mapped[str]=mapped_column(Text); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True), default=now)
    candidate: Mapped[Candidate]=relationship(back_populates="notes"); recruiter: Mapped[User]=relationship()
