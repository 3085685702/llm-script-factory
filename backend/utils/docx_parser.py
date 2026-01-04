"""
DocxParser - Extract text from .docx files
"""
from typing import Optional
import os

class DocxParser:
    """解析 .docx 文件为纯文本"""
    
    @staticmethod
    def extract_text(file_path: str) -> str:
        """
        从 .docx 文件提取纯文本
        
        Args:
            file_path: .docx 文件路径
            
        Returns:
            提取的纯文本内容
        """
        try:
            from docx import Document
            doc = Document(file_path)
            
            paragraphs = []
            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    paragraphs.append(text)
            
            return "\n".join(paragraphs)
        except ImportError:
            raise ImportError("python-docx is required. Install with: pip install python-docx")
        except Exception as e:
            raise ValueError(f"Failed to parse docx file: {e}")
    
    @staticmethod
    def extract_text_from_bytes(content: bytes) -> str:
        """
        从字节内容提取文本 (用于上传文件)
        
        Args:
            content: .docx 文件的字节内容
            
        Returns:
            提取的纯文本内容
        """
        import tempfile
        
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            text = DocxParser.extract_text(tmp_path)
            return text
        finally:
            os.unlink(tmp_path)
