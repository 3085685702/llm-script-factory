import datetime
from typing import Dict
from utils.debug_manager import DebugManager

class UsageService:
    """
    Service for calculating and retrieving System Usage Statistics.
    aggregates data from DebugManager logs.
    """
    
    def get_todays_usage(self) -> Dict:
        """
        Calculate total input/output tokens for the current day.
        
        Returns:
            Dict containing today's stats and the most recent request stats.
        """
        today_str = datetime.datetime.now().strftime("%Y-%m-%d")
        logs = DebugManager.get_daily_logs(today_str)
        
        today_input = 0
        today_output = 0
        last_req = None
        
        if logs:
            # logs[0] is the latest
            latest = logs[0]
            usage = latest.get("token_usage", {})
            last_req = {
                "input_tokens": usage.get("input", 0),
                "output_tokens": usage.get("output", 0),
                "cost_est_usd": 0.0 # Placeholder
            }
            
            for log in logs:
                u = log.get("token_usage", {})
                today_input += u.get("input", 0)
                today_output += u.get("output", 0)
                
        return {
            "today": {
                "input_tokens": int(today_input),
                "output_tokens": int(today_output),
                "cost_est_usd": 0.0
            },
            "last_request": last_req or {
                "input_tokens": 0,
                "output_tokens": 0,
                "cost_est_usd": 0.0
            }
        }
