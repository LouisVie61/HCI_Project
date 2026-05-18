import asyncio
import unittest

from services.translation import FreeTierRateLimiter, TranslationService


class StubTranslationService(TranslationService):
    def __init__(self, content="", error=None, rpm_limit=10, rpd_limit=900):
        self.content = content
        self.error = error
        self.calls = 0
        self.rate_limiter = FreeTierRateLimiter(rpm_limit, rpd_limit)

    async def _call_gemini(self, text: str) -> str:
        self.calls += 1
        if self.error:
            raise self.error
        return self.content


class TranslationServiceTest(unittest.IsolatedAsyncioTestCase):
    async def test_gemini_success_is_parsed_to_sequence(self):
        service = StubTranslationService(content="XIN, CHAO")

        result = await service.translate("xin chao")

        self.assertEqual(result, [{"gloss": "XIN"}, {"gloss": "CHAO"}])
        self.assertEqual(service.calls, 1)

    async def test_local_rate_limit_skips_gemini_and_uses_fallback(self):
        service = StubTranslationService(content="SHOULD, NOT, CALL", rpm_limit=0)

        result = await service.translate("xin chao")

        self.assertEqual(result, [{"gloss": "XIN"}, {"gloss": "CHAO"}])
        self.assertEqual(service.calls, 0)

    async def test_timeout_uses_fallback(self):
        service = StubTranslationService(error=asyncio.TimeoutError())

        result = await service.translate("xin chao, ban")

        self.assertEqual(
            result,
            [{"gloss": "XIN"}, {"gloss": "CHAO"}, {"gloss": "BAN"}],
        )
        self.assertEqual(service.calls, 1)

    async def test_empty_input_returns_empty_sequence(self):
        service = StubTranslationService(content="XIN")

        result = await service.translate("   ")

        self.assertEqual(result, [])
        self.assertEqual(service.calls, 0)


if __name__ == "__main__":
    unittest.main()
