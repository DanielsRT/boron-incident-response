import pytest
import time
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import redis
import httpx
import ssl
import socket

from app.log.service import (
    token_expired, get_access_token, get_last_fetch_time, 
    save_last_fetch_time, fetch_all_security_logs, 
    flatten_response, send_azure_logs_to_logstash,
    _token_cache, REDIS_KEY, QUERY_TEMPLATE
)


class TestTokenManagement:
    """Test token caching and expiration functionality."""
    
    def setup_method(self):
        """Reset token cache before each test."""
        _token_cache["access_token"] = None
        _token_cache["expires_at"] = 0
    
    def test_token_expired_when_missing(self):
        """Test token is considered expired when missing."""
        _token_cache["access_token"] = None
        _token_cache["expires_at"] = 0
        
        assert token_expired() is True
    
    def test_token_expired_when_past_expiry(self):
        """Test token is considered expired when past expiry time."""
        _token_cache["access_token"] = "test-token"
        _token_cache["expires_at"] = time.time() - 100  # 100 seconds ago
        
        assert token_expired() is True
    
    def test_token_not_expired_when_valid(self):
        """Test token is not expired when still valid."""
        _token_cache["access_token"] = "test-token"
        _token_cache["expires_at"] = time.time() + 1000  # 1000 seconds from now
        
        assert token_expired() is False
    
    @patch('app.log.service.ClientSecretCredential')
    def test_get_access_token_fetches_new_when_expired(self, mock_credential_class):
        """Test getting new token when expired."""
        # Setup mock credential and token
        mock_credential = Mock()
        mock_credential_class.return_value = mock_credential
        
        mock_token = Mock()
        mock_token.token = "new-access-token"
        mock_token.expires_on = time.time() + 3600  # 1 hour from now
        mock_credential.get_token.return_value = mock_token
        
        # Ensure token is expired
        _token_cache["expires_at"] = 0
        
        token = get_access_token()
        
        assert token == "new-access-token"
        assert _token_cache["access_token"] == "new-access-token"
        assert _token_cache["expires_at"] == mock_token.expires_on - 60
        
        # Verify credential was created with correct settings
        mock_credential_class.assert_called_once()
        mock_credential.get_token.assert_called_once_with("https://api.loganalytics.io/.default")
    
    def test_get_access_token_returns_cached_when_valid(self):
        """Test returning cached token when still valid."""
        # Setup valid cached token
        cached_token = "cached-access-token"
        _token_cache["access_token"] = cached_token
        _token_cache["expires_at"] = time.time() + 1000
        
        with patch('app.log.service.ClientSecretCredential') as mock_credential_class:
            token = get_access_token()
            
            assert token == cached_token
            # Should not have created new credential
            mock_credential_class.assert_not_called()


class TestRedisOperations:
    """Test Redis operations for last fetch time management."""
    
    @patch('app.log.service.redis_client')
    def test_get_last_fetch_time_with_stored_value(self, mock_redis):
        """Test getting last fetch time when value exists in Redis."""
        stored_time = datetime.now(timezone.utc) - timedelta(hours=2)
        mock_redis.get.return_value = stored_time.isoformat()
        
        result = get_last_fetch_time()
        
        assert result == stored_time
        mock_redis.get.assert_called_once_with(REDIS_KEY)
    
    @patch('app.log.service.redis_client')
    def test_get_last_fetch_time_with_no_stored_value(self, mock_redis):
        """Test getting last fetch time when no value in Redis."""
        mock_redis.get.return_value = None
        
        with patch('app.log.service.datetime') as mock_dt:
            mock_now = datetime.now(timezone.utc)
            mock_dt.now.return_value = mock_now
            mock_dt.timezone = timezone
            
            result = get_last_fetch_time()
            
            expected = mock_now - timedelta(hours=1)
            mock_redis.get.assert_called_once_with(REDIS_KEY)
    
    @patch('app.log.service.redis_client')
    def test_save_last_fetch_time(self, mock_redis):
        """Test saving last fetch time to Redis."""
        test_time = datetime.now(timezone.utc)
        
        save_last_fetch_time(test_time)
        
        mock_redis.set.assert_called_once_with(REDIS_KEY, test_time.isoformat())


