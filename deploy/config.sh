BITCOIND_EXE="bitcoin-core.daemon"
BITCOIND_CLI="bitcoin-core.cli"
BITCOIND_DATADIR="$(pwd)/data"

ECHO_BLOCKTIME=120 # seconds
ECHO_BIND="0.0.0.0:8080" # api
ECHO_BITCOIND_RPC="0.0.0.0:18443"
ECHO_BITCOIND_COOKIE="${BITCOIND_DATADIR}/regtest/.cookie"

ELECTRS_BIND="0.0.0.0:3002"
ELECTRS_URL="0.0.0.0:3002"

# echology port: 3000
# esplora port: 5000
