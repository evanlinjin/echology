#!/usr/bin/env bash

source ./deploy/config.sh

revert_state() {
    kill $(cat "${BITCOIND_DATADIR}/regtest/bitcoind.pid")
    rm -rf "${BITCOIND_DATADIR}"
}
mkdir -p "${BITCOIND_DATADIR}" || exit 1
trap revert_state SIGINT SIGTERM EXIT

# --txindex
"${BITCOIND_EXE}" \
    --datadir="${BITCOIND_DATADIR}" \
    --fallbackfee=0.00001 \
    --port=18444 \
    --chain=regtest \
    --rpcport=18443 \
    --rpcthreads=8 \
    --server