class TestAzureLogFetching:
    """Test Azure Log Analytics integration."""
    
    @patch('app.log.service.get_access_token')
    @patch('app.log.service.get_last_fetch_time')
    @patch('app.log.service.httpx.post')
    @patch('app.log.service.flatten_response')
    def test_fetch_all_security_logs_success(self, mock_flatten, mock_post, mock_get_last_time, mock_get_token):
        """Test successful fetching of security logs."""
        # Setup mocks
        mock_get_token.return_value = "test-token"
        last_time = datetime.now(timezone.utc) - timedelta(hours=1)
        mock_get_last_time.return_value = last_time
        
        mock_response = Mock()
        mock_response.json.return_value = {"tables": []}
        mock_post.return_value = mock_response
        
        mock_flatten.return_value = [{"event": "test"}]
        
        result = fetch_all_security_logs()
        
        # Verify API call
        expected_url = f"https://api.loganalytics.io/v1/workspaces/LOCALHOST/query"
        expected_headers = {
            "Authorization": "Bearer test-token",
            "Content-Type": "application/json"
        }
        expected_body = {"query": QUERY_TEMPLATE.format(last_time.isoformat())}
        
        mock_post.assert_called_once_with(
            expected_url, 
            headers=expected_headers, 
            json=expected_body, 
            timeout=60
        )
        mock_response.raise_for_status.assert_called_once()
        mock_flatten.assert_called_once_with({"tables": []})
        assert result == [{"event": "test"}]
    
    @patch('app.log.service.get_access_token')
    @patch('app.log.service.get_last_fetch_time')
    @patch('app.log.service.httpx.post')
    def test_fetch_all_security_logs_http_error(self, mock_post, mock_get_last_time, mock_get_token):
        """Test handling HTTP errors when fetching logs."""
        mock_get_token.return_value = "test-token"
        mock_get_last_time.return_value = datetime.now(timezone.utc)
        
        mock_post.side_effect = httpx.HTTPError("Connection failed")
        
        with pytest.raises(httpx.HTTPError, match="Connection failed"):
            fetch_all_security_logs()
    
    @patch('app.log.service.get_access_token')
    @patch('app.log.service.get_last_fetch_time')
    @patch('app.log.service.httpx.post')
    def test_fetch_all_security_logs_response_error(self, mock_post, mock_get_last_time, mock_get_token):
        """Test handling response errors when fetching logs."""
        mock_get_token.return_value = "test-token"
        mock_get_last_time.return_value = datetime.now(timezone.utc)
        
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Bad request", request=Mock(), response=Mock()
        )
        mock_post.return_value = mock_response
        
        with pytest.raises(httpx.HTTPStatusError):
            fetch_all_security_logs()


class TestResponseFlattening:
    """Test response flattening functionality."""
    
    def test_flatten_response_single_table(self):
        """Test flattening response with single table."""
        response = {
            "tables": [
                {
                    "name": "SecurityEvent",
                    "columns": [
                        {"name": "TimeGenerated", "type": "datetime"},
                        {"name": "Account", "type": "string"},
                        {"name": "Computer", "type": "string"}
                    ],
                    "rows": [
                        ["2025-09-03T10:00:00Z", "admin", "SERVER01"],
                        ["2025-09-03T10:01:00Z", "user", "WORKSTATION02"]
                    ]
                }
            ]
        }
        
        result = flatten_response(response)
        
        expected = [
            {
                "TimeGenerated": "2025-09-03T10:00:00Z",
                "Account": "admin",
                "Computer": "SERVER01",
                "_table": "SecurityEvent"
            },
            {
                "TimeGenerated": "2025-09-03T10:01:00Z",
                "Account": "user",
                "Computer": "WORKSTATION02",
                "_table": "SecurityEvent"
            }
        ]
        
        assert result == expected
    
    def test_flatten_response_multiple_tables(self):
        """Test flattening response with multiple tables."""
        response = {
            "tables": [
                {
                    "name": "SecurityEvent",
                    "columns": [{"name": "EventID", "type": "int"}],
                    "rows": [[4625]]
                },
                {
                    "name": "SigninLogs", 
                    "columns": [{"name": "UserPrincipalName", "type": "string"}],
                    "rows": [["user@example.com"]]
                }
            ]
        }
        
        result = flatten_response(response)
        
        expected = [
            {"EventID": 4625, "_table": "SecurityEvent"},
            {"UserPrincipalName": "user@example.com", "_table": "SigninLogs"}
        ]
        
        assert result == expected
    
    def test_flatten_response_empty_tables(self):
        """Test flattening response with empty tables."""
        response = {"tables": []}
        
        result = flatten_response(response)
        
        assert result == []
    
    def test_flatten_response_table_without_name(self):
        """Test flattening table without name."""
        response = {
            "tables": [
                {
                    "columns": [{"name": "Field", "type": "string"}],
                    "rows": [["value"]]
                }
            ]
        }
        
        result = flatten_response(response)
        
        assert result == [{"Field": "value", "_table": "unknown"}]


