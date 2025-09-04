# Test configuration to avoid Elasticsearch connection issues during testing
import os
import sys
from unittest.mock import Mock

# Set test environment variables to avoid SSL connection issues
os.environ["ELASTICSEARCH_HOST"] = "https://localhost:9200"
os.environ["ELASTIC_USERNAME"] = "test_user"
os.environ["ELASTIC_PASSWORD"] = "test_password"
os.environ["APP_CERT_PATH"] = "/tmp/test_ca.crt"

# Mock Elasticsearch import to prevent actual connection attempts
class MockElasticsearch:
    def __init__(self, *args, **kwargs):
        self.connected = False
    
    def ping(self):
        return False
    
    def search(self, *args, **kwargs):
        return {"hits": {"hits": []}}
    
    def index(self, *args, **kwargs):
        return {"_id": "test_id", "result": "created"}
    
    def update(self, *args, **kwargs):
        return {"_id": "test_id", "result": "updated"}

# Store original elasticsearch module
_original_elasticsearch = None

def mock_elasticsearch_import():
    """Mock the elasticsearch module to prevent connection attempts"""
    global _original_elasticsearch
    
    if 'elasticsearch' in sys.modules:
        _original_elasticsearch = sys.modules['elasticsearch']
    
    # Create mock module
    mock_module = Mock()
    mock_module.Elasticsearch = MockElasticsearch
    sys.modules['elasticsearch'] = mock_module

def restore_elasticsearch_import():
    """Restore the original elasticsearch module"""
    global _original_elasticsearch
    
    if _original_elasticsearch:
        sys.modules['elasticsearch'] = _original_elasticsearch
    elif 'elasticsearch' in sys.modules:
        del sys.modules['elasticsearch']

# Auto-mock when this module is imported
mock_elasticsearch_import()
