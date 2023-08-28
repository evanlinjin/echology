#!/bin/bash

export BITCOIND_EXE="bitcoin-core.daemon"
export BITCOIND_CLI="bitcoin-core.cli"
export BITCOIND_DATADIR="$(pwd)/data"

export ECHO_BLOCKTIME=120 # seconds
export ECHO_BIND="127.0.0.1:8080" # api
export ECHO_BITCOIND_RPC="0.0.0.0:18443"
export ECHO_BITCOIND_COOKIE="${BITCOIND_DATADIR}/regtest/.cookie"

end_bitcoind() {
    kill $(cat "${BITCOIND_DATADIR}/regtest/bitcoind.pid")
    rm -rf "${BITCOIND_DATADIR}"
}

trap end_bitcoind SIGINT SIGTERM EXIT

mkdir -p "${BITCOIND_DATADIR}" || exit

echo "start: bitcoind"
"${BITCOIND_EXE}" \
    --datadir="${BITCOIND_DATADIR}" \
    --daemonwait \
    --txindex \
    --fallbackfee=0.00001 \
    --port=18444 \
    --chain=regtest \
    --rpcport=18443 \
    --rpcthreads=8 \
    --server || exit 1

echo "start: echology"
cargo run -r
