SHELL := /bin/bash

.PHONY: help install dev build test lint typecheck up down logs migrate seed deploy-staging deploy-prod

help:
	@echo "AnnexEvoice — make targets"
	@echo "  install          pnpm install"
	@echo "  dev              start all apps in watch mode"
	@echo "  up               start Postgres + Redis + Mailpit (dev compose)"
	@echo "  down             stop dev compose"
	@echo "  logs             tail compose logs"
	@echo "  migrate          prisma migrate deploy"
	@echo "  seed             prisma seed"
	@echo "  test / lint / typecheck / build  turbo passthroughs"
	@echo "  deploy-staging   kick a staging deploy (CI usually does this)"
	@echo "  deploy-prod      kick a production deploy (tag required)"

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

typecheck:
	pnpm typecheck

up:
	docker compose -f infra/compose/docker-compose.dev.yml up -d

down:
	docker compose -f infra/compose/docker-compose.dev.yml down

logs:
	docker compose -f infra/compose/docker-compose.dev.yml logs -f --tail=200

migrate:
	pnpm db:migrate

seed:
	pnpm db:seed

deploy-staging:
	gh workflow run deploy-staging.yml

deploy-prod:
	@echo "Push a signed tag vX.Y.Z to trigger production deploy with approval"
	@echo "Example: git tag -s v0.1.0 -m 'AnnexEvoice v0.1.0' && git push origin v0.1.0"
