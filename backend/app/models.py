from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base
import json


class CallRecord(Base):
    __tablename__ = "call_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(120), index=True, nullable=False)  # Clerk user ID
    scenario = Column(String(100), index=True)
    source_language = Column(String(80), default="English")
    target_language = Column(String(80), default="Chinese (中文)")

    transcript = Column(Text)
    summary = Column(Text)
    translation = Column(Text)
    replies_json = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    def get_replies_list(self):
        return json.loads(self.replies_json) if self.replies_json else []