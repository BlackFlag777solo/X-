"""
Red Team CTF Module Tests - X=pi by Carbi
Tests for guided attack chain exercises (kill chain) with step-by-step progression, scoring, and leaderboard
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://hacker-c2-lab.preview.emergentagent.com').rstrip('/')


# ============================================================================
# CTF Exercises List Tests
# ============================================================================

class TestCTFExercises:
    """Test GET /api/ctf/exercises - List all available CTF exercises"""

    def test_list_exercises_returns_4_exercises(self):
        """Verify exercises endpoint returns exactly 4 exercises"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercises")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 4
        assert len(data["exercises"]) == 4

    def test_exercises_have_correct_difficulty_levels(self):
        """Verify exercises have BEGINNER, INTERMEDIATE, ADVANCED, EXPERT difficulties"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercises")
        assert response.status_code == 200
        data = response.json()
        
        difficulties = [ex["difficulty"] for ex in data["exercises"]]
        assert "BEGINNER" in difficulties
        assert "INTERMEDIATE" in difficulties
        assert "ADVANCED" in difficulties
        assert "EXPERT" in difficulties

    def test_exercises_have_required_fields(self):
        """Verify each exercise has all required fields"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercises")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "name", "description", "difficulty", "category", 
                          "estimated_time", "total_steps", "reward_points", "objectives"]
        for exercise in data["exercises"]:
            for field in required_fields:
                assert field in exercise, f"Missing field: {field} in exercise {exercise.get('id')}"

    def test_exercises_total_points_is_1550(self):
        """Verify total available points is 1550"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercises")
        assert response.status_code == 200
        data = response.json()
        assert data["total_points_available"] == 1550


# ============================================================================
# Exercise Detail Tests
# ============================================================================

class TestCTFExerciseDetail:
    """Test GET /api/ctf/exercise/{id} - Get full exercise details"""

    def test_ex001_operation_shadow_entry(self):
        """Verify EX-001 returns Operation Shadow Entry with 6 steps"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercise/EX-001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["exercise"]["id"] == "EX-001"
        assert data["exercise"]["name"] == "Operation Shadow Entry"
        assert data["exercise"]["difficulty"] == "BEGINNER"
        assert len(data["steps"]) == 6
        assert data["total_points"] == 100

    def test_ex002_operation_mobile_ghost(self):
        """Verify EX-002 returns Operation Mobile Ghost"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercise/EX-002")
        assert response.status_code == 200
        data = response.json()
        
        assert data["exercise"]["id"] == "EX-002"
        assert data["exercise"]["name"] == "Operation Mobile Ghost"
        assert data["exercise"]["difficulty"] == "INTERMEDIATE"
        assert len(data["steps"]) == 6

    def test_ex003_operation_domain_domination(self):
        """Verify EX-003 returns Operation Domain Domination"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercise/EX-003")
        assert response.status_code == 200
        data = response.json()
        
        assert data["exercise"]["id"] == "EX-003"
        assert data["exercise"]["name"] == "Operation Domain Domination"
        assert data["exercise"]["difficulty"] == "ADVANCED"
        assert len(data["steps"]) == 5

    def test_ex004_operation_ios_zero_day(self):
        """Verify EX-004 returns Operation iOS Zero-Day"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercise/EX-004")
        assert response.status_code == 200
        data = response.json()
        
        assert data["exercise"]["id"] == "EX-004"
        assert data["exercise"]["name"] == "Operation iOS Zero-Day"
        assert data["exercise"]["difficulty"] == "EXPERT"
        assert len(data["steps"]) == 5

    def test_invalid_exercise_returns_404(self):
        """Verify invalid exercise ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/ctf/exercise/INVALID")
        assert response.status_code == 404


# ============================================================================
# Start Exercise Tests
# ============================================================================

