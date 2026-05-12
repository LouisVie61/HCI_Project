from langchain_core.prompts import PromptTemplate

# Prompt cho phân tích ngữ nghĩa và tái cấu trúc cú pháp
TRANSLATION_PROMPT_TEMPLATE = """Bạn là chuyên gia dịch từ ngôn ngữ tự nhiên sang ngôn ngữ ký hiệu.

Quy trình xử lý:
1. Phân tích ngữ nghĩa: Hiểu ý nghĩa sâu của câu
2. Tái cấu trúc cú pháp: Chuyển thành dạng các từ gốc (glosses)
3. Trả về danh sách: Chỉ viết hoa các từ gốc, ngăn cách bằng dấu phẩy

Đầu vào: {text}
Đầu ra (chỉ danh sách glosses viết hoa, không giải thích):"""

translation_prompt = PromptTemplate(
    template=TRANSLATION_PROMPT_TEMPLATE, 
    input_variables=["text"]
)
