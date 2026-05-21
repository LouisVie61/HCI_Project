from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import MagicMock
from uuid import uuid4

from models import Flashcard, UserFlashcardScore
from repositories.flashcard import DEFAULT_FLASHCARDS, FlashcardRepository


class FlashcardRepositoryTest(TestCase):
    def test_seed_defaults_adds_cards_when_table_is_empty(self):
        db = MagicMock()
        db.query.return_value.first.return_value = None
        repo = FlashcardRepository(db)

        repo.seed_defaults_if_empty()

        db.add_all.assert_called_once()
        seeded_cards = list(db.add_all.call_args.args[0])
        self.assertEqual(len(seeded_cards), len(DEFAULT_FLASHCARDS))
        self.assertTrue(all(isinstance(card, Flashcard) for card in seeded_cards))
        self.assertEqual(seeded_cards[0].word, DEFAULT_FLASHCARDS[0]["word"])
        db.commit.assert_called_once()

    def test_seed_defaults_does_not_insert_when_table_has_data(self):
        db = MagicMock()
        db.query.return_value.first.return_value = Flashcard(
            word="Hello",
            sign_data={"label": "hello"},
        )
        repo = FlashcardRepository(db)

        repo.seed_defaults_if_empty()

        db.add_all.assert_not_called()
        db.commit.assert_not_called()

    def test_get_random_cards_seeds_and_limits_query(self):
        db = MagicMock()
        cards = [
            Flashcard(word="Hello", sign_data={"label": "hello"}),
            Flashcard(word="Yes", sign_data={"label": "yes"}),
        ]
        query = db.query.return_value
        query.order_by.return_value.limit.return_value.all.return_value = cards
        repo = FlashcardRepository(db)
        repo.seed_defaults_if_empty = MagicMock()

        result = repo.get_random_cards(limit=2)

        repo.seed_defaults_if_empty.assert_called_once()
        query.order_by.return_value.limit.assert_called_once_with(2)
        self.assertEqual(result, cards)

    def test_get_user_score_returns_existing_score(self):
        user_id = uuid4()
        existing_score = UserFlashcardScore(
            user_id=user_id,
            total_score=5,
            attempts=2,
        )
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = existing_score
        repo = FlashcardRepository(db)

        result = repo.get_user_score(user_id)

        self.assertEqual(result, existing_score)
        db.add.assert_not_called()
        db.commit.assert_not_called()

    def test_get_user_score_creates_score_when_missing(self):
        user_id = uuid4()
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        repo = FlashcardRepository(db)

        result = repo.get_user_score(user_id)

        self.assertIsInstance(result, UserFlashcardScore)
        self.assertEqual(result.user_id, user_id)
        self.assertEqual(result.total_score, 0)
        self.assertEqual(result.attempts, 0)
        db.add.assert_called_once_with(result)
        db.commit.assert_called_once()
        db.refresh.assert_called_once_with(result)

    def test_record_score_updates_total_and_attempts(self):
        user_id = uuid4()
        user_score = SimpleNamespace(
            user_id=user_id,
            total_score=4,
            attempts=1,
        )
        db = MagicMock()
        repo = FlashcardRepository(db)
        repo.get_user_score = MagicMock(return_value=user_score)

        result = repo.record_score(user_id=user_id, score=3)

        self.assertEqual(result.total_score, 7)
        self.assertEqual(result.attempts, 2)
        db.commit.assert_called_once()
        db.refresh.assert_called_once_with(user_score)


if __name__ == "__main__":
    import unittest

    unittest.main()
