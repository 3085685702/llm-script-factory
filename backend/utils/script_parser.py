"""
ScriptParser - Parse raw script text into structured episode data
"""
import re
from typing import List, Dict, Any, Tuple, Optional


class ScriptParser:
    """解析原始剧本文本为结构化数据"""
    
    # 中文数字映射
    CN_NUM_MAP = {
        '零': 0, '〇': 0,
        '一': 1, '壹': 1,
        '二': 2, '贰': 2, '两': 2,
        '三': 3, '叁': 3,
        '四': 4, '肆': 4,
        '五': 5, '伍': 5,
        '六': 6, '陆': 6,
        '七': 7, '柒': 7,
        '八': 8, '捌': 8,
        '九': 9, '玖': 9,
        '十': 10, '拾': 10,
        '百': 100, '佰': 100,
    }
    
    @staticmethod
    def chinese_to_arabic(cn_str: str) -> int:
        """
        中文数字转阿拉伯数字
        支持: 一~一百二十
        """
        cn_str = cn_str.strip()
        if not cn_str:
            return 0
            
        # 如果已经是数字
        if cn_str.isdigit():
            return int(cn_str)
        
        result = 0
        temp = 0
        
        for char in cn_str:
            if char in ScriptParser.CN_NUM_MAP:
                num = ScriptParser.CN_NUM_MAP[char]
                if num == 10:
                    if temp == 0:
                        temp = 1
                    result += temp * 10
                    temp = 0
                elif num == 100:
                    if temp == 0:
                        temp = 1
                    result += temp * 100
                    temp = 0
                else:
                    temp = num
        
        result += temp
        return result
    
    @classmethod
    def parse_raw_text(cls, text: str) -> Dict[str, Any]:
        """
        解析原始剧本文本
        
        Args:
            text: 原始剧本文本
            
        Returns:
            {
                "header_content": "第1集之前的内容",
                "episodes": [
                    {"ep_id": 1, "raw_content": "...", "scenes": [...]},
                    ...
                ]
            }
        """
        # 匹配模式: 第X集 (支持中文和阿拉伯数字)
        # 例如: 第1集, 第一集, 第十二集, 第一百二十集
        ep_pattern = r'第\s*([一二三四五六七八九十百零〇壹贰叁肆伍陆柒捌玖拾佰两\d]+)\s*集'
        
        matches = list(re.finditer(ep_pattern, text))
        
        if not matches:
            # 没有找到分集标记，作为单集处理
            return {
                "header_content": "",
                "episodes": [{
                    "ep_id": 1,
                    "raw_content": text.strip(),
                    "scenes": cls.parse_scenes(text.strip(), 1)
                }]
            }
        
        # 提取第一集之前的内容 (header)
        header_content = text[:matches[0].start()].strip()
        
        # 解析每一集
        episodes = []
        for i, match in enumerate(matches):
            # 提取集数
            ep_num_str = match.group(1)
            ep_id = cls.chinese_to_arabic(ep_num_str)
            
            # 提取该集内容 (到下一集开始或文本结束)
            start = match.end()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
            raw_content = text[start:end].strip()
            
            # 解析场次
            scenes = cls.parse_scenes(raw_content, ep_id)
            
            episodes.append({
                "ep_id": ep_id,
                "raw_content": raw_content,
                "scenes": scenes
            })
        
        return {
            "header_content": header_content,
            "episodes": episodes
        }
    
    @classmethod
    def parse_scenes(cls, ep_content: str, ep_id: int) -> List[Dict[str, Any]]:
        """
        解析单集内容为场次列表
        
        格式识别:
        - 场号: 1-1, 1-2, 2-1 或 纯数字 1, 2, 3
        - 时间: 日/内, 夜/外, 早/内 等
        - 场景: 场景：xxx 或 地点：xxx
        - 人物: 人物：xxx 或 角色：xxx
        - 正文: 其他内容
        """
        scenes = []
        
        # 尝试匹配场号模式: X-Y 或 纯数字开头的行
        scene_pattern = r'(?:^|\n)\s*((\d+)-(\d+)|(\d+))\s*(.*)(?:\n|$)'
        scene_matches = list(re.finditer(scene_pattern, ep_content))
        
        if not scene_matches:
            # 没有找到场次标记，整体作为一个场次
            return [{
                "scene_id": f"{ep_id}-1",
                "time": "",
                "location": "",
                "characters": "",
                "content": ep_content.strip()
            }]
        
        for i, match in enumerate(scene_matches):
            # 确定场号
            if match.group(2):  # X-Y 格式
                scene_id = f"{match.group(2)}-{match.group(3)}"
            else:  # 纯数字
                scene_id = f"{ep_id}-{match.group(4)}"
            
            # 头部额外信息 (可能包含时间)
            header_extra = match.group(5).strip() if match.group(5) else ""
            
            # 提取该场次内容
            start = match.end()
            end = scene_matches[i + 1].start() if i + 1 < len(scene_matches) else len(ep_content)
            scene_block = ep_content[start:end].strip()
            
            # 解析场景头部信息
            time_str = ""
            location = ""
            characters = ""
            body_lines = []
            
            # 从 header_extra 提取时间
            if header_extra:
                # 检查是否是时间格式: 日/内, 夜/外 等
                time_pattern = r'[早晚日夜午]/[内外]'
                if re.search(time_pattern, header_extra):
                    time_str = header_extra
                else:
                    time_str = header_extra
            
            # 解析正文行
            for line in scene_block.split('\n'):
                s_line = line.strip()
                if not s_line:
                    continue
                
                # 检查时间格式
                if not time_str and re.match(r'^[早晚日夜午]/.+', s_line):
                    time_str = s_line
                elif s_line.startswith("场景") or s_line.startswith("地点"):
                    location = re.sub(r'^(场景|地点)[：:]\s*', '', s_line)
                elif s_line.startswith("人物") or s_line.startswith("角色"):
                    characters = re.sub(r'^(人物|角色)[：:]\s*', '', s_line)
                else:
                    body_lines.append(line)
            
            scenes.append({
                "scene_id": scene_id,
                "time": time_str,
                "location": location,
                "characters": characters,
                "content": "\n".join(body_lines).strip()
            })
        
        return scenes
    
    @classmethod
    def format_episodes_for_save(cls, episodes: List[Dict]) -> List[Dict]:
        """
        格式化剧集数据用于保存
        移除 raw_content，只保留结构化数据
        """
        return [
            {
                "ep_id": ep["ep_id"],
                "scenes": ep.get("scenes", [])
            }
            for ep in episodes
        ]
