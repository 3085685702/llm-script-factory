"""
Logging Configuration Module.
Provides custom formatters for uvicorn access logs.
"""
import logging
from urllib.parse import unquote


class ChineseAccessFormatter(logging.Formatter):
    """Custom formatter that decodes URL-encoded Chinese characters in log messages."""
    
    def format(self, record):
        # Uvicorn access log 使用 % 格式化，URL 路径在 record.args 中而非 record.msg
        if hasattr(record, 'args') and record.args:
            decoded_args = tuple(
                unquote(arg) if isinstance(arg, str) else arg
                for arg in record.args
            )
            record.args = decoded_args
        return super().format(record)


def setup_chinese_logging():
    """Configure uvicorn access logger to display Chinese URLs correctly."""
    uvicorn_access = logging.getLogger("uvicorn.access")
    handler = logging.StreamHandler()
    handler.setFormatter(ChineseAccessFormatter('%(levelname)s:     %(message)s'))
    uvicorn_access.handlers = [handler]
