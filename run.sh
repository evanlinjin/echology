#!/bin/bash

# curl https://bitcoincore.org/bin/bitcoin-core-23.2/bitcoin-23.2-x86_64-linux-gnu.tar.gz --output bitcoin.tar.gz && tar -xvzf bitcoin.tar.gz
# export ECHO_BITCOIND="$(pwd)/bitcoin-23.2/bin/bitcoind"
export ECHO_BITCOIND="$(pwd)/bitcoind"
export ECHO_BLOCKTIME=120 # seconds
export ECHO_BIND="127.0.0.1:8080"
# export ECHO_TLS_CERT=""
# export ECHO_TLS_KEY=""
export ECHO_STATIC="$(pwd)/static"
cargo run
