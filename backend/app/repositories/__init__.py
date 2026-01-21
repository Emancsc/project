from typing import Optional
from pymongo.collection import Collection

class RequestsRepository:
    def __init__(self, collection: Collection, logs_collection: Optional[Collection] = None):
        self.collection = collection
        self.logs_collection = logs_collection
