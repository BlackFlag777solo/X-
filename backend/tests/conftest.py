"""
Pytest configuration and shared fixtures for backend tests
"""
import pytest
import os

# Set the EXPO_PUBLIC_BACKEND_URL environment variable for tests
os.environ['EXPO_PUBLIC_BACKEND_URL'] = 'https://hacker-c2-lab.preview.emergentagent.com'

@pytest.fixture(scope="session")
def base_url():
    """Base URL for API tests"""
    return os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://hacker-c2-lab.preview.emergentagent.com').rstrip('/')
