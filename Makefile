.PHONY: verify lint typecheck test security backend-verify frontend-verify all

# Default target
verify: backend-verify

backend-verify:
	@echo "==> Running Ruff Lint..."
	python -m ruff check backend/app
	@echo "==> Running Mypy Typecheck..."
	python -m mypy backend/app --ignore-missing-imports
	@echo "==> Running Bandit SAST Scan..."
	python -m bandit -r backend/app -ll -ii
	@echo "==> Running Pytest with >=90% Branch Coverage..."
	python -m pytest backend/tests --cov=app --cov-branch --cov-report=term-missing --cov-fail-under=90

frontend-verify:
	@echo "==> Verifying Frontend..."
	cd frontend && npm run verify

all: backend-verify frontend-verify