class TestCTFStart:
    """Test POST /api/ctf/start - Start a CTF exercise"""

    def test_start_ex001_with_default_operator(self):
        """Start EX-001 with default operator name 'Ghost'"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/start",
            json={"exercise_id": "EX-001"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "session_id" in data
        assert data["exercise"] == "Operation Shadow Entry"
        assert data["operator"] == "Ghost"  # Default operator
        assert data["total_steps"] == 6
        assert data["status"] == "in_progress"
        assert data["current_step"]["index"] == 0
        assert data["current_step"]["phase"] == "RECONNAISSANCE"

    def test_start_ex002_with_custom_operator(self):
        """Start EX-002 with custom operator name 'TestOp'"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/start",
            json={"exercise_id": "EX-002", "operator_name": "TestOp"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["operator"] == "TestOp"
        assert data["exercise"] == "Operation Mobile Ghost"

    def test_start_invalid_exercise_returns_404(self):
        """Verify starting invalid exercise returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/start",
            json={"exercise_id": "INVALID-ID"}
        )
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()


# ============================================================================
# Execute Step Tests
# ============================================================================

class TestCTFExecute:
    """Test POST /api/ctf/execute - Execute a step in an exercise"""

    def test_execute_first_step_ex001(self):
        """Execute first step of EX-001, returns output and points"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/execute",
            json={"exercise_id": "EX-001", "step_index": 0}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["step_index"] == 0
        assert data["phase"] == "RECONNAISSANCE"
        assert data["title"] == "Escaneo de Red"
        assert data["points_earned"] == 10
        assert data["status"] == "success"
        assert data["is_last_step"] == False
        assert "nmap" in data["output"].lower() or "PORT" in data["output"]
        assert "next_step" in data

    def test_execute_last_step_ex001_mission_complete(self):
        """Execute last step (step 5) of EX-001, returns mission_complete=true"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/execute",
            json={"exercise_id": "EX-001", "step_index": 5}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["is_last_step"] == True
        assert data["mission_complete"] == True
        assert data["final_score"] == 100
        assert data["max_score"] == 100
        assert data["grade"] == "S+"
        assert "MISSION COMPLETE" in data["completion_message"] or "MISION COMPLETA" in data["completion_message"]

    def test_execute_invalid_step_returns_400(self):
        """Execute invalid step index returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/execute",
            json={"exercise_id": "EX-001", "step_index": 99}
        )
        assert response.status_code == 400
        data = response.json()
        assert "invalid" in data["detail"].lower()

    def test_execute_negative_step_returns_400(self):
        """Execute negative step index returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/execute",
            json={"exercise_id": "EX-001", "step_index": -1}
        )
        assert response.status_code == 400

    def test_execute_invalid_exercise_returns_404(self):
        """Execute step on invalid exercise returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/ctf/execute",
            json={"exercise_id": "INVALID", "step_index": 0}
        )
        assert response.status_code == 404


# ============================================================================
# Leaderboard Tests
# ============================================================================

class TestCTFLeaderboard:
    """Test GET /api/ctf/leaderboard - Get CTF leaderboard"""

    def test_leaderboard_returns_7_operators(self):
        """Verify leaderboard returns exactly 7 operators"""
        response = requests.get(f"{BASE_URL}/api/ctf/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_operators"] == 7
        assert len(data["leaderboard"]) == 7

    def test_leaderboard_is_sorted_by_rank(self):
        """Verify leaderboard is sorted by rank"""
        response = requests.get(f"{BASE_URL}/api/ctf/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        for i, entry in enumerate(data["leaderboard"]):
            assert entry["rank"] == i + 1

    def test_leaderboard_has_required_fields(self):
        """Verify each leaderboard entry has required fields"""
        response = requests.get(f"{BASE_URL}/api/ctf/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["rank", "operator", "score", "exercises_completed", "fastest_time"]
        for entry in data["leaderboard"]:
            for field in required_fields:
                assert field in entry

    def test_top_operator_is_ghost_admin(self):
        """Verify top operator is Gh0st_Admin with score 1550"""
        response = requests.get(f"{BASE_URL}/api/ctf/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        top_operator = data["leaderboard"][0]
        assert top_operator["rank"] == 1
        assert top_operator["operator"] == "Gh0st_Admin"
        assert top_operator["score"] == 1550
        assert top_operator["exercises_completed"] == 4


# ============================================================================
# Full Exercise Flow Tests
# ============================================================================

class TestCTFFullFlow:
    """Test complete exercise flow: start -> execute all steps -> complete"""

    def test_full_exercise_flow_ex003(self):
        """Test full flow for EX-003 (Domain Domination - 5 steps)"""
        # Start exercise
        start_response = requests.post(
            f"{BASE_URL}/api/ctf/start",
            json={"exercise_id": "EX-003", "operator_name": "TestRunner"}
        )
        assert start_response.status_code == 200
        
        # Execute all 5 steps
        for step in range(5):
            exec_response = requests.post(
                f"{BASE_URL}/api/ctf/execute",
                json={"exercise_id": "EX-003", "step_index": step}
            )
            assert exec_response.status_code == 200
            data = exec_response.json()
            assert data["status"] == "success"
            
            if step == 4:  # Last step
                assert data["is_last_step"] == True
                assert data["mission_complete"] == True
            else:
                assert data["is_last_step"] == False
                assert "next_step" in data

    def test_step_phases_ex001(self):
        """Verify EX-001 has correct phase progression"""
        expected_phases = [
            "RECONNAISSANCE",
            "INITIAL ACCESS", 
            "PRIVILEGE ESCALATION",
            "PERSISTENCE",
            "LATERAL MOVEMENT",
            "EXFILTRATION"
        ]
        
        for i, expected_phase in enumerate(expected_phases):
            response = requests.post(
                f"{BASE_URL}/api/ctf/execute",
                json={"exercise_id": "EX-001", "step_index": i}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["phase"] == expected_phase


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
