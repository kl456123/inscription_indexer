# inscription_indexer

## Installation

```
# prepare env
cp .env.example .env
# MAINNET_URL=xxx

# run server and parse inscription
yarn && yarn start

# start postgres
docker run --name postgresql -p 5432:5432 -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test --rm -d postgres

# fetch info from server
yarn client
```