class TestLogstashIntegration:
    """Test Logstash integration functionality."""
    
    @patch('app.log.service.ssl.create_default_context')
    @patch('app.log.service.socket.create_connection')
    def test_send_azure_logs_to_logstash_success(self, mock_create_connection, mock_ssl_context):
        """Test successful sending of logs to Logstash."""
        # Setup mocks
        mock_sock = Mock()
        mock_ssl_sock = Mock()
        mock_context = Mock()
        
        mock_create_connection.return_value.__enter__ = Mock(return_value=mock_sock)
        mock_create_connection.return_value.__exit__ = Mock(return_value=None)
        
        mock_context.wrap_socket.return_value.__enter__ = Mock(return_value=mock_ssl_sock)
        mock_context.wrap_socket.return_value.__exit__ = Mock(return_value=None)
        
        mock_ssl_context.return_value = mock_context
        
        logs = [
            {"TimeGenerated": "2025-09-03T10:00:00Z", "Account": "admin"},
            {"TimeGenerated": "2025-09-03T10:01:00Z", "Account": "user"}
        ]
        
        send_azure_logs_to_logstash(logs)
        
        # Verify SSL context creation
        mock_ssl_context.assert_called_once_with(
            ssl.Purpose.SERVER_AUTH, 
            cafile="/app/certs/ca.crt"
        )
        
        # Verify SSL settings
        assert mock_context.check_hostname is True
        assert mock_context.verify_mode == ssl.CERT_REQUIRED
        
        # Verify connection
        mock_create_connection.assert_called_once_with(("logstash", 5000))
        mock_context.wrap_socket.assert_called_once_with(mock_sock, server_hostname="logstash")
        
        # Verify data sending
        expected_calls = [
            unittest.mock.call((json.dumps(logs[0], default=str) + "\n").encode("utf-8")),
            unittest.mock.call((json.dumps(logs[1], default=str) + "\n").encode("utf-8"))
        ]
        assert mock_ssl_sock.sendall.call_count == 2
    
    @patch('app.log.service.ssl.create_default_context')
    @patch('app.log.service.socket.create_connection')
    def test_send_azure_logs_to_logstash_empty_logs(self, mock_create_connection, mock_ssl_context):
        """Test sending empty logs list to Logstash."""
        mock_sock = Mock()
        mock_ssl_sock = Mock() 
        mock_context = Mock()
        
        mock_create_connection.return_value.__enter__ = Mock(return_value=mock_sock)
        mock_create_connection.return_value.__exit__ = Mock(return_value=None)
        
        mock_context.wrap_socket.return_value.__enter__ = Mock(return_value=mock_ssl_sock)
        mock_context.wrap_socket.return_value.__exit__ = Mock(return_value=None)
        
        mock_ssl_context.return_value = mock_context
        
        send_azure_logs_to_logstash([])
        
        # Should still create connection but not send any data
        mock_create_connection.assert_called_once()
        mock_ssl_sock.sendall.assert_not_called()


class TestConstants:
    """Test module constants and configuration."""
    
    def test_redis_key_constant(self):
        """Test Redis key constant is correct."""
        assert REDIS_KEY == "azure:last_fetch_time"
    
    def test_query_template_constant(self):
        """Test query template constant is correct."""
        expected = "SecurityEvent | where TimeGenerated > datetime('{}')"
        assert QUERY_TEMPLATE == expected


# Add missing import for unittest.mock
import unittest.mock
