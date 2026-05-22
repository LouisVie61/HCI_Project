TRANSLATION_PROMPT_TEMPLATE = """Convert the input sentence into sign-language gloss tokens.
Return only uppercase glosses separated by commas.
Do not explain.

Input: {text}
Glosses:"""


def build_translation_prompt(text: str) -> str:
    return TRANSLATION_PROMPT_TEMPLATE.format(text=text)
