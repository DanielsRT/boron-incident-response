from pydantic import BaseModel

class QueryRequest(BaseModel):
    kql: str
