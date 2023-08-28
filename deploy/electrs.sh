#!/usr/bin/env bash

source ./deploy/config.sh

ORIGINAL_PWD=$(pwd)
revert_state() {
    cd "${ORIGINAL_PWD}"
    rm -rf electrs
}
trap revert_state SIGINT SIGTERM EXIT

git clone https://github.com/blockstream/electrs || exit 1
cd electrs || exit 1
git checkout new-index || exit 1

cargo run -r --bin electrs -- \
    --daemon-dir="${BITCOIND_DATADIR}" \
    --network=regtest \
    --cors="*" \
    --http-addr="${ELECTRS_BIND}"
