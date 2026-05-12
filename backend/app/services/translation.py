from langchain_google_genai import ChatGoogleGenerativeAI
from prompts.translation import translation_prompt
from core.config import settings


class TranslationService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-3.1-flash-lite", 
            temperature=0,
            google_api_key=settings.GOOGLE_API_KEY
        )
        
        # LCEL Pipeline: Prompt -> LLM
        self.chain = translation_prompt | self.llm

    async def translate(self, text: str) -> list[dict]:
        response = await self.chain.ainvoke({"text": text})        
        content = response.content.strip() if response.content else ""
        
        if not content:
            return []
        glosses = [
            word.strip() 
            for word in content.split(",") 
            if word.strip()
        ]
        
        sequence = [{"gloss": gloss} for gloss in glosses]
        return sequence

_translation_service_instance = TranslationService()
def get_translation_service() -> TranslationService:
    return _translation_service_instance
