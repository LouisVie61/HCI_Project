"""
Logging Configuration for API
"""
import logging
import logging.handlers
from pathlib import Path

# Tạo thư mục logs
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)


def setup_logging():
    """Cấu hình logging cho toàn bộ ứng dụng"""
    
    # ROOT LOGGER
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    # File handler
    file_handler = logging.handlers.RotatingFileHandler(
        LOG_DIR / "app.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # ===== API LOGGER (Cấu hình riêng) =====
    api_logger = logging.getLogger("api")
    api_logger.setLevel(logging.DEBUG)
    
    # Console handler cho API
    api_console_handler = logging.StreamHandler()
    api_console_handler.setLevel(logging.INFO)
    api_console_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(message)s',
            datefmt=DATE_FORMAT
        )
    )
    
    # File handler cho API
    api_file_handler = logging.handlers.RotatingFileHandler(
        LOG_DIR / "api.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )
    api_file_handler.setLevel(logging.DEBUG)
    api_file_handler.setFormatter(formatter)
    
    api_logger.addHandler(api_console_handler)
    api_logger.addHandler(api_file_handler)
    
    # Tắt verbose logging từ các thư viện khác
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("langchain").setLevel(logging.INFO)
    
    return api_logger